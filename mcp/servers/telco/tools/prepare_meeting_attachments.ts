import {
  MeetingJudgement,
  MeetingParticipant,
  PrepareMeetingAttachmentsInput,
  Tool,
} from "./types";
import { toolError, toolResult } from "./meeting_result";

import { createZip } from "../../../lib/zip";
import fs from "fs";
import logger from "../../../logger/logger.js";
import path from "path";

const DEFAULT_MAX_TOTAL_BYTES = 20 * 1024 * 1024;
const ATTACHMENTS_DIR = "attachments";
const AUDIO_ARCHIVE_NAME = "meeting-audio.zip";
const MIX_FILE_STEM = "meeting-audio";
const JUDGEMENT_FILE_NAME = "llm-degerlendirmesi.txt";

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
  participants: MeetingParticipant[] | undefined,
): string {
  const match = participants?.find((p) => p.id === id);
  return match?.name ? `${match.name}-${id}` : id;
}

function formatJudgement(judgement: MeetingJudgement): string {
  const score = (label: string, value?: number | null) =>
    typeof value === "number" && !Number.isNaN(value)
      ? `| ${label.padEnd(21)} | ${`${Math.round(value)}/100`.padStart(18)} |`
      : `| ${label.padEnd(21)} | ${"Değerlendirilmedi".padStart(18)} |`;

  return [
    "╔══════════════════════════════════════════╗",
    "║          LLM DEĞERLENDİRMESİ             ║",
    "╚══════════════════════════════════════════╝",
    judgement.variant ? `Varyant: ${judgement.variant}` : "",
    "",
    "| Değerlendirme Ölçütü  |               Puan |",
    "|-----------------------|--------------------|",
    score("Toplantı Özeti", judgement.meeting_summary),
    score("Sonraki Adımlar", judgement.next_steps),
    score("Konular", judgement.topics),
    score("Öne Çıkanlar", judgement.highlights),
    score("Genel Değerlendirme", judgement.overall),
    score("Doğruluk", judgement.accuracy),
    judgement.reasoning
      ? `\nDEĞERLENDİRME NOTU\n-------------------\n${judgement.reasoning}`
      : null,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

export const prepareMeetingAttachmentsTool: Tool<PrepareMeetingAttachmentsInput> =
  {
    name: "TELCO:prepare_meeting_attachments",
    description:
      "Write the full meeting transcript, each speaker's transcript and the LLM judge's evaluation to .txt files on disk, and return them as a list of email attachment descriptors ({ filename, path }) that can be passed straight to GREY:send_email or GREY:send_email_ews. Meeting audio is NOT attached unless includeAudio is explicitly turned on",
    inputSchema: {
      type: "object",
      properties: {
        directoryPath: {
          type: "string",
          description:
            "Absolute path to the meeting directory containing the .wav files. Transcript .txt files and the audio zip are written into its 'attachments' subdirectory.",
        },
        full_meeting_transcript: {
          type: "string",
          description:
            "Combined transcript from transcribe_meeting. Pass through unchanged.",
        },
        speaker_transcripts: {
          type: "array",
          description:
            "Each participant's individual transcript from transcribe_meeting. Pass this array through unchanged.",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              transcript: { type: "string" },
            },
            required: ["id", "transcript"],
          },
        },
        participants: {
          type: "array",
          description:
            "Optional participants list from meeting metadata, used to put real names in the transcript file names.",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
            },
            required: ["id"],
          },
        },
        judgement: {
          type: "object",
          description:
            "The LLM judge's result from TELCO:judge_summary. Pass it through unchanged and it is written to a .txt file and attached alongside the transcripts.",
          properties: {
            variant: { type: "string" },
            meeting_summary: { type: "number" },
            next_steps: { type: ["number", "null"] },
            topics: { type: "number" },
            highlights: { type: "number" },
            overall: { type: "number" },
            accuracy: { type: "number" },
            reasoning: { type: "string" },
          },
        },
        includeAudio: {
          type: "boolean",
          description:
            "Whether to bundle the .wav audio files into meeting-audio.zip and attach it. Defaults to false - meeting audio is not emailed.",
        },
        maxTotalBytes: {
          type: "number",
          description:
            "Total attachment size budget in bytes. Attachments that would exceed it are reported in 'skipped' instead of attached. Defaults to 20971520 (20MB).",
        },
      },
      required: ["directoryPath"],
    },
    handler: async ({
      directoryPath,
      full_meeting_transcript,
      speaker_transcripts,
      participants,
      judgement,
      includeAudio = false,
      maxTotalBytes = DEFAULT_MAX_TOTAL_BYTES,
    }: PrepareMeetingAttachmentsInput) => {
      try {
        if (!directoryPath || !path.isAbsolute(directoryPath)) {
          return toolResult({
            error: "directoryPath must be an absolute path",
          });
        }

        if (!fs.existsSync(directoryPath)) {
          return toolResult({
            error: `Directory does not exist: ${directoryPath}`,
          });
        }

        logger.info(
          { tool: "TELCO:prepare_meeting_attachments", directoryPath, includeAudio },
          "Preparing meeting attachments",
        );

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
          add(
            filename,
            filePath,
            Buffer.byteLength(full_meeting_transcript, "utf8"),
          );
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
          add(
            JUDGEMENT_FILE_NAME,
            filePath,
            Buffer.byteLength(content, "utf8"),
          );
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

        return toolResult({
          attachments: attachments.map(({ filename, path: filePath }) => ({
            filename,
            path: filePath,
          })),
          audioArchive,
          skipped: skipped.length > 0 ? skipped : undefined,
          totalBytes: attachments.reduce((sum, a) => sum + a.bytes, 0),
          attachmentsDirectory: outputDir,
        });
      } catch (error) {
        logger.error(
          {
            tool: "TELCO:prepare_meeting_attachments",
            err: error instanceof Error ? error : new Error(String(error)),
            directoryPath,
          },
          "Failed to prepare meeting attachments",
        );

        return toolError(error);
      }
    },
  };
