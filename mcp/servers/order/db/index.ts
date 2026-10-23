import path from "node:path";
import { createDatabaseWithFallback } from "../../../lib/oracle-mock/database.js";

interface Database {
  vendors: Array<{
    id: string;
    name: string;
    email: string;
    postal_code: string;
    country_code: string;
  }>;
  products: Array<{
    id: string;
    name: string;
    vendor_id: string;
    unit_price: number;
    currency: string;
    weight_kg: number;
  }>;
  certificates: string[];
  product_certificates: Array<{
    product_id: string;
    certificate: string;
  }>;
  cities: Array<{
    name: string;
    postal_code: string;
    country_code: string;
  }>;
  purchase_orders: Array<{
    order_id: string;
    product_id: string;
    city: string;
    quantity: number;
    unit_price: number;
    currency: string;
    net_amount?: number;
    tax_rate?: number;
    tax_amount?: number;
    total_amount: number;
    total_weight_kg: number;
    ship_from: { postal_code: string; country_code: string };
    ship_to: { city: string; postal_code: string; country_code: string };
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
