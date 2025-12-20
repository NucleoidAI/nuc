import { Tool } from "../../gdrive/tools/types";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000";

export const deleteProductTool: Tool<any> = {
  name: "GREY:delete_product",
  description: "Delete a product from the inventory.",
  inputSchema: {
    type: "object",
    properties: {
      productId: {
        type: "string",
        description: "The ID of the product to delete.",
      },
    },
    required: ["productId"],
  },
  handler: async (args: any) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/products/${args.productId}`,
        {
          method: "DELETE",
        }
      );
      const result = await response.json();

      if (!response.ok) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: result.error || "Failed to delete product",
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
              deletedProduct: result.data,
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
