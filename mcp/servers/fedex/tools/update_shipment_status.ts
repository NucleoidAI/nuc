import { defineTool, string } from "../../../lib/mock-api-tool";

export const updateShipmentStatusTool = defineTool({
  name: "FEDEX:update_shipment_status",
  description:
    "Simulate a shipment scan (demo-only). Uses the local enterprise mock API; no real shipping.",
  env: "FEDEX_API_URL",
  properties: {
    tracking_number: string("Tracking number"),
    status: {
      type: "string",
      enum: ["PU", "IT", "OD", "DL", "CA"],
      description:
        "Picked up, in transit, out for delivery, delivered, canceled",
    },
  },
  required: ["tracking_number", "status"],
  request: (args) => ({
    path: `/api/shipments/${encodeURIComponent(args.tracking_number)}`,
    method: "PATCH",
    body: { status: args.status },
  }),
});
