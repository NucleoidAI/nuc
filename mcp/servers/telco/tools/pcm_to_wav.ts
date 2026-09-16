import { PcmToWavInput, Tool } from "./types";
import { toolError, toolResult } from "./meeting_result";

import fs from "fs";
import logger from "../../../logger/logger.js";
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
  offset += 4;
  header.writeUInt16LE(1, offset);
  offset += 2;
  header.writeUInt16LE(CHANNELS, offset);
  offset += 2;
  header.writeUInt32LE(SAMPLE_RATE, offset);
  offset += 4;
  header.writeUInt32LE(SAMPLE_RATE * CHANNELS * (BIT_DEPTH / 8), offset);
  offset += 4;
  header.writeUInt16LE(CHANNELS * (BIT_DEPTH / 8), offset);
  offset += 2;
  header.writeUInt16LE(BIT_DEPTH, offset);
  offset += 2;
  header.write("data", offset);
  offset += 4;
  header.writeUInt32LE(dataSize, offset);

  fs.writeFileSync(outputPath, Buffer.concat([header, pcm]));
}

export const pcmToWavTool: Tool<PcmToWavInput> = {
  name: "TELCO:pcm_to_wav",
  description:
    "Convert all PCM audio files (.pcm) in a directory to WAV format",
  inputSchema: {
    type: "object",
    properties: {
      directoryPath: {
        type: "string",
        description: "Absolute path to the directory containing .pcm files.",
      },
    },
    required: ["directoryPath"],
  },
  handler: async ({ directoryPath }: PcmToWavInput) => {
    try {
      logger.info(
        { tool: "TELCO:pcm_to_wav", directoryPath },
        "Converting PCM files to WAV",
      );

      if (!path.isAbsolute(directoryPath)) {
        return toolResult({
          success: false,
          error: "directoryPath must be an absolute path",
        });
      }

      if (!fs.existsSync(directoryPath)) {
        return toolResult({
          success: false,
          error: `Directory does not exist: ${directoryPath}`,
        });
      }

      if (!fs.statSync(directoryPath).isDirectory()) {
        return toolResult({
          success: false,
          error: "directoryPath must point to a directory",
        });
      }

      const pcmFiles = fs
        .readdirSync(directoryPath)
        .filter((f) => f.toLowerCase().endsWith(".pcm"));

      if (pcmFiles.length === 0) {
        return toolResult({
          success: true,
          converted: [],
          message: "No .pcm files found in directory",
        });
      }

      const converted: string[] = [];
      const errors: { file: string; error: string }[] = [];

      for (const file of pcmFiles) {
        const inputPath = path.join(directoryPath, file);
        const outputPath = path.join(
          directoryPath,
          file.replace(/\.pcm$/i, ".wav"),
        );

        try {
          writeWav(fs.readFileSync(inputPath), outputPath);
          converted.push(outputPath);
        } catch (err) {
          errors.push({ file, error: String(err) });
        }
      }

      logger.info(
        {
          tool: "TELCO:pcm_to_wav",
          totalFound: pcmFiles.length,
          totalConverted: converted.length,
        },
        "PCM conversion finished",
      );

      return toolResult({
        success: errors.length === 0,
        converted,
        errors: errors.length > 0 ? errors : undefined,
        totalFound: pcmFiles.length,
        totalConverted: converted.length,
      });
    } catch (error) {
      logger.error(
        {
          tool: "TELCO:pcm_to_wav",
          err: error instanceof Error ? error : new Error(String(error)),
          directoryPath,
        },
        "Failed to convert PCM files",
      );

      return toolError(error);
    }
  },
};
