import { CreatePOInput, Tool } from "./types";

import { findAll, findOne, insert } from "../db/index.js";
import logger from "../../../logger/logger.js";

const TAX_RATE = 0.19;

export const createPOTool: Tool<CreatePOInput> = {
  name: "ORDER:create_po",
  description:
    "Create a Purchase Order (PO) for a product. Requires the product to exist and a valid city. Returns the purchase order with its net amount, tax amount and tax-inclusive total amount in minor currency units, total weight in kilograms and the ship-from / ship-to postal codes.",
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

      const product = await findOne("products", "id", args.product_id);

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

      const cities = (await findAll("cities")) as unknown as Array<{
        name: string;
        postal_code: string;
        country_code: string;
      }>;
      const destination = cities.find((city) => city.name === args.city);
      if (!destination) {
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
                available_cities: cities.map((city) => city.name),
              }),
            },
          ],
          isError: false,
        };
      }

      const vendor = (await findOne(
        "vendors",
        "id",
        (product as any).vendor_id,
      )) as any;

      const existingOrders = await findAll("purchase_orders");
      const orderId = `po-${1000 + existingOrders.length + 1}`;

      const unitPrice = (product as any).unit_price;
      const netAmount = unitPrice * args.quantity;
      const taxAmount = Math.round(netAmount * TAX_RATE);
      const newOrder = {
        order_id: orderId,
        product_id: args.product_id,
        city: args.city,
        quantity: args.quantity,
        unit_price: unitPrice,
        currency: (product as any).currency,
        net_amount: netAmount,
        tax_rate: TAX_RATE,
        tax_amount: taxAmount,
        total_amount: netAmount + taxAmount,
        total_weight_kg:
          Math.round((product as any).weight_kg * args.quantity * 1000) / 1000,
        ship_from: {
          postal_code: vendor?.postal_code,
          country_code: vendor?.country_code,
        },
        ship_to: {
          city: destination.name,
          postal_code: destination.postal_code,
          country_code: destination.country_code,
        },
      };

      await insert("purchase_orders", newOrder);

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
