# Oracle mock storage

The order MCP server uses the Oracle mock HTTP API from
`test-enterprise-systems/mocks/oracle`. Start that mock before starting the order MCP server.

Set `ORACLE_MOCK_URL` in the MCP process environment (default:
`http://localhost:5203`). Use the Oracle hostname when connecting to the shared
enterprise mock production server, since it routes requests by hostname.

Initialize the tables from the repository seed fixtures:

```sh
cd mcp
ORACLE_MOCK_URL=http://localhost:5203 bun run db:reset:oracle
```

This resets only `ORDER_*` tables and updates their reset baseline.
Other mock tables are preserved. It replaces existing data in those MCP tables;
run it explicitly during setup or when a reset is intended.

Each table stores a unique `RECORD_ID` and a serialized `PAYLOAD`. This preserves
the existing MCP data contract, including scalar lists, duplicate business keys,
optional fields. The mock owns persistence;
the order MCP server no longer reads or writes `db/database.json`. JSON seed files remain
setup fixtures. Existing edits in those old database files are not migrated by reset.

Requests time out after 15 seconds and propagate API failures to the MCP caller.
Read-modify-write updates are intended for mock workflows and are not transactional.

Telco continues to use its local JSON database. `bun run db:reset` resets both
the local telco database and the order tables in Oracle; `bun run db:reset:oracle`
resets only the order tables in Oracle.
