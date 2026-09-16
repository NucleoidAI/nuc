import { defineTool, string } from "../../../lib/mock-api-tool";

export const cancelPaymentIntentTool = defineTool({
  name: "STRIPE:cancel_payment_intent",
  description:
    "Cancel an unconfirmed payment intent. Uses the local enterprise mock API; no real charges.",
  env: "STRIPE_API_URL",
  properties: { payment_intent_id: string("Payment intent ID") },
  required: ["payment_intent_id"],
  request: (args) => ({
    path: `/v1/payment_intents/${encodeURIComponent(
      args.payment_intent_id
    )}/cancel`,
    method: "POST",
    body: {},
  }),
});
