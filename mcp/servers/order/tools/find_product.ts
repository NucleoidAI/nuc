import { FindProductInput, Tool } from "./types";

import { findAll, findOne } from "../db/index.js";
import logger from "../../../logger/logger.js";

export const findProductTool: Tool<FindProductInput> = {
  name: "ORDER:find_product",
  description:
    "Find a product by its ID or name. Returns product details including ID, name, and certificate status.",
  inputSchema: {
    type: "object",
    properties: {
      product_id: {
        type: "string",
        description: "The product ID to search for (e.g. prd-1).",
      },
      name: {
        type: "string",
        description: "The product name to search for (e.g. product-1).",
      },
    },
    required: [],
  },
  handler: async (args: FindProductInput) => {
    try {
      logger.info(
        { tool: "ORDER:find_product", product_id: args.product_id, name: args.name },
        "Finding product",
      );

      let product = null;

      if (args.product_id) {
        product = await findOne("products", "id", args.product_id);
      } else if (args.name) {
        product = await findOne("products", "name", args.name);
      } else {
        const products = await findAll("products");
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ products }),
            },
          ],
          isError: false,
        };
      }

      if (!product) {
        logger.warn(
          { tool: "ORDER:find_product", product_id: args.product_id, name: args.name },
          "Product not found",
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ error: "PRODUCT_NOT_FOUND" }),
            },
          ],
          isError: false,
        };
      }

      logger.info(
        { tool: "ORDER:find_product", product_id: (product as any).id },
        "Product found",
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ product }),
          },
        ],
        isError: false,
      };
    } catch (error) {
      logger.error(
        {
          tool: "ORDER:find_product",
          err: error instanceof Error ? error : new Error(String(error)),
          args,
        },
        "Failed to find product",
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
