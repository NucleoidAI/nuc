import { AddressToBBKInput, Tool } from "./types";

import { fileURLToPath } from "url";
import fs from "fs";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const addressToBBKTool: Tool<AddressToBBKInput> = {
  name: "TELCO:get_bbk_by_address",
  description:
    "Get BBK number by address (address). Returns the BBK number associated with the given address. Supports partial address matching.",
  inputSchema: {
    type: "object",
    properties: {
      address: {
        type: "string",
        description:
          "The address to look up the BBK number for. Can be a partial address.",
      },
    },
    required: ["address"],
  },
  handler: async (args: AddressToBBKInput) => {
    try {
      const mockDataPath = path.join(__dirname, "..", "mock", "addresses.json");
      const data = JSON.parse(fs.readFileSync(mockDataPath, "utf-8"));

      // Try exact match first
      let result = data.find((item: any) => item.address === args.address);

      // If no exact match, try partial match (case-insensitive)
      if (!result) {
        const searchTerm = args.address?.toLowerCase();
        result = data.find((item: any) =>
          item.address?.toLowerCase().includes(searchTerm)
        );
      }

      if (!result) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: `BBK number not found for address: ${args.address}`,
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
            text: JSON.stringify(result),
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
