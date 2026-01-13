import { InventoryToolInput, Tool } from "./types";

import { fileURLToPath } from "url";
import fs from "fs";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      const mockDataPath = path.join(__dirname, "..", "mock", "inventory.json");
      const data = JSON.parse(fs.readFileSync(mockDataPath, "utf-8"));

      const inventory = data.find((item: any) => item.bbk_no === args.bbk_no);

      if (!inventory) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: `Inventory not found for BBK number: ${args.bbk_no}`,
              }),
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(inventory),
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
