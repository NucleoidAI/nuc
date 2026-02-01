import fs from "fs";
import path from "path";

// Store database in the same directory as this file
// __dirname works with tsx/ts-node CommonJS compatibility
const DB_PATH = path.join(__dirname, "database.json");

// Database structure
interface Database {
  addresses: Array<{ bbk_no: string; address: string }>;
  configurations: Array<{
    serial_number: string;
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
    upstream_device_card_no: string;
    upstream_device_port_no: string;
    device_serial_number: string;
    speed_limit: string;
  }>;
  port_allocations: Array<{
    serial_number: string;
    assignment_id: string;
    bbk_no: string;
    port_no: string;
    status: string;
    speed: string;
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
    speed: string;
    product_code: string;
    product_description: string;
  }>;
}

// Initial seed data
const SEED_DATA: Database = {
  addresses: [
    { bbk_no: "987", address: "Küçükbakkalköy Mahallesi, Vedat Günyol Caddesi, No:12/5, Ataşehir, İstanbul" },
    { bbk_no: "988", address: "Kadıköy Mahallesi, Bağdat Caddesi, No:234/8, Kadıköy, İstanbul" },
    { bbk_no: "989", address: "Beşiktaş Mahallesi, Barbaros Bulvarı, No:78/12, Beşiktaş, İstanbul" },
  ],
  configurations: [
    { serial_number: "123", connection_id: "BG001", vlan_id: "100", ip_address: "192.168.1.10", subnet_mask: "255.255.255.0", gateway: "192.168.1.1", dns_primary: "8.8.8.8", dns_secondary: "8.8.4.4", service_profile: "FIBER_1G", qos_profile: "Gold", status: "Configured", configuration_date: "2025-12-15T11:30:00Z" },
    { serial_number: "456", connection_id: "BG002", vlan_id: "101", ip_address: "192.168.2.10", subnet_mask: "255.255.255.0", gateway: "192.168.2.1", dns_primary: "8.8.8.8", dns_secondary: "8.8.4.4", service_profile: "FIBER_100M", qos_profile: "Silver", status: "Configured", configuration_date: "2025-12-16T15:30:00Z" },
    { serial_number: "789", connection_id: "BG003", vlan_id: "102", ip_address: null, subnet_mask: null, gateway: null, dns_primary: null, dns_secondary: null, service_profile: "VDSL_50M", qos_profile: "Bronze", status: "Pending", configuration_date: null },
  ],
  inventory: [
    { bbk_no: "987", infrastructure_type: "Fiber", topology: "FTTH", upstream_device_card_no: "1", upstream_device_port_no: "1", device_serial_number: "123", speed_limit: "1gbps" },
    { bbk_no: "988", infrastructure_type: "Fiber", topology: "FTTB", upstream_device_card_no: "2", upstream_device_port_no: "3", device_serial_number: "456", speed_limit: "100mbps" },
    { bbk_no: "989", infrastructure_type: "VDSL", topology: "FTTC", upstream_device_card_no: "3", upstream_device_port_no: "5", device_serial_number: "789", speed_limit: "50mbps" },
  ],
  port_allocations: [
    { serial_number: "123", assignment_id: "TH001", bbk_no: "987", port_no: "1/1/1", status: "Assigned", speed: "1gbps" },
    { serial_number: "789", assignment_id: "TH003", bbk_no: "989", port_no: "3/5/1", status: "Pending", speed: "50mbps" },
  ],
  port_connections: [
    { assignment_id: "TH001", connection_id: "BG001", status: "Active", connection_date: "2025-12-15T11:00:00Z", port_status: "Running", signal_strength: "-15dBm" },
    { assignment_id: "TH002", connection_id: "BG002", status: "Active", connection_date: "2025-12-16T15:00:00Z", port_status: "Running", signal_strength: "-18dBm" },
    { assignment_id: "TH003", connection_id: "BG003", status: "Inactive", connection_date: null, port_status: "Pending", signal_strength: null },
  ],
  port_connections_with_support: [
    { assignment_id: "ASSIGN-123", connection_id: "BG-TS001", status: "Active", connection_date: "2025-12-20T10:30:00Z", port_status: "Running", signal_strength: "-12dBm", technical_support: { ticket_id: "TS-2025-001", assigned_engineer: "Ahmet Yılmaz", priority: "High", created_at: "2025-12-20T10:00:00Z", status: "Resolved", resolution_notes: "Port successfully connected with technical support assistance. All parameters verified." } },
    { assignment_id: "ASSIGN-456", connection_id: "BG-TS002", status: "Active", connection_date: "2025-12-21T14:15:00Z", port_status: "Running", signal_strength: "-14dBm", technical_support: { ticket_id: "TS-2025-002", assigned_engineer: "Mehmet Kaya", priority: "Medium", created_at: "2025-12-21T13:45:00Z", status: "Resolved", resolution_notes: "Minor signal optimization required. Port now functioning optimally." } },
    { assignment_id: "ASSIGN-789", connection_id: "BG-TS003", status: "Pending", connection_date: null, port_status: "Awaiting Technical Review", signal_strength: null, technical_support: { ticket_id: "TS-2025-003", assigned_engineer: "Ayşe Demir", priority: "High", created_at: "2025-12-22T09:00:00Z", status: "In Progress", resolution_notes: "Complex port configuration requires additional diagnostics. Estimated completion: 24 hours." } },
    { assignment_id: "ASSIGN-101", connection_id: "BG-TS004", status: "Failed", connection_date: null, port_status: "Error", signal_strength: null, technical_support: { ticket_id: "TS-2025-004", assigned_engineer: "Fatma Şahin", priority: "Critical", created_at: "2025-12-23T11:20:00Z", status: "Open", resolution_notes: "Hardware compatibility issue detected. Escalated to engineering team." } },
  ],
  products: [
    { speed: "1gbps", product_code: "1000_mbps_12", product_description: "1000 Mbps Internet 12 Months Unlimited" },
    { speed: "100mbps", product_code: "100_mbps_12", product_description: "100 Mbps Internet 12 Months Unlimited" },
    { speed: "50mbps", product_code: "50_mbps_12", product_description: "50 Mbps Internet 12 Months Unlimited" },
    { speed: "25mbps", product_code: "25_mbps_12", product_description: "25 Mbps Internet 12 Months Unlimited" },
  ],
};

// Load database from file or create with seed data
function loadDatabase(): Database {
  if (fs.existsSync(DB_PATH)) {
    const data = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(data);
  }
  // Create new database with seed data
  saveDatabase(SEED_DATA);
  return SEED_DATA;
}

// Save database to file
function saveDatabase(data: Database): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// Get the database instance
export function getDatabase(): Database {
  return loadDatabase();
}

// CRUD Operations

// Find one record by key-value
export function findOne<T extends keyof Database>(
  table: T,
  key: string,
  value: any
): Database[T][number] | null {
  const db = loadDatabase();
  const records = db[table] as any[];
  return records.find((item) => item[key] === value) || null;
}

// Find all records (optionally filtered)
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

// Insert a new record
export function insert<T extends keyof Database>(
  table: T,
  record: Database[T][number]
): void {
  const db = loadDatabase();
  (db[table] as any[]).push(record);
  saveDatabase(db);
}

// Update a specific column or the whole row by key-value
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

// Delete a record by key-value
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

// Reset database to seed data
export function resetDatabase(): void {
  saveDatabase(SEED_DATA);
}

// Get database file path (for debugging)
export function getDatabasePath(): string {
  return DB_PATH;
}
