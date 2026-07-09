import FormData from "form-data";
import axios from "axios";
import fs from "fs";
import path from "path";

async function transcribeFile(
  filePath: string,
  endpointUrl: string,
  authHeader: Record<string, string>,
): Promise<string> {
  const form = new FormData();
  form.append("model_id", "scribe_v2");
  form.append("file", fs.createReadStream(filePath), {
    filename: path.basename(filePath),
    contentType: "audio/wav",
  });

  const response = await axios({
    method: "POST",
    url: endpointUrl,
    headers: { ...authHeader, ...form.getHeaders() },
    data: form,
  });

  return (response.data as { text: string }).text;
}

async function run({
  parameters: { directoryPath },
}: {
  parameters: { directoryPath: string };
}) {
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

  const authHeader: Record<string, string> = {};
  if (process.env.ASR_API_KEY) {
    authHeader["xi-api-key"] = process.env.ASR_API_KEY;
  }

  const wavFiles = fs
    .readdirSync(directoryPath)
    .filter((f) => f.toLowerCase().endsWith(".wav"))
    .sort();

  if (wavFiles.length === 0) {
    return { error: "No .wav files found in directory" };
  }

  const result: Record<string, string> = {};
  const fullParts: string[] = [];

  for (const file of wavFiles) {
    const stem = path.basename(file, ".wav");
    const filePath = path.join(directoryPath, file);
    try {
      const transcription = await transcribeFile(
        filePath,
        endpointUrl,
        authHeader,
      );
      result[`user_${stem}_transcript`] = transcription;
      fullParts.push(transcription);
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { status: number; data: unknown };
        message: string;
      };
      return {
        error: `Failed on file ${file}: ${axiosErr.message}`,
        status: axiosErr.response?.status,
        details: axiosErr.response?.data,
      };
    }
  }

  return {
    full_meeting_transcript: fullParts.join("\n\n"),
    ...result,
  };
}

export default { run };
