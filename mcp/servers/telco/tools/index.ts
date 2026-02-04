import { addressToBBKTool } from "./address_to_bbk";
import { addressTool } from "./address_tool";
import { configurationTool } from "./configuration";
import { inventoryTool } from "./inventory_tool";
import { portAllocationTool } from "./port_allocation";
import { portConnectionTool } from "./port_connection";
import { productManagementSystemTool } from "./product_management_system";

export const tools = [
  addressTool,
  addressToBBKTool,
  inventoryTool,
  productManagementSystemTool,
  portAllocationTool,
  portConnectionTool,
  configurationTool,
];
