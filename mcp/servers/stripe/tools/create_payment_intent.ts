import { defineTool, string, amount } from "../../../lib/mock-api-tool";

export const createPaymentIntentTool = defineTool({
  name: "STRIPE:create_payment_intent",
  description:
    "Create a payment intent; confirm defaults to false. Uses the local enterprise mock API; no real charges.",
  env: "STRIPE_API_URL",
  properties: {
    amount,
    currency: string("Three-letter currency code"),
    customer: string("Customer ID"),
    description: string("Payment description"),
    confirm: {
      type: "boolean",
      description: "Immediately simulate success when true",
    },
  },
  required: ["amount", "currency"],
  request: (args) => ({
    path: "/v1/payment_intents",
    method: "POST",
    body: args,
  }),
});
