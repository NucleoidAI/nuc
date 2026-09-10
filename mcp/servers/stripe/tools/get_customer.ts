import { defineTool, string } from "../../../lib/mock-api-tool";

export const getCustomerTool = defineTool({
  name: "STRIPE:get_customer",
  description:
    "Retrieve a customer. Uses the local enterprise mock API; no real charges.",
  env: "STRIPE_API_URL",
  properties: { id: string("Resource ID") },
  required: ["id"],
  request: (args) => ({ path: `/v1/customers/${encodeURIComponent(args.id)}` }),
});
