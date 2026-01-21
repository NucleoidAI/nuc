import { addressToBBKTool } from "./address_to_bbk";
import { addressTool } from "./address_tool";
import { configurationTool } from "./configuration";
import { inventoryTool } from "./inventory_tool";
import { portAllocationTool } from "./port_allocation";
import { portConnectionTool } from "./port_connection";
import { portConnectionWithTechnicalSupportTool } from "./port_connection_with_technical_support";
import { productManagementSystemTool } from "./product_management_system";

export const tools = [
  addressTool,
  addressToBBKTool,
  inventoryTool,
  productManagementSystemTool,
  portAllocationTool,
  portConnectionTool,
  portConnectionWithTechnicalSupportTool,
  configurationTool,
];
