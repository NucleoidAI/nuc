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
  meeting_summary?: number;
  next_steps?: number | null;
  highlights?: number;
  overall?: number;
  accuracy?: number;
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
  participants: Participant[] | undefined
): string {
  const match = participants?.find((p) => p.id === id);
  return match?.name ? `${match.name}-${id}` : id;
}

const REPORT_WIDTH = 72;
const LABEL_WIDTH = 28;
const BAR_WIDTH = 26;
const SCORE_WIDTH = 8;

function banner(title: string): string[] {
  const inner = REPORT_WIDTH - 2;
  const left = Math.floor((inner - title.length) / 2);
  const right = inner - title.length - left;
  return [
    `╔${"═".repeat(inner)}╗`,
    `║${" ".repeat(left)}${title}${" ".repeat(right)}║`,
    `╚${"═".repeat(inner)}╝`,
  ];
}

function wrapText(text: string, width: number): string[] {
  return text.split(/\n+/).flatMap((paragraph) =>
    paragraph
      .split(/\s+/)
      .filter(Boolean)
      .reduce<string[]>((lines, word) => {
        const last = lines[lines.length - 1];
        if (last === undefined) return [word];
        if (last.length + 1 + word.length <= width) {
          lines[lines.length - 1] = `${last} ${word}`;
          return lines;
        }
        lines.push(word);
        return lines;
      }, [])
  );
}

function grade(value: number): string {
  if (value >= 85) return "çok iyi";
  if (value >= 70) return "iyi";
  if (value >= 50) return "orta";
  if (value >= 30) return "zayıf";
  return "yetersiz";
}

function isScored(value?: number | null): value is number {
  return typeof value === "number" && !Number.isNaN(value);
}

function tableRow(
  left: string,
  middle: string,
  right: string,
  edges = "││││"
): string {
  return `${edges[0]} ${left.padEnd(LABEL_WIDTH)} ${edges[1]} ${middle.padEnd(
    BAR_WIDTH
  )} ${edges[2]} ${right.padStart(SCORE_WIDTH)} ${edges[3]}`;
}

function tableRule(left: string, mid: string, right: string): string {
  return (
    left +
    "─".repeat(LABEL_WIDTH + 2) +
    mid +
    "─".repeat(BAR_WIDTH + 2) +
    mid +
    "─".repeat(SCORE_WIDTH + 2) +
    right
  );
}

function scoreRow(label: string, value?: number | null): string {
  if (!isScored(value)) {
    return tableRow(label, "değerlendirilmedi", "—");
  }
  const rounded = Math.max(0, Math.min(100, Math.round(value)));
  const filled = Math.round((rounded / 100) * BAR_WIDTH);
  return tableRow(
    label,
    "█".repeat(filled) + "░".repeat(BAR_WIDTH - filled),
    `${rounded}/100`
  );
}

function formatTranscript(
  title: string,
  meta: string[],
  transcript: string
): string {
  const words = transcript.split(/\s+/).filter(Boolean).length;
  return [
    ...banner(title),
    "",
    ...meta,
    `Kelime    : ${words.toLocaleString("tr-TR")}`,
    "",
    "─".repeat(REPORT_WIDTH),
    "",
    ...wrapText(transcript.trim(), REPORT_WIDTH),
    "",
  ].join("\n");
}

function formatJudgement(judgement: Judgement): string {
  const meta = [
    judgement.variant ? `Varyant   : ${judgement.variant}` : null,
    `Tarih     : ${new Date().toLocaleString("tr-TR", {
      dateStyle: "medium",
      timeStyle: "short",
    })}`,
    isScored(judgement.overall)
      ? `Sonuç     : ${Math.round(judgement.overall)}/100 (${grade(
          judgement.overall
        )})`
      : null,
  ].filter((line): line is string => line !== null);

  const reasoning = judgement.reasoning?.trim()
    ? [
        "",
        "DEĞERLENDİRME NOTU",
        "─".repeat(REPORT_WIDTH),
        ...wrapText(judgement.reasoning.trim(), REPORT_WIDTH),
      ]
    : [];

  return [
    ...banner("LLM DEĞERLENDİRME RAPORU"),
    "",
    ...meta,
    "",
    tableRule("┌", "┬", "┐"),
    tableRow("ÖLÇÜT", "DEĞERLENDİRME", "PUAN"),
    tableRule("├", "┼", "┤"),
    scoreRow("Toplantı Özeti", judgement.meeting_summary),
    scoreRow("Sonraki Adımlar", judgement.next_steps),
    scoreRow("Konular / Öne Çıkanlar", judgement.highlights),
    scoreRow("Doğruluk", judgement.accuracy),
    tableRule("├", "┼", "┤"),
    scoreRow("Genel Değerlendirme", judgement.overall),
    tableRule("└", "┴", "┘"),
    ...reasoning,
    "",
  ].join("\n");
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
    const content = formatTranscript(
      "TOPLANTI TRANSKRİPTİ",
      [
        `Kayıt     : Tüm toplantı`,
        ...(participants?.length
          ? [
              `Katılımcı : ${participants
                .map((p) => p.name || p.id)
                .join(", ")}`,
            ]
          : []),
      ],
      full_meeting_transcript
    );
    await fs.promises.writeFile(filePath, content, "utf8");
    add(filename, filePath, Buffer.byteLength(content, "utf8"));
  }

  for (const { id, transcript } of speaker_transcripts ?? []) {
    if (!transcript) continue;
    const label = displayName(id, participants);
    const filename = `${safeName(label)}-transcript.txt`;
    const filePath = path.join(outputDir, filename);
    const content = formatTranscript(
      "KATILIMCI TRANSKRİPTİ",
      [
        `Katılımcı : ${participants?.find((p) => p.id === id)?.name || id}`,
        `Kimlik    : ${id}`,
      ],
      transcript
    );
    await fs.promises.writeFile(filePath, content, "utf8");
    add(filename, filePath, Buffer.byteLength(content, "utf8"));
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
        archivePath
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
