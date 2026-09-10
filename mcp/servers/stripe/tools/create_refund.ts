import { defineTool, string, amount } from "../../../lib/mock-api-tool";

export const createRefundTool = defineTool({
  name: "STRIPE:create_refund",
  description:
    "Refund a successful payment; omit amount for its remaining refundable balance. Uses the local enterprise mock API; no real charges.",
  env: "STRIPE_API_URL",
  properties: { payment_intent: string("Succeeded payment intent ID"), amount },
  required: ["payment_intent"],
  request: (args) => ({ path: "/v1/refunds", method: "POST", body: args }),
});
