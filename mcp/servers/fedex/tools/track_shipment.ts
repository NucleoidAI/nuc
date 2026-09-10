import { defineTool, string } from "../../../lib/mock-api-tool";

export const trackShipmentTool = defineTool({
  name: "FEDEX:track_shipment",
  description:
    "Track a shipment and retrieve scan history. Uses the local enterprise mock API; no real shipping.",
  env: "FEDEX_API_URL",
  properties: {
    tracking_number: string("Tracking number returned by create_shipment"),
  },
  required: ["tracking_number"],
  request: (args) => ({
    path: "/track/v1/trackingnumbers",
    method: "POST",
    body: {
      trackingInfo: [
        { trackingNumberInfo: { trackingNumber: args.tracking_number } },
      ],
    },
  }),
});
