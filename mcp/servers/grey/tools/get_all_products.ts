import { Tool } from "../../gdrive/tools/types";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000";

export const getAllProductsTool: Tool<any> = {
  name: "GREY:get_all_products",
  description: "Get all products from inventory.",
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
  },
  handler: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products`);
      const result = await response.json();

      if (!response.ok) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: result.error || "Failed to fetch products",
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
