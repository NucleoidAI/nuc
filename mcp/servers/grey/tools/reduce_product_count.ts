import { Tool } from "../../gdrive/tools/types";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000";

export const reduceProductCountTool: Tool<any> = {
  name: "GREY:reduce_product_count",
  description: "Reduce the count of a product by a specified quantity .",
  inputSchema: {
    type: "object",
    properties: {
      productId: {
        type: "string",
        description: "The ID of the product to reduce the count of.",
      },
      quantity : {
        type: "number",
        description: "The quantity  to reduce from the product count.",
      },
    },
    required: ["productId", "quantity "],
  },
  handler: async (args: any) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/products/${args.productId}/reduce`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ quantity: args.quantity }),
        }
      );
      const result = await response.json();

      if (!response.ok) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: result.error || "Failed to reduce product count",
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
              message: result.message,
              productId: result.data.id,
              name: result.data.name,
              newQuantity: result.data.quantity,
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