import { PortTahsisInput, Tool } from "./types";

import { fileURLToPath } from "url";
import fs from "fs";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const portTahsisTool: Tool<PortTahsisInput> = {
  name: "TELCO:port_tahsis",
  description:
    "Assign a port to a customer using device serial number. Returns port assignment details including assignment ID, port information, and status.",
  inputSchema: {
    type: "object",
    properties: {
      serial_number: {
        type: "string",
        description: "The device serial number to assign a port for.",
      },
    },
    required: ["serial_number"],
  },
  handler: async (args: PortTahsisInput) => {
    try {
      const mockDataPath = path.join(
        __dirname,
        "..",
        "mock",
        "port_tahsis.json"
      );
      const data = JSON.parse(fs.readFileSync(mockDataPath, "utf-8"));

      const portTahsis = data.find(
        (item: any) => item.serial_number === args.serial_number
      );

      if (!portTahsis) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: `Port assignment not found for device serial number: ${args.serial_number}`,
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
            text: JSON.stringify(portTahsis),
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
