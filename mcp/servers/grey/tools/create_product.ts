import { Tool } from "../../gdrive/tools/types";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000";

export const createProductTool: Tool<any> = {
  name: "GREY:create_product",
  description: "Create a new product in the inventory.",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "The name of the product.",
      },
      category: {
        type: "string",
        description: "The category of the product (e.g., 'battery', 'electronics').",
      },
      quantity: {
        type: "number",
        description: "The initial quantity of the product.",
      },
      price: {
        type: "number",
        description: "The price of the product.",
      },
      description: {
        type: "string",
        description: "Optional description of the product.",
      },
    },
    required: ["name", "category", "quantity", "price"],
  },
  handler: async (args: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: args.name,
          category: args.category,
          quantity: args.quantity,
          price: args.price,
          description: args.description || "",
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: result.error || "Failed to create product",
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
