import fs from "fs";
import path from "path";

const DB_PATH = path.join(__dirname, "database.json");

interface Database {
  products: Array<{
    id: string;
    name: string;
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

function loadDatabase(): Database {
  const data = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(data);
}

function saveDatabase(data: Database): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export function getDatabase(): Database {
  return loadDatabase();
}

export function findOne<T extends keyof Database>(
  table: T,
  key: string,
  value: any,
): Database[T][number] | null {
  const db = loadDatabase();
  const records = db[table] as any[];
  return records.find((item) => item[key] === value) || null;
}

export function findAll<T extends keyof Database>(
  table: T,
  filter?: (item: Database[T][number]) => boolean,
): Database[T] {
  const db = loadDatabase();
  const records = db[table] as any[];
  if (filter) {
    return records.filter(filter) as Database[T];
  }
  return records as Database[T];
}

export function insert<T extends keyof Database>(
  table: T,
  record: Database[T][number],
): void {
  const db = loadDatabase();
  (db[table] as any[]).push(record);
  saveDatabase(db);
}

export function update<T extends keyof Database>(
  table: T,
  key: string,
  value: any,
  updates: Partial<Database[T][number]>,
): boolean {
  const db = loadDatabase();
  const records = db[table] as any[];
  const index = records.findIndex((item) => item[key] === value);
  if (index === -1) return false;
  records[index] = { ...records[index], ...updates };
  saveDatabase(db);
  return true;
}

export function getDatabasePath(): string {
  return DB_PATH;
}
