import fs from "node:fs";
import path from "node:path";

const ORDER_DB_DIR = path.join(
  path.dirname(process.cwd()),
  "mcp",
  "servers",
  "order",
  "db"
);

const ORDER_DB_PATH = path.join(ORDER_DB_DIR, "database.json");
const ORDER_SEED_PATH = path.join(ORDER_DB_DIR, "seeds", "seed.json");

export type OrderDb = {
  vendors: Array<{ id: string; name: string; email: string }>;
  products: Array<{ id: string; name: string; vendor_id: string }>;
  certificates: string[];
  product_certificates: Array<{ product_id: string; certificate: string }>;
  cities: string[];
  purchase_orders: Array<{
    order_id: string;
    product_id: string;
    city: string;
    quantity: number;
  }>;
};

/** Restores the ORDER MCP server's file database to its seeded state. */
function resetOrderDb() {
  fs.copyFileSync(ORDER_SEED_PATH, ORDER_DB_PATH);
}

function readOrderDb(): OrderDb {
  return JSON.parse(fs.readFileSync(ORDER_DB_PATH, "utf-8"));
}

function certificateOf(productId: string) {
  return readOrderDb().product_certificates.find(
    (entry) => entry.product_id === productId
  )?.certificate;
}

function purchaseOrdersFor(productId: string) {
  return readOrderDb().purchase_orders.filter(
    (order) => order.product_id === productId
  );
}

export {
  ORDER_DB_PATH,
  resetOrderDb,
  readOrderDb,
  certificateOf,
  purchaseOrdersFor,
};
