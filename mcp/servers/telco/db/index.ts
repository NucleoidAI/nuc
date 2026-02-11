import fs from "fs";
import path from "path";

const DB_PATH = path.join(__dirname, "database.json");

interface Database {
  addresses: Array<{ bbk_no: string; address: string }>;
  configurations: Array<{
    device_serial_number: string;
    connection_id: string;
    vlan_id: string;
    ip_address: string | null;
    subnet_mask: string | null;
    gateway: string | null;
    dns_primary: string | null;
    dns_secondary: string | null;
    service_profile: string;
    qos_profile: string;
    status: string;
    configuration_date: string | null;
  }>;
  inventory: Array<{
    bbk_no: string;
    infrastructure_type: string;
    topology: string;
    device_tid: string;
    hgw_serial_no: string;
    device_serial_number: string;
  }>;
  port_allocations: Array<{
    device_serial_number: string;
    assignment_id: string;
    bbk_no?: string;
    port_no?: string;
    status: string;
    speed_limit?: string;
    customer_no?: string;
    assignment_date?: string | null;
  }>;
  port_connections: Array<{
    assignment_id: string;
    connection_id: string;
    status: string;
    connection_date: string | null;
    port_status: string;
    signal_strength: string | null;
  }>;
  port_connections_with_support: Array<{
    assignment_id: string;
    connection_id: string;
    status: string;
    connection_date: string | null;
    port_status: string;
    signal_strength: string | null;
    technical_support: {
      ticket_id: string;
      assigned_engineer: string;
      priority: string;
      created_at: string;
      status: string;
      resolution_notes: string;
    };
  }>;
  products: Array<{
    speed_limit: string;
    speed_profile: string;
    product_description: string;
  }>;
  ports: Array<{
    port_no: string;
    status: string;
    speed_limit: string;
    bbk_no: string;
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
  value: any
): Database[T][number] | null {
  const db = loadDatabase();
  const records = db[table] as any[];
  return records.find((item) => item[key] === value) || null;
}

export function findAll<T extends keyof Database>(
  table: T,
  filter?: (item: Database[T][number]) => boolean
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
  record: Database[T][number]
): void {
  const db = loadDatabase();
  (db[table] as any[]).push(record);
  saveDatabase(db);
}

export function update<T extends keyof Database>(
  table: T,
  key: string,
  value: any,
  updates: Partial<Database[T][number]> | Database[T][number],
  updateWholeRow: boolean = false 
): boolean {
  const db = loadDatabase();
  const records = db[table] as any[];
  const index = records.findIndex((item) => item[key] === value);
  if (index === -1) return false;
  if (updateWholeRow) {
    const currentKey = key;
    const currentValue = value;
    records[index] = { ...updates, [currentKey]: currentValue };
  } else {
    records[index] = { ...records[index], ...updates };
  }
  saveDatabase(db);
  return true;
}

export function remove<T extends keyof Database>(
  table: T,
  key: string,
  value: any
): boolean {
  const db = loadDatabase();
  const records = db[table] as any[];
  const index = records.findIndex((item) => item[key] === value);
  if (index === -1) return false;
  records.splice(index, 1);
  saveDatabase(db);
  return true;
}

export function getDatabasePath(): string {
  return DB_PATH;
}
