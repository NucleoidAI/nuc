import { defineTool, string } from "../../../lib/mock-api-tool";

export const listRefundsTool = defineTool({
  name: "STRIPE:list_refunds",
  description:
    "List refunds with pagination. Uses the local enterprise mock API; no real charges.",
  env: "STRIPE_API_URL",
  properties: {
    limit: { type: "integer", minimum: 1, maximum: 100 },
    starting_after: string("Pagination cursor from the previous response"),
    payment_intent: string("Payment intent ID"),
  },
  required: [],
  request: (args) => ({ path: "/v1/refunds", query: args }),
});
