import { defineTool } from "../../../lib/mock-api-tool";

export const listShipmentsTool = defineTool({
  name: "FEDEX:list_shipments",
  description:
    "List all demo shipments. Uses the local enterprise mock API; no real shipping.",
  env: "FEDEX_API_URL",
  properties: {},
  required: [],
  request: (args) => ({ path: "/api/shipments" }),
});
