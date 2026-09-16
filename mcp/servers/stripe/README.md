# Stripe mock MCP

Start with `STRIPE_API_URL=http://localhost:5204 bun mcp/servers/stripe/index.ts`
from the repository root. Start the enterprise Stripe mock separately with
`bun run stripe` in test-enterprise-systems. Greycollar's existing McpClient
resolves this entrypoint using server ID `stripe`.

Tools (prefix `STRIPE:`): `list_customers`, `get_customer`, `create_customer`,
`list_payment_intents`, `get_payment_intent`, `create_payment_intent`,
`confirm_payment_intent`, `cancel_payment_intent`, `list_refunds`,
`get_refund`, `create_refund`.

Example: `STRIPE:create_payment_intent` with
`{"amount":1000,"currency":"usd","confirm":true}`. Use its returned ID as
`payment_intent` in `STRIPE:create_refund`. Omit refund amount to refund the
remaining balance. List tools expose `limit` and `starting_after`.

Set `STRIPE_API_URL` in the server's team/agent MCP environment settings to
the mock origin (e.g. `https://stripe.nuc.land` for a deployed mock). No real
Stripe key is needed. This is a mock subset, not a real Stripe connector.
Requests time out after 15 seconds; API errors return MCP `isError: true`.

Seed files include the environment defaults for the existing demo teams.
Source seed changes do not update an already-running database: configure the
URL through MCP settings for existing installations. The existing Stripe
catalog entry and assignments are retained.

Tests: `bun test mcp/lib/mock-api-tool.test.ts`.
