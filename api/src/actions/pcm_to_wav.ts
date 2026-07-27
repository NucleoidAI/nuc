import fs from "fs";
import path from "path";

const SAMPLE_RATE = 32000;
const CHANNELS = 1;
const BIT_DEPTH = 16;

function writeWav(pcm: Buffer, outputPath: string): void {
  const dataSize = pcm.byteLength;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const header = Buffer.alloc(headerSize);
  let offset = 0;

  header.write("RIFF", offset);
  offset += 4;
  header.writeUInt32LE(totalSize - 8, offset);
  offset += 4;
  header.write("WAVE", offset);
  offset += 4;
  header.write("fmt ", offset);
  offset += 4;
  header.writeUInt32LE(16, offset);
  offset += 4; // PCM chunk size
  header.writeUInt16LE(1, offset);
  offset += 2; // PCM format
  header.writeUInt16LE(CHANNELS, offset);
  offset += 2;
  header.writeUInt32LE(SAMPLE_RATE, offset);
  offset += 4;
  header.writeUInt32LE(SAMPLE_RATE * CHANNELS * (BIT_DEPTH / 8), offset);
  offset += 4; // byte rate
  header.writeUInt16LE(CHANNELS * (BIT_DEPTH / 8), offset);
  offset += 2; // block align
  header.writeUInt16LE(BIT_DEPTH, offset);
  offset += 2;
  header.write("data", offset);
  offset += 4;
  header.writeUInt32LE(dataSize, offset);

  fs.writeFileSync(outputPath, Buffer.concat([header, pcm]));
}

async function run({
  parameters: { directoryPath },
}: {
  parameters: { directoryPath: string };
}) {
  if (!path.isAbsolute(directoryPath)) {
    return { success: false, error: "directoryPath must be an absolute path" };
  }

  if (!fs.existsSync(directoryPath)) {
    return {
      success: false,
      error: `Directory does not exist: ${directoryPath}`,
    };
  }

  const stat = fs.statSync(directoryPath);
  if (!stat.isDirectory()) {
    return { success: false, error: "directoryPath must point to a directory" };
  }

  const pcmFiles = fs
    .readdirSync(directoryPath)
    .filter((f) => f.toLowerCase().endsWith(".pcm"));

  if (pcmFiles.length === 0) {
    return {
      success: true,
      converted: [],
      message: "No .pcm files found in directory",
    };
  }

  const converted: string[] = [];
  const errors: { file: string; error: string }[] = [];

  for (const file of pcmFiles) {
    const inputPath = path.join(directoryPath, file);
    const outputPath = path.join(
      directoryPath,
      file.replace(/\.pcm$/i, ".wav")
    );

    try {
      const pcm = fs.readFileSync(inputPath);
      writeWav(pcm, outputPath);
      converted.push(outputPath);
    } catch (err) {
      errors.push({ file, error: String(err) });
    }
  }

  return {
    success: errors.length === 0,
    converted,
    errors: errors.length > 0 ? errors : undefined,
    totalFound: pcmFiles.length,
    totalConverted: converted.length,
  };
}

export default { run };
