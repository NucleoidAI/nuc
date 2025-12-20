import { Tool } from "../../gdrive/tools/types";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000";

export const getProductsByCategoryTool: Tool<any> = {
  name: "GREY:get_products_by_category",
  description: "Get all products in a specific category.",
  inputSchema: {
    type: "object",
    properties: {
      category: {
        type: "string",
        description: "The category name to filter products by (e.g., 'battery', 'electronics').",
      },
    },
    required: ["category"],
  },
  handler: async (args: any) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/products/category/${args.category}`
      );
      const result = await response.json();

      if (!response.ok) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: result.error || "Failed to fetch products by category",
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
              category: args.category,
              count: result.count,
              products: result.data,
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
