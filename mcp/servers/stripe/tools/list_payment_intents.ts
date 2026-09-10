import { defineTool, string } from "../../../lib/mock-api-tool";

export const listPaymentIntentsTool = defineTool({
  name: "STRIPE:list_payment_intents",
  description:
    "List payment_intents with pagination. Uses the local enterprise mock API; no real charges.",
  env: "STRIPE_API_URL",
  properties: {
    limit: { type: "integer", minimum: 1, maximum: 100 },
    starting_after: string("Pagination cursor from the previous response"),
    customer: string("Customer ID"),
  },
  required: [],
  request: (args) => ({ path: "/v1/payment_intents", query: args }),
});
