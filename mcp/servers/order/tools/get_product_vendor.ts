import { GetProductVendorInput, Tool } from "./types";

import { findOne } from "../db/index.js";
import logger from "../../../logger/logger.js";

export const getProductVendorTool: Tool<GetProductVendorInput> = {
  name: "ORDER:get_product_vendor",
  description:
    "Get the vendor information for a product by its ID. Returns vendor details including ID, name, and email.",
  inputSchema: {
    type: "object",
    properties: {
      product_id: {
        type: "string",
        description: "The product ID to look up the vendor for (e.g. prd-1).",
      },
    },
    required: ["product_id"],
  },
  handler: async (args: GetProductVendorInput) => {
    try {
      logger.info(
        { tool: "ORDER:get_product_vendor", product_id: args.product_id },
        "Getting vendor for product",
      );

      const product = await findOne("products", "id", args.product_id);

      if (!product) {
        logger.warn(
          { tool: "ORDER:get_product_vendor", product_id: args.product_id },
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

      const vendor = await findOne("vendors", "id", (product as any).vendor_id);

      if (!vendor) {
        logger.warn(
          { tool: "ORDER:get_product_vendor", product_id: args.product_id, vendor_id: (product as any).vendor_id },
          "Vendor not found",
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ error: "VENDOR_NOT_FOUND" }),
            },
          ],
          isError: false,
        };
      }

      logger.info(
        { tool: "ORDER:get_product_vendor", product_id: args.product_id, vendor_id: (vendor as any).id },
        "Vendor found",
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ vendor }),
          },
        ],
        isError: false,
      };
    } catch (error) {
      logger.error(
        {
          tool: "ORDER:get_product_vendor",
          err: error instanceof Error ? error : new Error(String(error)),
          args,
        },
        "Failed to get product vendor",
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
