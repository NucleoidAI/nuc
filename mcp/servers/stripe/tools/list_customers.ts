import { defineTool, string } from "../../../lib/mock-api-tool";

export const listCustomersTool = defineTool({
  name: "STRIPE:list_customers",
  description:
    "List customers with pagination. Uses the local enterprise mock API; no real charges.",
  env: "STRIPE_API_URL",
  properties: {
    limit: { type: "integer", minimum: 1, maximum: 100 },
    starting_after: string("Pagination cursor from the previous response"),
  },
  required: [],
  request: (args) => ({ path: "/v1/customers", query: args }),
});
