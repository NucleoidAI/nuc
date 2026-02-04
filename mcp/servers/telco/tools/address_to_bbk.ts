import { AddressToBBKInput, Tool } from "./types";
import { findAll } from "../db/index.js";

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
      const addresses = findAll("addresses");

      let result = addresses.find((item) => item.address === args.address);

      if (!result) {
        const searchTerm = args.address?.toLowerCase();
        result = addresses.find((item) =>
          item.address?.toLowerCase().includes(searchTerm)
        );
      }

      if (!result) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: `BBK_NO_NOT_FOUND`,
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
            text: JSON.stringify({
              bbk_no: result?.bbk_no,
            }),
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
