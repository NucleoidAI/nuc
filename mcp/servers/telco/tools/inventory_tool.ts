import { InventoryToolInput, Tool } from "./types";
import { findOne } from "../db/index.js";

export const inventoryTool: Tool<InventoryToolInput> = {
  name: "TELCO:get_inventory",
  description:
    "Get infrastructure inventory information by BBK number. Returns details including infrastructure type (Altyapı Tipi), topology (Topoloji), device information (Cihaz), port availability, HGW serial number, and speed limit.",
  inputSchema: {
    type: "object",
    properties: {
      bbk_no: {
        type: "string",
        description:
          "The BBK number to look up the infrastructure inventory for.",
      },
    },
    required: ["bbk_no"],
  },
  handler: async (args: InventoryToolInput) => {
    try {
      const inventory = findOne("inventory", "bbk_no", args.bbk_no);

      if (!inventory) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: `INVENTORY_NOT_FOUND`,
              }),
            },
          ],
          isError: false,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              inventory: inventory,
            }),
          },
        ],
        isError: false,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: error instanceof Error ? error.message : "Unknown error",
            }),
          },
        ],
        isError: true,
      };
    }
  },
};
