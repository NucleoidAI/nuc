import { Tool, PortBaglantiInput } from "./types";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const portBaglantiTool: Tool<PortBaglantiInput> = {
  name: "TURK_TELEKOM:port_baglanti",
  description:
    "Connect/activate a port using port assignment ID. Returns connection details including connection ID, activation status, and timestamp.",
  inputSchema: {
    type: "object",
    properties: {
      assignment_id: {
        type: "string",
        description: "The port assignment ID to connect/activate.",
      },
    },
    required: ["assignment_id"],
  },
  handler: async (args: PortBaglantiInput) => {
    try {
      const mockDataPath = path.join(
        __dirname,
        "..",
        "mock",
        "port_baglanti.json"
      );
      const data = JSON.parse(fs.readFileSync(mockDataPath, "utf-8"));

      const portBaglanti = data.find(
        (item: any) => item.assignment_id === args.assignment_id
      );

      if (!portBaglanti) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: `Port connection not found for assignment ID: ${args.assignment_id}`,
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
            text: JSON.stringify(portBaglanti),
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
