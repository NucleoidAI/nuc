import { ProductManagementSystemInput, Tool } from "./types";
import { findAll } from "../db/index.js";

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
      const products = findAll("products", (item) => item.speed === args.speed);

      if (!products.length) {
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

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              products: products,
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
