import { Tool } from "../../gdrive/tools/types";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000";

export const getProductByIdTool: Tool<any> = {
  name: "GREY:get_product_by_id",
  description: "Get detailed information about a specific product by its ID.",
  inputSchema: {
    type: "object",
    properties: {
      productId: {
        type: "string",
        description: "The ID of the product to retrieve.",
      },
    },
    required: ["productId"],
  },
  handler: async (args: any) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/products/${args.productId}`
      );
      const result = await response.json();

      if (!response.ok) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: result.error || "Failed to fetch product",
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
            text: JSON.stringify(result.data),
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
