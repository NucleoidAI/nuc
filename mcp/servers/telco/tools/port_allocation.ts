import { PortAllocationInput, Tool } from "./types";
import { findAll, findOne , insert} from "../db/index.js";

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
      speed: {
        type: "string",
        description: "The speed to assign a port for.",
      },
    },
    required: ["device_serial_number", "bbk_no", "speed"],
  },
  handler: async (args: PortAllocationInput) => {
    try {
      const port = findAll("ports");

      const availablePort = port.find((p) => p.status === "Available" && p.speed === args.speed);

      if (availablePort) {
        const portAllocation = {
          serial_number: args.device_serial_number,
          assignment_id: `TH00${Math.floor(1000 + Math.random() * 9000)}`,
          bbk_no: args.bbk_no,
          port_no: availablePort.port_no,
          status: "Pending",
          speed: args.speed,
        }
        insert("port_allocations", portAllocation);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                port_allocation: portAllocation,
              }),
            },
          ],
          isError: false,
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: `NOT_AVAILABLE_PORT`,
              }),
            },

            ],
            isError: false,
          };
        }
      }  catch (error) {
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
    }
};
