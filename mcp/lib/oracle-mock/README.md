# Oracle mock storage

The order MCP server uses the Oracle mock HTTP API from
`test-enterprise-systems/mocks/oracle`. When that mock is unavailable at startup, the order MCP server uses its local JSON database.

Set `ORACLE_MOCK_URL` in the MCP process environment (default:
`http://localhost:5203`). Use the Oracle hostname when connecting to the shared
enterprise mock production server, since it routes requests by hostname.

Initialize the tables from the repository seed fixtures:

```sh
cd mcp
ORACLE_MOCK_URL=http://localhost:5203 bun run db:reset:oracle
```

This removes all existing Oracle mock tables and their data, then creates only
the `ORDER_*` seed tables and replaces the reset baseline. This also runs whenever
`predev` invokes `db:reset`.

Each table stores a unique `RECORD_ID` and a serialized `PAYLOAD`. This preserves
the existing MCP data contract, including scalar lists, duplicate business keys,
optional fields. The mock owns persistence;
the order MCP server uses `db/database.json` only in fallback mode. JSON seed files remain
setup fixtures. Existing edits in those old database files are not migrated by reset.

Requests time out after 15 seconds and propagate API failures to the MCP caller.
Read-modify-write updates are intended for mock workflows and are not transactional.

Telco continues to use its local JSON database. `bun run db:reset` resets both
the local telco database and the order tables in Oracle; `bun run db:reset:oracle`
replaces all Oracle mock tables with the order seed tables.

Reset always refreshes the local order JSON fixture too. If Oracle cannot be reached,
reset succeeds with a warning so `predev` can continue. HTTP/API errors still fail.
The backend is selected on first access and remains fixed for the process lifetime;
restart the MCP server to use Oracle after it becomes available. Fallback writes
are not automatically synchronized to Oracle.
