import { PortConnectionInput, Tool } from "./types";
import { findOne, update } from "../db/index.js";

export const portConnectionTool: Tool<PortConnectionInput> = {
  name: "TELCO:port_connection",
  description:
    "Connect/activate a port using port assignment ID. Returns connection details including connection ID, activation status, and timestamp.",
  inputSchema: {
    type: "object",
    properties: {
      assignment_id: {
        type: "string",
        description: "The port assignment ID to connect/activate.",
      },
    },
    required: ["assignment_id"],
  },
  handler: async (args: PortConnectionInput) => {
   
    update("port_allocations", "assignment_id", args.assignment_id, {
      status: "Connected",
    });

    const updatedPortAllocation = findOne("port_allocations", "assignment_id", args.assignment_id);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            port_allocation: updatedPortAllocation,
          }),
        },
      ],
      isError: false,
    };
  },
};
