import path from "node:path";
import { readFile } from "node:fs/promises";
import { oracleRequest } from "./database.js";

// Merge only MCP-owned tables; keep the mock's existing HR and procurement tables.
async function main() {
const tables: Array<{ name: string; columns: Record<string, string>; rows: Array<{ RECORD_ID: string; PAYLOAD: string }> }> = [];
for (const domain of ["order"]) {
  const file = path.join(__dirname, `../../servers/${domain}/db/seeds/seed.json`);
  const database = JSON.parse(await readFile(file, "utf8"));
  for (const [name, records] of Object.entries(database)) {
    tables.push({
      name: `${domain}_${name}`.toUpperCase(),
      columns: { RECORD_ID: "VARCHAR2(36) NOT NULL PK", PAYLOAD: "VARCHAR2 NOT NULL" },
      rows: (records as unknown[]).map((record, index) => ({
        RECORD_ID: String(index + 1),
        PAYLOAD: JSON.stringify(record),
      })),
    });
  }
}
await oracleRequest("/seed", "POST", { mode: "merge", tables });
console.log("Oracle mock MCP tables reset from seed.");

}
main().catch(error => { console.error(error); process.exitCode = 1; });
