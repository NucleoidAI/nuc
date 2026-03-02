import { AddressToolInput, Tool } from "./types";

import { findOne } from "../db/index.js";
import logger from "../../../logger/logger.js";

export const addressTool: Tool<AddressToolInput> = {
  name: "TELCO:get_address",
  description:
    "Get address information by BBK number. Returns the full address associated with the given BBK number.",
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
      logger.info(
        { tool: "TELCO:get_address", bbk_no: args.bbk_no },
        "Looking up address by BBK",
      );

      const address = findOne("addresses", "bbk_no", args.bbk_no);

      if (!address) {
        logger.warn(
          { tool: "TELCO:get_address", bbk_no: args.bbk_no },
          "Address not found for BBK",
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: `ADDRESS_NOT_FOUND`,
              }),
            },
          ],
          isError: false,
        };
      }

      logger.info(
        { tool: "TELCO:get_address", bbk_no: args.bbk_no },
        "Address found for BBK",
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              address: address?.address,
            }),
          },
        ],
        isError: false,
      };
    } catch (error) {
      logger.error(
        {
          tool: "TELCO:get_address",
          err: error instanceof Error ? error : new Error(String(error)),
          bbk_no: args.bbk_no,
        },
        "Failed to look up address by BBK",
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
