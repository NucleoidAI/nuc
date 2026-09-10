import { defineTool, string } from "../../../lib/mock-api-tool";

export const getRefundTool = defineTool({
  name: "STRIPE:get_refund",
  description:
    "Retrieve a refund. Uses the local enterprise mock API; no real charges.",
  env: "STRIPE_API_URL",
  properties: { id: string("Resource ID") },
  required: ["id"],
  request: (args) => ({ path: `/v1/refunds/${encodeURIComponent(args.id)}` }),
});
