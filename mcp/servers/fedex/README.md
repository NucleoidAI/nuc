# FedEx mock MCP

Start with `FEDEX_API_URL=http://localhost:5205 bun mcp/servers/fedex/index.ts`
from the repository root. Start the enterprise FedEx mock separately with
`bun run fedex` in test-enterprise-systems. Greycollar's existing McpClient
resolves this entrypoint using server ID `fedex`.

Tools (prefix `FEDEX:`): `get_rate_quote`, `create_shipment`, `list_shipments`,
`track_shipment`, `cancel_shipment`, `update_shipment_status`.

Quote/create input example:

```json
{"sender_postal_code":"10001","sender_country_code":"US","recipient_postal_code":"94105","recipient_country_code":"US","recipient_name":"Alex Morgan","weight":2,"weight_units":"KG","service_type":"FEDEX_GROUND"}
```

The flat fields are mapped to the mock's nested `requestedShipment` body.
Use the returned tracking number as `tracking_number` to track or cancel.
`update_shipment_status` accepts `PU`, `IT`, `OD`, `DL`, `CA` for demo scans.
Default weight units are KG, default service is FEDEX_GROUND. One package
per call; supported services/rates match the enterprise mock.

Configure `FEDEX_API_URL` in the server's team/agent MCP environment settings
(e.g. `https://fedex.nuc.land`). No credentials or OAuth tool are required by
this unauthenticated mock. No real labels are purchased or packages shipped.
HTTP failures and per-package tracking errors return MCP `isError: true`.

Provider/server/assignment/environment seed entries are included following
the existing Stripe demo assignment scopes. Seed changes do not update an
already-running database; add/assign server `fedex` through MCP settings for
existing installations. Do not reset a populated database just to load seeds.

Tests: `bun test mcp/lib/mock-api-tool.test.ts`.
