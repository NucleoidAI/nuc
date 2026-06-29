import { AssignCertificateInput, Tool } from "./types";

import { findAll, findOne, insert, update } from "../db/index.js";
import logger from "../../../logger/logger.js";

export const assignCertificateTool: Tool<AssignCertificateInput> = {
  name: "ORDER:assign_certificate",
  description:
    "Assign a compliance certificate to a product. If the product already has a certificate, it will be updated. The certificate type must be provided by the user or supervisor.",
  inputSchema: {
    type: "object",
    properties: {
      product_id: {
        type: "string",
        description: "The product ID to assign the certificate to.",
      },
      certificate: {
        type: "string",
        description: "The certificate type to assign. Must be obtained from the knowledge base or supervisor.",
      },
    },
    required: ["product_id", "certificate"],
  },
  handler: async (args: AssignCertificateInput) => {
    try {
      logger.info(
        { tool: "ORDER:assign_certificate", product_id: args.product_id, certificate: args.certificate },
        "Assigning certificate to product",
      );

      const product = findOne("products", "id", args.product_id);

      if (!product) {
        logger.warn(
          { tool: "ORDER:assign_certificate", product_id: args.product_id },
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

      const validCertificates = findAll("certificates") as unknown as string[];
      if (!validCertificates.includes(args.certificate)) {
        logger.warn(
          { tool: "ORDER:assign_certificate", certificate: args.certificate },
          "Invalid certificate type",
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: "INVALID_CERTIFICATE",
              }),
            },
          ],
          isError: false,
        };
      }

      const existing = findOne("product_certificates", "product_id", args.product_id);

      if (existing) {
        update("product_certificates", "product_id", args.product_id, {
          certificate: args.certificate,
        });
      } else {
        insert("product_certificates", {
          product_id: args.product_id,
          certificate: args.certificate,
        });
      }

      logger.info(
        { tool: "ORDER:assign_certificate", product_id: args.product_id, certificate: args.certificate },
        "Certificate assigned successfully",
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              product_id: args.product_id,
              certificate: args.certificate,
              assigned: true,
            }),
          },
        ],
        isError: false,
      };
    } catch (error) {
      logger.error(
        {
          tool: "ORDER:assign_certificate",
          err: error instanceof Error ? error : new Error(String(error)),
          args,
        },
        "Failed to assign certificate",
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
