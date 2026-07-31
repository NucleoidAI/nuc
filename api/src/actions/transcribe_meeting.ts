import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";
import asrOutput from "../../../asr_output.json";
const MOCK = true;

const execFileAsync = promisify(execFile);

async function compressToMp3(filePath: string): Promise<string> {
  const outPath = path.join(os.tmpdir(), `${crypto.randomUUID()}.mp3`);
  await execFileAsync("ffmpeg", [
    "-y",
    "-i",
    filePath,
    "-ac",
    "1",
    "-b:a",
    "64k",
    outPath,
  ]);
  return outPath;
}

async function transcribeFile(
  filePath: string,
  endpointUrl: string,
  apiKey: string | undefined,
): Promise<string> {
  const model = process.env.ASR_MODEL || "gpt-4o-transcribe";

  const headers: Record<string, string> = {};
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const mp3Path = await compressToMp3(filePath);
  try {
    const audioBuffer = await fs.promises.readFile(mp3Path);
    const form = new FormData();
    form.append(
      "file",
      new Blob([audioBuffer], { type: "audio/mpeg" }),
      path.basename(mp3Path),
    );
    form.append("model", model);

    const response = await fetch(endpointUrl, {
      method: "POST",
      headers,
      body: form,
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(
        `ASR transcription failed (${response.status}): ${details}`,
      );
    }

    const result = (await response.json()) as { text: string };
    return result.text;
  } finally {
    await fs.promises.unlink(mp3Path).catch(() => {});
  }
}

async function run({
  parameters: { directoryPath },
}: {
  parameters: { directoryPath: string };
}) {
  if (MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 20_000));
    return {
      full_meeting_transcript: asrOutput.full_meeting_transcript,
      speaker_transcripts: asrOutput.speaker_transcripts,
    };
  }

  if (!path.isAbsolute(directoryPath)) {
    return { error: "directoryPath must be an absolute path" };
  }

  if (!fs.existsSync(directoryPath)) {
    return { error: `Directory does not exist: ${directoryPath}` };
  }

  const endpointUrl = process.env.ASR_ENDPOINT_URL;
  if (!endpointUrl) {
    return { error: "ASR_ENDPOINT_URL environment variable is not set" };
  }

  const apiKey =
    process.env.ASR_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.OPENROUTER_API_KEY;

  const wavFiles = fs
    .readdirSync(directoryPath)
    .filter((f) => f.toLowerCase().endsWith(".wav"))
    .sort();

  if (wavFiles.length === 0) {
    return { error: "No .wav files found in directory" };
  }

  // The recording pipeline saves the whole-meeting mix under the meeting's
  // own ID (same name as the directory) rather than a participant ID - it's
  // not a speaker and must not be treated as one.
  const meetingId = path.basename(directoryPath);

  const speakerTranscripts: { id: string; transcript: string }[] = [];
  const fullParts: string[] = [];
  let mixTranscript: string | null = null;

  for (const file of wavFiles) {
    const stem = path.basename(file, ".wav");
    const filePath = path.join(directoryPath, file);
    try {
      const transcription = await transcribeFile(filePath, endpointUrl, apiKey);
      if (stem === meetingId) {
        mixTranscript = transcription;
      } else {
        speakerTranscripts.push({ id: stem, transcript: transcription });
      }
      fullParts.push(transcription);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { error: `Failed on file ${file}: ${message}` };
    }
  }

  return {
    full_meeting_transcript: mixTranscript ?? fullParts.join("\n\n"),
    speaker_transcripts: speakerTranscripts,
  };
}

export default { run };
