import { defineTool, string } from "../../../lib/mock-api-tool";

export const createCustomerTool = defineTool({
  name: "STRIPE:create_customer",
  description:
    "Create a customer. Uses the local enterprise mock API; no real charges.",
  env: "STRIPE_API_URL",
  properties: {
    name: string("Customer name"),
    email: string("Customer email"),
  },
  required: ["name", "email"],
  request: (args) => ({ path: "/v1/customers", method: "POST", body: args }),
});
