import { PortConnectionInput, Tool } from "./types";
import { findOne, update } from "../db/index.js";

import logger from "../../../logger/logger.js";

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
    logger.info(
      { tool: "TELCO:port_connection", assignment_id: args.assignment_id },
      "Connecting port",
    );

    update("port_allocations", "assignment_id", args.assignment_id, {
      status: "Connected",
    });

    const updatedPortAllocation = findOne(
      "port_allocations",
      "assignment_id",
      args.assignment_id,
    );

    logger.info(
      { tool: "TELCO:port_connection", assignment_id: args.assignment_id },
      "Port connected successfully",
    );

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
