import { productBy, vendorById } from "../db";
import { respond } from "../../../protocol";
import type { McpTool } from "../../../protocol";

const getProductVendor: McpTool = {
  name: "ORDER:get_product_vendor",
  handler: ({ product_id }) => {
    const product = productBy("id", product_id as string);

    if (!product) return respond({ error: "PRODUCT_NOT_FOUND" });

    const vendor = vendorById(product.vendor_id);

    if (!vendor) return respond({ error: "VENDOR_NOT_FOUND" });

    return respond({ vendor });
  },
};

export default getProductVendor;
