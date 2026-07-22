import FormData from "form-data";
import axios from "axios";
import fs from "fs";
import path from "path";

const PROVIDER: "elevenlabs" | "local-whisper" = "local-whisper";

async function run({
  parameters: { inputPath },
}: {
  parameters: { inputPath: string };
}) {
  if (!path.isAbsolute(inputPath)) {
    return { error: "inputPath must be an absolute path" };
  }

  if (!fs.existsSync(inputPath)) {
    return { error: `Input file does not exist: ${inputPath}` };
  }

  const stat = fs.statSync(inputPath);
  if (!stat.isFile()) {
    return { error: "inputPath must point to a file, not a directory" };
  }

  const endpointUrl = process.env.ASR_ENDPOINT_URL;
  if (!endpointUrl) {
    return { error: "ASR_ENDPOINT_URL environment variable is not set" };
  }

  const form = new FormData();
  form.append("file", fs.createReadStream(inputPath), {
    filename: path.basename(inputPath),
    contentType: "audio/wav",
  });

  const headers: Record<string, string> = {};

  if (PROVIDER === "elevenlabs") {
    form.append("model_id", "scribe_v2");
    if (process.env.ASR_API_KEY) {
      headers["xi-api-key"] = process.env.ASR_API_KEY;
    }
  }

  const response = await axios({
    method: "POST",
    url: endpointUrl,
    headers: { ...headers, ...form.getHeaders() },
    data: form,
  });

  if (PROVIDER === "elevenlabs") {
    return {
      success: true,
      transcription: (response.data as { text: string }).text,
    };
  }

  return {
    success: true,
    transcription: response.data,
  };
}

export default { run };
