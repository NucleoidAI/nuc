import { defineTool, string } from "../../../lib/mock-api-tool";

export const getPaymentIntentTool = defineTool({
  name: "STRIPE:get_payment_intent",
  description:
    "Retrieve a payment_intent. Uses the local enterprise mock API; no real charges.",
  env: "STRIPE_API_URL",
  properties: { id: string("Resource ID") },
  required: ["id"],
  request: (args) => ({
    path: `/v1/payment_intents/${encodeURIComponent(args.id)}`,
  }),
});
