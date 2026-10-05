import { defineTool, string } from "../../../lib/mock-api-tool";

export const runSqlTool = defineTool({
  name: "AS400:run_sql",
  description:
    "Run a DB2 for i statement against the CORPLIB library: SELECT (WHERE / ORDER BY / FETCH FIRST n ROWS ONLY / LIKE), INSERT, UPDATE, DELETE, CREATE TABLE, DROP TABLE. Joins and aggregates are not supported — read the logical files instead. Uses the local IBM i (AS/400) enterprise mock API.",
  env: "AS400_API_URL",
  properties: {
    sql: string(
      "A single statement, for example SELECT * FROM POLMAST WHERE POLSTS = 'A'",
    ),
  },
  required: ["sql"],
  request: (args) => ({
    path: "/api/sql",
    method: "POST",
    body: { sql: args.sql },
  }),
});
