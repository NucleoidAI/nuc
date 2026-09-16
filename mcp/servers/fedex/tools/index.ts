import { getRateQuoteTool } from "./get_rate_quote";
import { createShipmentTool } from "./create_shipment";
import { listShipmentsTool } from "./list_shipments";
import { trackShipmentTool } from "./track_shipment";
import { cancelShipmentTool } from "./cancel_shipment";
import { updateShipmentStatusTool } from "./update_shipment_status";

export const tools = [
  getRateQuoteTool,
  createShipmentTool,
  listShipmentsTool,
  trackShipmentTool,
  cancelShipmentTool,
  updateShipmentStatusTool,
];
