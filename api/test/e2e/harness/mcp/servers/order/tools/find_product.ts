import { db, productBy } from "../db";
import { respond } from "../../../protocol";
import type { McpTool } from "../../../protocol";

const findProduct: McpTool = {
  name: "ORDER:find_product",
  handler: ({ product_id, name }) => {
    if (!product_id && !name) return respond({ products: db.products });

    console.log("FROM MOCK");

    const product = product_id
      ? productBy("id", product_id as string)
      : productBy("name", name as string);

    if (!product) return respond({ error: "PRODUCT_NOT_FOUND" });

    return respond({ product });
  },
};

export default findProduct;
