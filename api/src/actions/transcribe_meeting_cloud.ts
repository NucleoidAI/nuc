import OpenAI from "openai";
import fs from "fs";
import os from "os";
import path from "path";

const MIX_FILE_STEM = "meeting-audio";
const DEFAULT_MODEL = "openai/whisper-large-v3";
/** Meetings are held in Turkish; without this whisper guesses per chunk. */
const DEFAULT_LANGUAGE = "tr";

/**
 * The transcription endpoint caps multipart uploads at 25MB and upstream
 * providers time out after 60s, so anything longer than a couple of minutes
 * has to go up in pieces. 120s of the 32kHz mono PCM that pcm_to_wav writes is
 * ~7.7MB, well inside both limits.
 */
const CHUNK_SECONDS = 120;
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const CHUNK_BYTE_BUDGET = Math.floor(MAX_UPLOAD_BYTES * 0.8);

/** Half-width of the window searched for a quiet sample to cut on. */
const CUT_SEARCH_SECONDS = 3;
/** Granularity of the loudness scan inside that window. */
const CUT_FRAME_MS = 20;

type WavInfo = {
  sampleRate: number;
  channels: number;
  bitDepth: number;
  blockAlign: number;
  dataOffset: number;
  dataSize: number;
};

/**
 * Transcript files are written next to the audio, so a re-run of the blueprint
 * on the same meeting directory reuses them instead of paying for the audio
 * again. Deleting a .txt is how you force that one file to be re-transcribed.
 */
function transcriptPathFor(directoryPath: string, stem: string): string {
  return path.join(directoryPath, `${stem}.txt`);
}

/**
 * Walks the RIFF chunk list rather than assuming pcm_to_wav's 44-byte header,
 * so files that carry extra chunks (LIST, fact) still split correctly. Returns
 * null for anything that isn't uncompressed PCM - those are sent whole.
 */
function readWavInfo(buf: Buffer): WavInfo | null {
  if (
    buf.length < 12 ||
    buf.toString("ascii", 0, 4) !== "RIFF" ||
    buf.toString("ascii", 8, 12) !== "WAVE"
  ) {
    return null;
  }

  let offset = 12;
  let fmt: { channels: number; sampleRate: number; bitDepth: number } | null =
    null;

  while (offset + 8 <= buf.length) {
    const id = buf.toString("ascii", offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    const body = offset + 8;

    if (id === "fmt " && body + 16 <= buf.length) {
      if (buf.readUInt16LE(body) !== 1) return null; // not PCM
      fmt = {
        channels: buf.readUInt16LE(body + 2),
        sampleRate: buf.readUInt32LE(body + 4),
        bitDepth: buf.readUInt16LE(body + 14),
      };
    } else if (id === "data") {
      if (!fmt || !fmt.channels || !fmt.sampleRate || !fmt.bitDepth) {
        return null;
      }
      const blockAlign = fmt.channels * (fmt.bitDepth / 8);
      return {
        ...fmt,
        blockAlign,
        dataOffset: body,
        dataSize: Math.min(size, buf.length - body),
      };
    }

    offset = body + size + (size % 2); // RIFF chunks are word-aligned
  }

  return null;
}

function buildWav(info: WavInfo, pcm: Buffer): Buffer {
  const header = Buffer.alloc(44);
  const byteRate = info.sampleRate * info.blockAlign;

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.byteLength, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(info.channels, 22);
  header.writeUInt32LE(info.sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(info.blockAlign, 32);
  header.writeUInt16LE(info.bitDepth, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.byteLength, 40);

  return Buffer.concat([header, pcm]);
}

/**
 * Nudges a cut off the fixed interval and onto the quietest nearby frame, so
 * chunk boundaries land in a pause instead of mid-word. Only 16-bit PCM is
 * scanned; anything else falls back to the exact offset.
 */
function findQuietCut(data: Buffer, info: WavInfo, target: number): number {
  if (info.bitDepth !== 16) return target;

  const bytesPerSecond = info.sampleRate * info.blockAlign;
  const search = CUT_SEARCH_SECONDS * bytesPerSecond;
  const frame = Math.max(
    info.blockAlign,
    Math.floor(((CUT_FRAME_MS / 1000) * bytesPerSecond) / info.blockAlign) *
      info.blockAlign
  );

  const from = Math.max(0, target - search);
  const to = Math.min(data.byteLength - frame, target + search);
  if (to <= from) return target;

  let bestOffset = target;
  let bestEnergy = Infinity;

  for (let offset = from; offset <= to; offset += frame) {
    let energy = 0;
    for (let i = offset; i + 1 < offset + frame; i += 2) {
      energy += Math.abs(data.readInt16LE(i));
    }
    // Ties go to the offset nearest the target, keeping chunks even.
    if (
      energy < bestEnergy ||
      (energy === bestEnergy &&
        Math.abs(offset - target) < Math.abs(bestOffset - target))
    ) {
      bestEnergy = energy;
      bestOffset = offset;
    }
  }

  return bestOffset - (bestOffset % info.blockAlign);
}

/**
 * Splits the PCM payload into upload-sized pieces. Returns an empty array when
 * the file already fits, meaning "send the original as-is".
 */
function splitPcm(buf: Buffer, info: WavInfo): Buffer[] {
  const bytesPerSecond = info.sampleRate * info.blockAlign;
  if (!bytesPerSecond) return [];

  const budgetSeconds = Math.floor(CHUNK_BYTE_BUDGET / bytesPerSecond);
  const chunkSeconds = Math.max(1, Math.min(CHUNK_SECONDS, budgetSeconds));
  const chunkBytes =
    Math.floor((chunkSeconds * bytesPerSecond) / info.blockAlign) *
    info.blockAlign;

  const data = buf.subarray(info.dataOffset, info.dataOffset + info.dataSize);
  if (data.byteLength <= chunkBytes) return [];

  const chunks: Buffer[] = [];
  let start = 0;

  while (start < data.byteLength) {
    const target = start + chunkBytes;
    let end =
      target >= data.byteLength
        ? data.byteLength
        : findQuietCut(data, info, target);

    // Guard against a quiet-cut search that lands at or before the start.
    if (end <= start) end = Math.min(target, data.byteLength);

    chunks.push(data.subarray(start, end));
    start = end;
  }

  return chunks;
}

async function transcribeUpload(
  client: OpenAI,
  filePath: string,
  model: string,
  language: string
): Promise<string> {
  const transcription = await client.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model,
    language,
  });

  return (transcription.text ?? "").trim();
}

async function transcribeWav(
  client: OpenAI,
  filePath: string,
  model: string,
  language: string
): Promise<string> {
  const buf = await fs.promises.readFile(filePath);
  const info = readWavInfo(buf);
  const chunks = info ? splitPcm(buf, info) : [];

  if (!info || chunks.length === 0) {
    if (buf.byteLength > MAX_UPLOAD_BYTES) {
      throw new Error(
        `File is ${Math.round(
          buf.byteLength / 1024 / 1024
        )}MB and could not be split ` +
          `(unsupported WAV format); the upload limit is 25MB`
      );
    }
    return transcribeUpload(client, filePath, model, language);
  }

  const tmpDir = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), "greycollar-asr-")
  );

  try {
    const parts: string[] = [];

    for (const [index, chunk] of chunks.entries()) {
      const chunkPath = path.join(
        tmpDir,
        `${path.basename(filePath, ".wav")}-${String(index).padStart(
          3,
          "0"
        )}.wav`
      );
      await fs.promises.writeFile(chunkPath, buildWav(info, chunk));

      const text = await transcribeUpload(client, chunkPath, model, language);
      if (text) parts.push(text);
    }

    return parts.join(" ");
  } finally {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  }
}

async function run({
  parameters: { directoryPath, model, language, force },
}: {
  parameters: {
    directoryPath: string;
    model?: string;
    language?: string;
    force?: boolean;
  };
}) {
  if (!path.isAbsolute(directoryPath)) {
    return { error: "directoryPath must be an absolute path" };
  }

  if (!fs.existsSync(directoryPath)) {
    return { error: `Directory does not exist: ${directoryPath}` };
  }

  const apiKey = process.env.ASR_API_KEY;
  if (!apiKey) {
    return { error: "ASR_API_KEY environment variable is not set" };
  }

  const wavFiles = fs
    .readdirSync(directoryPath)
    .filter((f) => f.toLowerCase().endsWith(".wav"))
    .sort();

  if (wavFiles.length === 0) {
    return { error: "No .wav files found in directory" };
  }

  const client = new OpenAI({
    apiKey,
    baseURL: process.env.ASR_ENDPOINT_URL || "https://openrouter.ai/api/v1",
    defaultHeaders: { "X-Title": "GreyCollar" },
  });

  const selectedModel = model || DEFAULT_MODEL;
  const selectedLanguage = language || DEFAULT_LANGUAGE;

  const speakerTranscripts: { id: string; transcript: string }[] = [];
  const fullParts: string[] = [];
  let mixTranscript: string | null = null;

  for (const file of wavFiles) {
    const stem = path.basename(file, ".wav");
    const filePath = path.join(directoryPath, file);
    const transcriptPath = transcriptPathFor(directoryPath, stem);

    let transcription: string;

    if (!force && fs.existsSync(transcriptPath)) {
      transcription = await fs.promises.readFile(transcriptPath, "utf8");
    } else {
      try {
        transcription = await transcribeWav(
          client,
          filePath,
          selectedModel,
          selectedLanguage
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return { error: `Failed on file ${file}: ${message}` };
      }
      await fs.promises.writeFile(transcriptPath, transcription, "utf8");
    }

    if (stem.toLowerCase() === MIX_FILE_STEM) {
      mixTranscript = transcription;
    } else {
      speakerTranscripts.push({ id: stem, transcript: transcription });
    }
    fullParts.push(transcription);
  }

  return {
    full_meeting_transcript: mixTranscript ?? fullParts.join(" "),
    speaker_transcripts: speakerTranscripts,
  };
}

export default { run };
