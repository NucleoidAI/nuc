import { CheckProductCertificateInput, Tool } from "./types";

import { findOne } from "../db/index.js";
import logger from "../../../logger/logger.js";

export const checkProductCertificateTool: Tool<CheckProductCertificateInput> = {
  name: "ORDER:check_product_certificate",
  description:
    "Check if a product has an assigned compliance certificate. Returns the certificate type if it exists, or indicates no certificate is present.",
  inputSchema: {
    type: "object",
    properties: {
      product_id: {
        type: "string",
        description: "The product ID to check the certificate for.",
      },
    },
    required: ["product_id"],
  },
  handler: async (args: CheckProductCertificateInput) => {
    try {
      logger.info(
        { tool: "ORDER:check_product_certificate", product_id: args.product_id },
        "Checking product certificate",
      );

      const product = await findOne("products", "id", args.product_id);

      if (!product) {
        logger.warn(
          { tool: "ORDER:check_product_certificate", product_id: args.product_id },
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

      const productCertificate = await findOne(
        "product_certificates",
        "product_id",
        args.product_id,
      );

      const hasCertificate = productCertificate !== null;

      logger.info(
        {
          tool: "ORDER:check_product_certificate",
          product_id: args.product_id,
          certificate: productCertificate
            ? (productCertificate as any).certificate
            : null,
          has_certificate: hasCertificate,
        },
        "Certificate check completed",
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              product_id: args.product_id,
              certificate: productCertificate
                ? (productCertificate as any).certificate
                : null,
              has_certificate: hasCertificate,
            }),
          },
        ],
        isError: false,
      };
    } catch (error) {
      logger.error(
        {
          tool: "ORDER:check_product_certificate",
          err: error instanceof Error ? error : new Error(String(error)),
          product_id: args.product_id,
        },
        "Failed to check product certificate",
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
