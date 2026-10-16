import { SpeakerTranscript, Tool, TranscribeMeetingInput } from "./types";
import { toolError, toolResult } from "./meeting_result";

import fs from "fs";
import { randomUUID } from "crypto";
import logger from "../../../logger/logger.js";
import path from "path";

const MOCK = false;

const POLL_INTERVAL_MS = 3_000;
const POLL_TIMEOUT_MS = 9 * 60_000;
const MAX_CONSECUTIVE_SERVER_ERRORS = 5;

const MIX_FILE_STEM = "meeting-audio";

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function transcribeFile(
  filePath: string,
  baseUrl: string,
): Promise<string> {
  const audioBuffer = await fs.promises.readFile(filePath);
  const form = new FormData();
  form.append(
    "file",
    new Blob([audioBuffer], { type: "audio/wav" }),
    path.basename(filePath),
  );

  const submitResponse = await fetch(`${baseUrl}/transcribe`, {
    method: "POST",
    body: form,
  });

  if (!submitResponse.ok) {
    const details = await submitResponse.text();
    throw new Error(
      `ASR job submission failed (${submitResponse.status}): ${details}`,
    );
  }

  const { job_id: jobId } = (await submitResponse.json()) as {
    job_id?: string;
  };
  if (!jobId) {
    throw new Error("ASR job submission did not return a job_id");
  }

  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let consecutiveServerErrors = 0;

  while (Date.now() < deadline) {
    const resultResponse = await fetch(`${baseUrl}/result/${jobId}`);

    if (resultResponse.status === 200) {
      const result = (await resultResponse.json()) as {
        transcript?: string;
      };

      return result.transcript ?? "";
    }

    if (resultResponse.status >= 500) {
      consecutiveServerErrors += 1;
      if (consecutiveServerErrors >= MAX_CONSECUTIVE_SERVER_ERRORS) {
        const details = await resultResponse.text();
        throw new Error(
          `ASR result fetch failed ${consecutiveServerErrors} times in a row (${resultResponse.status}): ${details}`,
        );
      }
    } else {
      consecutiveServerErrors = 0;
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error(`ASR job ${jobId} timed out after ${POLL_TIMEOUT_MS}ms`);
}

async function replaceFile(target: string, content: string): Promise<void> {
  const temp = path.join(
    path.dirname(target),
    `.${path.basename(target)}.${randomUUID()}.tmp`,
  );
  await fs.promises.writeFile(temp, content, { encoding: "utf8", flag: "wx" });
  try {
    await fs.promises.rename(temp, target);
  } catch (err) {
    await fs.promises.rm(temp, { force: true });
    throw err;
  }
}

export const transcribeMeetingTool: Tool<TranscribeMeetingInput> = {
  name: "TELCO:transcribe_meeting",
  description:
    "Transcribe WAV audio files in a directory with the self-hosted ASR service, write each transcript as a .txt file next to the audio (replacing any existing one), and return the individual and combined transcripts. Speaker recordings can be skipped when only the mixed meeting transcript is needed.",
  inputSchema: {
    type: "object",
    properties: {
      directoryPath: {
        type: "string",
        description:
          "Absolute path to the directory containing .wav files. The .txt transcripts are written into this same directory.",
      },
      includeSpeakerTranscripts: {
        type: "boolean",
        description:
          "Whether to transcribe participant WAV files in addition to meeting-audio.wav. Defaults to true. Set to false when only the mixed full-meeting transcript is needed.",
      },
    },
    required: ["directoryPath"],
  },
  handler: async ({
    directoryPath,
    includeSpeakerTranscripts = true,
  }: TranscribeMeetingInput) => {
    try {
      logger.info(
        { tool: "TELCO:transcribe_meeting", directoryPath, mock: MOCK },
        "Transcribing meeting audio",
      );

      if (MOCK) {
        const asrOutput = JSON.parse(
          await fs.promises.readFile(
            path.join(__dirname, "../../../../asr_output.json"),
            "utf8",
          ),
        );
        await sleep(20_000);
        return toolResult({
          full_meeting_transcript: asrOutput.full_meeting_transcript,
          speaker_transcripts: asrOutput.speaker_transcripts,
        });
      }

      if (!path.isAbsolute(directoryPath)) {
        return toolResult({
          error: "directoryPath must be an absolute path",
        });
      }

      if (!fs.existsSync(directoryPath)) {
        return toolResult({
          error: `Directory does not exist: ${directoryPath}`,
        });
      }

      const baseUrl = process.env.ASR_LOCAL_ENDPOINT_URL;

      if (!baseUrl) {
        return toolResult({
          error: "ASR_LOCAL_ENDPOINT_URL environment variable is not set",
        });
      }

      const allWavFiles = fs
        .readdirSync(directoryPath)
        .filter((f) => f.toLowerCase().endsWith(".wav"))
        .sort();

      if (allWavFiles.length === 0) {
        return toolResult({ error: "No .wav files found in directory" });
      }

      const wavFiles = includeSpeakerTranscripts
        ? allWavFiles
        : allWavFiles.filter(
            (file) =>
              path.basename(file, ".wav").toLowerCase() === MIX_FILE_STEM,
          );

      if (wavFiles.length === 0) {
        return toolResult({
          error:
            "meeting-audio.wav is required when includeSpeakerTranscripts is false",
        });
      }

      logger.info(
        { tool: "TELCO:transcribe_meeting", wavFiles },
        "Resolved WAV files to transcribe",
      );

      const speakerTranscripts: SpeakerTranscript[] = [];
      const fullParts: string[] = [];
      let mixTranscript: string | null = null;

      for (const file of wavFiles) {
        const stem = path.basename(file, ".wav");
        const filePath = path.join(directoryPath, file);
        const transcriptPath = path.join(directoryPath, `${stem}.txt`);

        let transcription: string;

        try {
          transcription = await transcribeFile(filePath, baseUrl);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          return toolResult({
            error: `Failed on file ${file}: ${message}`,
          });
        }
        await replaceFile(transcriptPath, transcription);

        if (stem.toLowerCase() === MIX_FILE_STEM) {
          mixTranscript = transcription;
        } else {
          speakerTranscripts.push({ id: stem, transcript: transcription });
        }
        fullParts.push(transcription);
      }

      return toolResult({
        full_meeting_transcript: mixTranscript ?? fullParts.join("\n\n"),
        speaker_transcripts: speakerTranscripts,
      });
    } catch (error) {
      logger.error(
        {
          tool: "TELCO:transcribe_meeting",
          err: error instanceof Error ? error : new Error(String(error)),
          directoryPath,
        },
        "Failed to transcribe meeting",
      );

      return toolError(error);
    }
  },
};
