import { PortAllocationInput, Tool } from "./types";
import { findOne , insert} from "../db/index.js";

export const portAllocationTool: Tool<PortAllocationInput> = {
  name: "TELCO:port_allocation",
  description:
    "Assign a port to a customer using device serial number. Returns port assignment details including assignment ID, port information, and status.",
  inputSchema: {
    type: "object",
    properties: {
      device_serial_number: {
        type: "string",
        description: "The device serial number to assign a port for.",
      },
      bbk_no: {
        type: "string",
        description: "The BBK number to assign a port for.",
      },
      port_no: {
        type: "string",
        description: "The port number to assign a port for.",
      },
      speed: {
        type: "string",
        description: "The speed to assign a port for.",
      },
    },
    required: ["device_serial_number"],
  },
  handler: async (args: PortAllocationInput) => {
    try {
      const portAllocation = findOne("port_allocations", "serial_number", args.device_serial_number);

      if (!portAllocation) {
        insert("port_allocations", {
          serial_number: args.device_serial_number,
          assignment_id: `TH00${Math.floor(1000 + Math.random() * 9000)}`,
          bbk_no: args.bbk_no,
          port_no: args.port_no,
          status: "Pending",
          speed: args.speed,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                message: `Port assigned successfully for device serial number: ${args.device_serial_number}`,
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
            text: JSON.stringify(portAllocation),
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
