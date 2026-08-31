import fs from "fs";
import path from "path";
const MOCK = false;

const POLL_INTERVAL_MS = 3_000;
const POLL_TIMEOUT_MS = 10 * 60_000;
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

async function run({
  parameters: { directoryPath, force, includeSpeakerTranscripts = true },
}: {
  parameters: {
    directoryPath: string;
    force?: boolean;
    includeSpeakerTranscripts?: boolean;
  };
}) {
  console.log("transcribe_meeting", directoryPath);
  console.log("MOCK", MOCK);
  if (MOCK) {
    const asrOutput = JSON.parse(
      await fs.promises.readFile(
        path.join(__dirname, "../../../asr_output.json"),
        "utf8",
      ),
    );
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

  const baseUrl = process.env.ASR_LOCAL_ENDPOINT_URL;

  console.log("baseUrl", baseUrl);
  if (!baseUrl) {
    return { error: "ASR_LOCAL_ENDPOINT_URL environment variable is not set" };
  }

  const allWavFiles = fs
    .readdirSync(directoryPath)
    .filter((f) => f.toLowerCase().endsWith(".wav"))
    .sort();

  if (allWavFiles.length === 0) {
    return { error: "No .wav files found in directory" };
  }

  const wavFiles = includeSpeakerTranscripts
    ? allWavFiles
    : allWavFiles.filter(
        (file) => path.basename(file, ".wav").toLowerCase() === MIX_FILE_STEM,
      );

  if (wavFiles.length === 0) {
    return {
      error:
        "meeting-audio.wav is required when includeSpeakerTranscripts is false",
    };
  }

  console.log("wavFiles", wavFiles);

  const speakerTranscripts: { id: string; transcript: string }[] = [];
  const fullParts: string[] = [];
  let mixTranscript: string | null = null;

  for (const file of wavFiles) {
    const stem = path.basename(file, ".wav");
    const filePath = path.join(directoryPath, file);
    const transcriptPath = path.join(directoryPath, `${stem}.txt`);
    console.log("filePath", filePath);

    let transcription: string;

    if (!force && fs.existsSync(transcriptPath)) {
      console.log("reusing transcript", transcriptPath);
      transcription = await fs.promises.readFile(transcriptPath, "utf8");
    } else {
      try {
        transcription = await transcribeFile(filePath, baseUrl);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return { error: `Failed on file ${file}: ${message}` };
      }
      await fs.promises.writeFile(transcriptPath, transcription, "utf8");
    }

    console.log("transcription", transcription);

    if (stem.toLowerCase() === MIX_FILE_STEM) {
      mixTranscript = transcription;
    } else {
      speakerTranscripts.push({ id: stem, transcript: transcription });
    }
    fullParts.push(transcription);
  }

  return {
    full_meeting_transcript: mixTranscript ?? fullParts.join("\n\n"),
    speaker_transcripts: speakerTranscripts,
  };
}

export default { run };
