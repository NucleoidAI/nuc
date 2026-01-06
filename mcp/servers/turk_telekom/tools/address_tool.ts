import { Tool, AddressToolInput } from "./types";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const addressTool: Tool<AddressToolInput> = {
  name: "TURK_TELEKOM:get_address",
  description:
    "Get address (acik_adres) information by BBK number. Returns the full address associated with the given BBK number.",
  inputSchema: {
    type: "object",
    properties: {
      bbk_no: {
        type: "string",
        description: "The BBK number to look up the address for.",
      },
    },
    required: ["bbk_no"],
  },
  handler: async (args: AddressToolInput) => {
    try {
      const mockDataPath = path.join(__dirname, "..", "mock", "addresses.json");
      const data = JSON.parse(fs.readFileSync(mockDataPath, "utf-8"));

      const address = data.find((item: any) => item.bbk_no === args.bbk_no);

      if (!address) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                message: `Address not found for BBK number: ${args.bbk_no}`,
              }),
            },
          ],
          isError: false,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(address),
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
