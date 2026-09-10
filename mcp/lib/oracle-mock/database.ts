import { randomUUID } from "node:crypto";

export function oracleUrl(): string {
  return (process.env.ORACLE_MOCK_URL || "http://localhost:5203").replace(/\/$/, "");
}

export async function oracleRequest(path: string, method = "GET", body?: unknown): Promise<any> {
  const response = await fetch(`${oracleUrl()}/api${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`Oracle mock (${response.status}): ${data.error || response.statusText}`);
  return data;
}

// Dedicated tables preserve the MCP schemas, including scalar lists and nested objects.
export function createOracleDatabase<D extends { [K in keyof D]: any[] }>(domain: string) {
  const tablePath = (table: keyof D) => `/tables/${domain.toUpperCase()}_${String(table).toUpperCase()}`;
  const rows = async (table: keyof D): Promise<Array<{ RECORD_ID: string; PAYLOAD: string }>> =>
    (await oracleRequest(`${tablePath(table)}/rows`)).rows;
  async function findAll<T extends keyof D>(table: T, filter?: (item: D[T][number]) => boolean): Promise<D[T]> {
    const records = (await rows(table)).map(row => JSON.parse(row.PAYLOAD));
    return (filter ? records.filter(filter) : records) as D[T];
  }
  async function findOne<T extends keyof D>(table: T, key: string, value: any): Promise<D[T][number] | null> {
    return (await findAll(table)).find(item => item[key] === value) ?? null;
  }
  async function insert<T extends keyof D>(table: T, record: D[T][number]): Promise<void> {
    await oracleRequest(`${tablePath(table)}/rows`, "POST", { RECORD_ID: randomUUID(), PAYLOAD: JSON.stringify(record) });
  }
  async function update<T extends keyof D>(table: T, key: string, value: any, updates: Partial<D[T][number]>, updateWholeRow = false): Promise<boolean> {
    const row = (await rows(table)).find(row => JSON.parse(row.PAYLOAD)[key] === value);
    if (!row) return false;
    const record = updateWholeRow ? { ...updates, [key]: value } : { ...JSON.parse(row.PAYLOAD), ...updates };
    await oracleRequest(`${tablePath(table)}/rows/${encodeURIComponent(row.RECORD_ID)}`, "PATCH", { PAYLOAD: JSON.stringify(record) });
    return true;
  }
  async function remove<T extends keyof D>(table: T, key: string, value: any): Promise<boolean> {
    const row = (await rows(table)).find(row => JSON.parse(row.PAYLOAD)[key] === value);
    if (!row) return false;
    await oracleRequest(`${tablePath(table)}/rows/${encodeURIComponent(row.RECORD_ID)}`, "DELETE");
    return true;
  }
  async function getDatabase(): Promise<D> {
    const { tables } = await oracleRequest("/tables");
    const names = tables.map((table: { name: string }) => table.name).filter((name: string) => name.startsWith(`${domain.toUpperCase()}_`));
    if (!names.length) throw new Error(`Oracle mock has no ${domain} tables. Run bun run db:reset in mcp first.`);
    return Object.fromEntries(await Promise.all(names.map(async (name: string) => {
      const table = name.slice(domain.length + 1).toLowerCase() as keyof D;
      return [table, await findAll(table)];
    }))) as D;
  }
  return { getDatabase, findOne, findAll, insert, update, remove, getDatabasePath: oracleUrl };
}
