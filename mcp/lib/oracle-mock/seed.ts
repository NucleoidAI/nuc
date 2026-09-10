import path from "node:path";
import { readFile, copyFile } from "node:fs/promises";
import { oracleRequest, OracleUnavailableError } from "./database.js";

// Replace the entire mock schema with the order seed tables.
async function main() {
const tables: Array<{ name: string; columns: Record<string, string>; rows: Array<{ RECORD_ID: string; PAYLOAD: string }> }> = [];
for (const domain of ["order"]) {
  const file = path.join(__dirname, `../../servers/${domain}/db/seeds/seed.json`);
  const database = JSON.parse(await readFile(file, "utf8"));
  await copyFile(file, path.join(__dirname, `../../servers/${domain}/db/database.json`));
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
await oracleRequest("/seed", "POST", { mode: "replace", tables });
console.log("Oracle mock MCP tables reset from seed.");

}
main().catch(error => {
  if (error instanceof OracleUnavailableError) {
    console.warn("Oracle mock unavailable; local order JSON database reset. Continuing with JSON fallback.");
    return;
  }
  console.error(error);
  process.exitCode = 1;
});
