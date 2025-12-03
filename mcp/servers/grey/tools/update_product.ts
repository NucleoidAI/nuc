import { Tool } from "../../gdrive/tools/types";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000";

export const updateProductTool: Tool<any> = {
  name: "GREY:update_product",
  description: "Update an existing product's information.",
  inputSchema: {
    type: "object",
    properties: {
      productId: {
        type: "string",
        description: "The ID of the product to update.",
      },
      name: {
        type: "string",
        description: "The new name of the product (optional).",
      },
      category: {
        type: "string",
        description: "The new category of the product (optional).",
      },
      quantity: {
        type: "number",
        description: "The new quantity of the product (optional).",
      },
      price: {
        type: "number",
        description: "The new price of the product (optional).",
      },
      description: {
        type: "string",
        description: "The new description of the product (optional).",
      },
    },
    required: ["productId"],
  },
  handler: async (args: any) => {
    try {
      const updateData: any = {};
      if (args.name !== undefined) updateData.name = args.name;
      if (args.category !== undefined) updateData.category = args.category;
      if (args.quantity !== undefined) updateData.quantity = args.quantity;
      if (args.price !== undefined) updateData.price = args.price;
      if (args.description !== undefined) updateData.description = args.description;

      const response = await fetch(
        `${API_BASE_URL}/products/${args.productId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );
      const result = await response.json();

      if (!response.ok) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: result.error || "Failed to update product",
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
              product: result.data,
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
