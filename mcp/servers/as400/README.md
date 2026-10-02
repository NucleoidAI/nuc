# IBM i (AS/400) mock MCP

Start with `AS400_API_URL=http://localhost:5207 bun mcp/servers/as400/index.ts`
from the repository root. Start the enterprise IBM i mock separately with
`bun run as400` in test-enterprise-systems. Greycollar's existing McpClient
resolves this entrypoint using server ID `as400`.

Tools (prefix `AS400:`):

- Library and records: `list_files`, `describe_file`, `list_records`,
  `get_record`
- Users: `find_user`, `get_user`, `create_user`, `update_user`
- Policies: `find_policy`, `get_policy`, `list_user_policies`,
  `create_policy`, `update_policy`, `update_policy_phone`,
  `update_policy_address`
- Free form: `run_sql`, `run_cl_command`
- Operations: `list_messages`, `reply_to_message`, `send_message`,
  `list_jobs`, `submit_job`

The mock serves library `CORPLIB` on system `CORPSYS1`. Physical files:
`USRMAST` (users, keyed by `USRID`), `POLMAST` (policies, keyed by `POLID`),
`DEPTMST`, `CUSMAST`, `ITMMAST`, `ORDHDR`, `ORDDTL`. Logical files are read
only and computed on each call: `LPOLCTC` (policies indexed by telephone,
mobile and postcode), `LUSRPOL` (policies and annual premium per user),
`LUSRDIR` (active user directory), `LOPNORD`, `LITMLOW`, `LDEPHDC`.

A policy carries its own risk address and contact details, so a holder can
have several policies at different addresses; `find_policy` matches on the
policy's details, not on the user's correspondence address in `USRMAST`.

Call-centre lookup example:

```json
{"mobile":"+44 7700 900118"}
```

`find_policy` returns every policy registered against that number with the
holder name; feed `POLID` into `get_policy` or `update_policy`.

`run_sql` supports single-table `SELECT` (WHERE / ORDER BY / LIKE / FETCH
FIRST n ROWS ONLY), `INSERT`, `UPDATE`, `DELETE`, `CREATE TABLE` and
`DROP TABLE` — no joins or aggregates, read a logical file for those.
Key fields and coded fields are folded to upper case on write; names,
e-mail addresses and address lines keep their case.

`list_messages` and `reply_to_message` drive the QSYSOPR inquiry flow: the
seeded `CPA5316` message asks whether an order over the customer's credit
limit may be released, and an answer of `G` or `C` clears it the same way an
operator would at the green screen.

Configure `AS400_API_URL` in the server's team/agent MCP environment settings
(e.g. `https://as400.nuc.land`). No credentials or OAuth tool are required by
this unauthenticated mock; the green screen accepts any password. Errors come
back as DB2 for i and CL messages (`SQL0803`, `SQL0545`, `CPF9801`, …) with
MCP `isError: true`.

Provider/server/assignment/environment seed entries are included following the
existing FedEx demo assignment scopes. Seed changes do not update an already
running database; add/assign server `as400` through MCP settings for existing
installations. Do not reset a populated database just to load seeds.

Tests: `bun test mcp/lib/as400-tool.test.ts`.
