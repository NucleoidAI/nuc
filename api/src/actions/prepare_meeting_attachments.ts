import { createZip } from "../lib/zip";
import fs from "fs";
import path from "path";

const DEFAULT_MAX_TOTAL_BYTES = 20 * 1024 * 1024;
const ATTACHMENTS_DIR = "attachments";
const AUDIO_ARCHIVE_NAME = "meeting-audio.zip";
const MIX_FILE_STEM = "meeting-audio";
const JUDGEMENT_FILE_NAME = "llm-degerlendirmesi.txt";

type SpeakerTranscript = { id: string; transcript: string };
type Judgement = {
  variant?: string | null;
  faithfulness?: number;
  coverage?: number;
  clarity?: number;
  overall?: number;
  reasoning?: string;
};
type Participant = { id: string; name?: string };
type Attachment = { filename: string; path: string; bytes: number };

function safeName(value: string): string {
  return (
    value
      .trim()
      .replace(/[^\p{L}\p{N}._-]+/gu, "-")
      .replace(/^-+|-+$/g, "") || "unknown"
  );
}

function displayName(
  id: string,
  participants: Participant[] | undefined,
): string {
  const match = participants?.find((p) => p.id === id);
  return match?.name ? `${match.name}-${id}` : id;
}

function formatJudgement(judgement: Judgement): string {
  const score = (label: string, value?: number) =>
    typeof value === "number" && !Number.isNaN(value)
      ? `${label}: ${Math.round(value)}/100`
      : null;

  return [
    "LLM DEĞERLENDİRMESİ",
    judgement.variant ? `Varyant: ${judgement.variant}` : null,
    "",
    score("Genel", judgement.overall),
    score("Sadakat", judgement.faithfulness),
    score("Kapsam", judgement.coverage),
    score("Anlaşılırlık", judgement.clarity),
    judgement.reasoning ? `\nGerekçe:\n${judgement.reasoning}` : null,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

async function run({
  parameters: {
    directoryPath,
    full_meeting_transcript,
    speaker_transcripts,
    participants,
    judgement,
    includeAudio = false,
    maxTotalBytes = DEFAULT_MAX_TOTAL_BYTES,
  },
}: {
  parameters: {
    directoryPath: string;
    full_meeting_transcript?: string;
    speaker_transcripts?: SpeakerTranscript[];
    participants?: Participant[];
    judgement?: Judgement;
    includeAudio?: boolean;
    maxTotalBytes?: number;
  };
}) {
  if (!directoryPath || !path.isAbsolute(directoryPath)) {
    return { error: "directoryPath must be an absolute path" };
  }

  if (!fs.existsSync(directoryPath)) {
    return { error: `Directory does not exist: ${directoryPath}` };
  }

  const outputDir = path.join(directoryPath, ATTACHMENTS_DIR);
  await fs.promises.mkdir(outputDir, { recursive: true });

  const attachments: Attachment[] = [];
  const skipped: { filename: string; reason: string }[] = [];

  const add = (filename: string, filePath: string, bytes: number) => {
    const total = attachments.reduce((sum, a) => sum + a.bytes, 0);
    if (total + bytes > maxTotalBytes) {
      skipped.push({
        filename,
        reason: `would exceed maxTotalBytes (${maxTotalBytes} bytes)`,
      });
      return;
    }
    attachments.push({ filename, path: filePath, bytes });
  };

  // Transcripts are written to disk so they can be attached by path instead of
  // being carried through the LLM context.
  if (full_meeting_transcript) {
    const filename = "full-meeting-transcript.txt";
    const filePath = path.join(outputDir, filename);
    await fs.promises.writeFile(filePath, full_meeting_transcript, "utf8");
    add(filename, filePath, Buffer.byteLength(full_meeting_transcript, "utf8"));
  }

  for (const { id, transcript } of speaker_transcripts ?? []) {
    if (!transcript) continue;
    const filename = `${safeName(
      displayName(id, participants),
    )}-transcript.txt`;
    const filePath = path.join(outputDir, filename);
    await fs.promises.writeFile(filePath, transcript, "utf8");
    add(filename, filePath, Buffer.byteLength(transcript, "utf8"));
  }

  if (judgement && Object.keys(judgement).length > 0) {
    const content = formatJudgement(judgement);
    const filePath = path.join(outputDir, JUDGEMENT_FILE_NAME);
    await fs.promises.writeFile(filePath, content, "utf8");
    add(JUDGEMENT_FILE_NAME, filePath, Buffer.byteLength(content, "utf8"));
  }

  let audioArchive:
    | { filename: string; entries: string[]; bytes: number }
    | undefined;

  if (includeAudio) {
    const wavFiles = fs
      .readdirSync(directoryPath)
      .filter((f) => f.toLowerCase().endsWith(".wav"))
      .sort((a, b) => {
        // Keep the mixed meeting audio first inside the archive.
        const aStem = path.basename(a, path.extname(a)).toLowerCase();
        const bStem = path.basename(b, path.extname(b)).toLowerCase();
        if (aStem === MIX_FILE_STEM) return -1;
        if (bStem === MIX_FILE_STEM) return 1;
        return a.localeCompare(b);
      });

    if (wavFiles.length > 0) {
      const archivePath = path.join(outputDir, AUDIO_ARCHIVE_NAME);
      const archive = await createZip(
        wavFiles.map((file) => ({
          name: file,
          path: path.join(directoryPath, file),
        })),
        archivePath,
      );

      audioArchive = {
        filename: AUDIO_ARCHIVE_NAME,
        entries: archive.entries,
        bytes: archive.bytes,
      };
      add(AUDIO_ARCHIVE_NAME, archivePath, archive.bytes);
    }
  }

  return {
    attachments: attachments.map(({ filename, path: filePath }) => ({
      filename,
      path: filePath,
    })),
    audioArchive,
    skipped: skipped.length > 0 ? skipped : undefined,
    totalBytes: attachments.reduce((sum, a) => sum + a.bytes, 0),
    attachmentsDirectory: outputDir,
  };
}

export default { run };
