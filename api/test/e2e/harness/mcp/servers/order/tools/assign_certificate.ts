import { db, productBy } from "../db";
import { respond } from "../../../protocol";
import type { McpTool } from "../../../protocol";

const assignCertificate: McpTool = {
  name: "ORDER:assign_certificate",
  handler: ({ product_id, certificate }) => {
    const product = productBy("id", product_id as string);

    if (!product) return respond({ error: "PRODUCT_NOT_FOUND" });

    if (
      typeof certificate !== "string" ||
      !db.certificates.includes(certificate)
    ) {
      return respond({ error: "INVALID_CERTIFICATE" });
    }

    const existing = db.product_certificates.find(
      (entry) => entry.product_id === product.id
    );

    if (existing) {
      existing.certificate = certificate;
    } else {
      db.product_certificates.push({
        product_id: product.id,
        certificate,
      });
    }

    return respond({ product_id, certificate, assigned: true });
  },
};

export default assignCertificate;
