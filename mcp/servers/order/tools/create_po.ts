import { CreatePOInput, Tool } from "./types";

import { findAll, findOne, insert } from "../db/index.js";
import logger from "../../../logger/logger.js";

export const createPOTool: Tool<CreatePOInput> = {
  name: "ORDER:create_po",
  description:
    "Create a Purchase Order (PO) for a product. Requires the product to exist and a valid city. Returns the created purchase order details.",
  inputSchema: {
    type: "object",
    properties: {
      product_id: {
        type: "string",
        description: "The ID of the product to create the PO for.",
      },
      city: {
        type: "string",
        description: "The city where the order will be delivered.",
      },
      quantity: {
        type: "number",
        description: "The quantity of the product to order.",
      },
    },
    required: ["product_id", "city", "quantity"],
  },
  handler: async (args: CreatePOInput) => {
    try {
      logger.info(
        { tool: "ORDER:create_po", product_id: args.product_id, city: args.city, quantity: args.quantity },
        "Creating purchase order",
      );

      const product = findOne("products", "id", args.product_id);

      if (!product) {
        logger.warn(
          { tool: "ORDER:create_po", product_id: args.product_id },
          "Product not found",
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ error: "PRODUCT_NOT_FOUND" }),
            },
          ],
          isError: false,
        };
      }

      const cities = findAll("cities") as unknown as string[];
      if (!cities.includes(args.city)) {
        logger.warn(
          { tool: "ORDER:create_po", city: args.city },
          "Invalid city",
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: "INVALID_CITY",
                available_cities: cities,
              }),
            },
          ],
          isError: false,
        };
      }

      const existingOrders = findAll("purchase_orders");
      const orderId = `po-${1000 + existingOrders.length + 1}`;

      const newOrder = {
        order_id: orderId,
        product_id: args.product_id,
        city: args.city,
        quantity: args.quantity,
      };

      insert("purchase_orders", newOrder);

      logger.info(
        { tool: "ORDER:create_po", order_id: orderId, product_id: args.product_id },
        "Purchase order created successfully",
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ purchase_order: newOrder }),
          },
        ],
        isError: false,
      };
    } catch (error) {
      logger.error(
        {
          tool: "ORDER:create_po",
          err: error instanceof Error ? error : new Error(String(error)),
          args,
        },
        "Failed to create purchase order",
      );

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
