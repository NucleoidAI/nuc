import { defineTool, string } from "../../../lib/mock-api-tool";

export const cancelShipmentTool = defineTool({
  name: "FEDEX:cancel_shipment",
  description:
    "Cancel a shipment that has not been delivered or canceled. Uses the local enterprise mock API; no real shipping.",
  env: "FEDEX_API_URL",
  properties: { tracking_number: string("Tracking number") },
  required: ["tracking_number"],
  request: (args) => ({
    path: "/ship/v1/shipments/cancel",
    method: "PUT",
    body: { trackingNumber: args.tracking_number },
  }),
});
