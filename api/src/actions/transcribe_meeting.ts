import fs from "fs";
import path from "path";
import asrOutput from "../../../asr_output.json";
const MOCK = false;

const POLL_INTERVAL_MS = 3_000;
const POLL_TIMEOUT_MS = 15 * 60_000;

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
  while (Date.now() < deadline) {
    const resultResponse = await fetch(`${baseUrl}/result/${jobId}`);

    if (!resultResponse.ok) {
      const details = await resultResponse.text();
      throw new Error(
        `ASR result fetch failed (${resultResponse.status}): ${details}`,
      );
    }

    const result = (await resultResponse.json()) as {
      transcript?: string;
    };

    if (result.transcript) {
      return result.transcript;
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error(`ASR job ${jobId} timed out after ${POLL_TIMEOUT_MS}ms`);
}

async function run({
  parameters: { directoryPath },
}: {
  parameters: { directoryPath: string };
}) {
  console.log("transcribe_meeting", directoryPath);
  console.log("MOCK", MOCK);
  if (MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 20_000));
    return {
      full_meeting_transcript: asrOutput.full_meeting_transcript,
      speaker_transcripts: asrOutput.speaker_transcripts,
    };
  }

  if (!path.isAbsolute(directoryPath)) {
    console.log("directoryPath", directoryPath);
    console.log(
      "path.isAbsolute(directoryPath)",
      path.isAbsolute(directoryPath),
    );
    return { error: "directoryPath must be an absolute path" };
  }

  if (!fs.existsSync(directoryPath)) {
    console.log("directoryPath", directoryPath);
    console.log("fs.existsSync(directoryPath)", fs.existsSync(directoryPath));
    return { error: `Directory does not exist: ${directoryPath}` };
  }

  const baseUrl = process.env.ASR_ENDPOINT_URL;
  console.log("baseUrl", baseUrl);
  if (!baseUrl) {
    return { error: "ASR_ENDPOINT_URL environment variable is not set" };
  }

  const wavFiles = fs
    .readdirSync(directoryPath)
    .filter((f) => f.toLowerCase().endsWith(".wav"))
    .sort();

  console.log("wavFiles", wavFiles);

  if (wavFiles.length === 0) {
    return { error: "No .wav files found in directory" };
  }

  // The recording pipeline saves the whole-meeting mix under the meeting's
  // own ID (same name as the directory) rather than a participant ID - it's
  // not a speaker and must not be treated as one.
  const meetingId = path.basename(directoryPath);

  console.log("meetingId", meetingId);

  const speakerTranscripts: { id: string; transcript: string }[] = [];
  const fullParts: string[] = [];
  let mixTranscript: string | null = null;

  for (const file of wavFiles) {
    const stem = path.basename(file, ".wav");
    const filePath = path.join(directoryPath, file);
    console.log("filePath", filePath);
    try {
      const transcription = await transcribeFile(filePath, baseUrl);
      console.log("transcription", transcription);
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
