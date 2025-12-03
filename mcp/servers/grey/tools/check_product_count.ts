import { Tool } from "../../gdrive/tools/types";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000";

export const checkProductCountTool: Tool<any> = {
  name: "GREY:check_product_count",
  description: "Check product count",
  inputSchema: {
    type: "object",
    properties: {
      productId: {
        type: "string",
        description: "The ID of the product to check the count of.",
      },
    },
    required: ["productId"],
  },
  handler: async (args: any) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/products/${args.productId}/count`
      );
      const result = await response.json();

      if (!response.ok) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: result.error || "Failed to fetch product count",
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
            text: JSON.stringify({
              productId: result.data.id,
              name: result.data.name,
              count: result.data.quantity,
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
