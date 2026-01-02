import { Tool, PortBaglantiWithTechnicalSupportInput } from "./types";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const portBaglantiWithTechnicalSupportTool: Tool<PortBaglantiWithTechnicalSupportInput> =
  {
    name: "TURK_TELEKOM:port_baglanti_with_technical_support",
    description:
      "Connect/activate a port using port assignment ID with technical support escalation. Returns connection details including connection ID, activation status, technical support ticket information, and timestamp.",
    inputSchema: {
      type: "object",
      properties: {
        assignment_id: {
          type: "string",
          description:
            "The port assignment ID to connect/activate with technical support.",
        },
      },
      required: ["assignment_id"],
    },
    handler: async (args: PortBaglantiWithTechnicalSupportInput) => {
      try {
        const mockDataPath = path.join(
          __dirname,
          "..",
          "mock",
          "port_baglanti_with_technical_support.json"
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
                  error: `Port connection with technical support not found for assignment ID: ${args.assignment_id}`,
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
                error:
                  error instanceof Error ? error.message : "Unknown error",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  };
