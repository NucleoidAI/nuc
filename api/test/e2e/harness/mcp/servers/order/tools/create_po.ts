import { db, productBy } from "../db";
import { respond } from "../../../protocol";
import type { McpTool } from "../../../protocol";

const createPo: McpTool = {
  name: "ORDER:create_po",
  handler: ({ product_id, city, quantity }) => {
    const product = productBy("id", product_id as string);

    if (!product) return respond({ error: "PRODUCT_NOT_FOUND" });

    if (typeof city !== "string" || !db.cities.includes(city)) {
      return respond({
        error: "INVALID_CITY",
        available_cities: db.cities,
      });
    }

    const purchaseOrder = {
      order_id: `po-${1000 + db.purchase_orders.length + 1}`,
      product_id: product.id,
      city,
      quantity: quantity as number,
    };

    db.purchase_orders.push(purchaseOrder);

    return respond({ purchase_order: purchaseOrder });
  },
};

export default createPo;
