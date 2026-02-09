import { ProductManagementSystemInput, Tool } from "./types";
import { findAll } from "../db/index.js";
import logger from "../../../logger/logger.js";

export const productManagementSystemTool: Tool<ProductManagementSystemInput> = {
  name: "TELCO:get_product_by_speed",
  description:
    "Get product information by speed limit (Hız Limit). Returns product code (Ürün Kodu) and product description (Ürün Açıklaması) for the given speed limit.",
  inputSchema: {
    type: "object",
    properties: {
      speed: {
        type: "string",
        description:
          "The speed limit to look up the product for (e.g., '1gbps', '100mbps', '50mbps').",
      },
    },
    required: ["speed"],
  },
  handler: async (args: ProductManagementSystemInput) => {
    try {
      logger.info({ tool: "TELCO:get_product_by_speed", speed: args.speed }, "Looking up products by speed");

      const products = findAll("products", (item) => item.speed === args.speed);

      if (!products.length) {
        logger.warn({ tool: "TELCO:get_product_by_speed", speed: args.speed }, "No products found for speed");

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: `PRODUCTS_NOT_FOUND`,
              }),
            },
          ],
          isError: false,
        };
      }

      logger.info({ tool: "TELCO:get_product_by_speed", speed: args.speed, count: products.length }, "Products found for speed");

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              available_products: products,
            }),
          },
        ],
        isError: false,
      };
    } catch (error) {
      logger.error(
        { tool: "TELCO:get_product_by_speed", err: error instanceof Error ? error : new Error(String(error)), speed: args.speed },
        "Failed to look up products"
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
