import { ProductManagementSystemInput, Tool } from "./types";

import { fileURLToPath } from "url";
import fs from "fs";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const productManagementSystemTool: Tool<ProductManagementSystemInput> = {
  name: "TELCO:get_product_by_speed",
  description:
    "Get product information by speed limit (Hız Limit). Returns product code (Ürün Kodu) and product description (Ürün Açıklaması) for the given speed limit.",
  inputSchema: {
    type: "object",
    properties: {
      spped: {
        type: "string",
        description:
          "The speed limit to look up the product for (e.g., '1gbps', '100mbps', '50mbps').",
      },
    },
    required: ["speed"],
  },
  handler: async (args: ProductManagementSystemInput) => {
    try {
      const mockDataPath = path.join(__dirname, "..", "mock", "products.json");
      const data = JSON.parse(fs.readFileSync(mockDataPath, "utf-8"));

      const product = data.find((item: any) => item.speed === args.speed);

      if (!product) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: `Product not found for speed limit: ${args.speed}`,
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
            text: JSON.stringify(product),
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
