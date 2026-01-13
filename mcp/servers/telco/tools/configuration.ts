import { ConfigurationInput, Tool } from "./types";

import { fileURLToPath } from "url";
import fs from "fs";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const configurationTool: Tool<ConfigurationInput> = {
  name: "TELCO:configuration",
  description:
    "Configure port settings using device serial number. Returns configuration details including VLAN, IP settings, and service parameters.",
  inputSchema: {
    type: "object",
    properties: {
      serial_number: {
        type: "string",
        description: "The device serial number to configure.",
      },
    },
    required: ["serial_number"],
  },
  handler: async (args: ConfigurationInput) => {
    try {
      const mockDataPath = path.join(
        __dirname,
        "..",
        "mock",
        "configuration.json"
      );
      const data = JSON.parse(fs.readFileSync(mockDataPath, "utf-8"));

      const configuration = data.find(
        (item: any) => item.serial_number === args.serial_number
      );

      if (!configuration) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: `Configuration not found for device serial number: ${args.serial_number}`,
              }),
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(configuration),
          },
        ],
        isError: false,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: error instanceof Error ? error.message : "Unknown error",
            }),
          },
        ],
        isError: true,
      };
    }
  },
};
