import fs from "node:fs";

export function createJsonDatabase<D extends { [K in keyof D]: any[] }>(file: string) {
  const getDatabase = (): D => JSON.parse(fs.readFileSync(file, "utf8"));
  const save = (database: D) => fs.writeFileSync(file, JSON.stringify(database, null, 2), "utf8");
  function findAll<T extends keyof D>(table: T, filter?: (item: D[T][number]) => boolean): D[T] {
    const records = getDatabase()[table];
    return (filter ? records.filter(filter) : records) as D[T];
  }
  function findOne<T extends keyof D>(table: T, key: string, value: any): D[T][number] | null {
    return findAll(table).find(item => item[key] === value) ?? null;
  }
  function insert<T extends keyof D>(table: T, record: D[T][number]): void {
    const database = getDatabase();
    database[table].push(record);
    save(database);
  }
  function update<T extends keyof D>(table: T, key: string, value: any, updates: Partial<D[T][number]>): boolean {
    const database = getDatabase();
    const index = database[table].findIndex(item => item[key] === value);
    if (index === -1) return false;
    database[table][index] = { ...database[table][index], ...updates };
    save(database);
    return true;
  }
  return { getDatabase, findAll, findOne, insert, update };
}
