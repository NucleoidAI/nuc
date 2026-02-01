import { AddressToolInput, Tool } from "./types";
import { findOne } from "../db/index.js";

export const addressTool: Tool<AddressToolInput> = {
  name: "TELCO:get_address",
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
      const address = findOne("addresses", "bbk_no", args.bbk_no);

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
