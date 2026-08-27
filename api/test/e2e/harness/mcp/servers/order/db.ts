import { orderSeed, type OrderDb } from "../../../../fixtures/orderData";

function clone(value: OrderDb): OrderDb {
  return JSON.parse(JSON.stringify(value));
}

const db: OrderDb = clone(orderSeed);

function resetDb() {
  Object.assign(db, clone(orderSeed));
}

function productBy(field: "id" | "name", value?: string) {
  if (!value) return null;

  return db.products.find((product) => product[field] === value) ?? null;
}

function vendorById(vendorId: string) {
  return db.vendors.find(({ id }) => id === vendorId) ?? null;
}

function certificateOf(productId: string) {
  return db.product_certificates.find(
    ({ product_id }) => product_id === productId
  )?.certificate;
}

function purchaseOrdersFor(productId: string) {
  return db.purchase_orders.filter(
    ({ product_id }) => product_id === productId
  );
}

export { db, resetDb, productBy, vendorById, certificateOf, purchaseOrdersFor };
export type { OrderDb };
