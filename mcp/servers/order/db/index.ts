import path from "node:path";
import { createDatabaseWithFallback } from "../../../lib/oracle-mock/database.js";

interface Database {
  vendors: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  products: Array<{
    id: string;
    name: string;
    vendor_id: string;
  }>;
  certificates: string[];
  product_certificates: Array<{
    product_id: string;
    certificate: string;
  }>;
  cities: string[];
  purchase_orders: Array<{
    order_id: string;
    product_id: string;
    city: string;
    quantity: number;
  }>;
}

export const {
  getDatabase,
  findOne,
  findAll,
  insert,
  update,
  getDatabasePath,
} = createDatabaseWithFallback<Database>("order", path.join(__dirname, "database.json"));
