import { AddressToBBKInput, Tool } from "./types";

import { findAll } from "../db/index.js";
import logger from "../../../logger/logger.js";

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
      logger.info(
        { tool: "TELCO:get_bbk_by_address", address: args.address },
        "Looking up BBK by address",
      );

      const addresses = findAll("addresses");

      let result = addresses.find((item) => item.address === args.address);

      if (!result) {
        const searchTerm = args.address?.toLowerCase();
        result = addresses.find((item) =>
          item.address?.toLowerCase().includes(searchTerm),
        );
      }

      if (!result) {
        logger.warn(
          { tool: "TELCO:get_bbk_by_address", address: args.address },
          "BBK not found for address",
        );

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

      logger.info(
        {
          tool: "TELCO:get_bbk_by_address",
          address: args.address,
          bbk_no: result.bbk_no,
        },
        "BBK found for address",
      );

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
      logger.error(
        {
          tool: "TELCO:get_bbk_by_address",
          err: error instanceof Error ? error : new Error(String(error)),
          address: args.address,
        },
        "Failed to look up BBK by address",
      );

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
