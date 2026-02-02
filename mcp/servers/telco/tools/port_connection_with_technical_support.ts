import { PortConnectionWithTechnicalSupportInput, Tool } from "./types";
import { findOne } from "../db/index.js";

export const portConnectionWithTechnicalSupportTool: Tool<PortConnectionWithTechnicalSupportInput> =
  {
    name: "TURK_TELEKOM:port_connection_with_technical_support",
    description:
      "Connect/activate a port using port assignment ID with technical support escalation. Returns connection details including connection ID, activation status, technical support ticket information, and timestamp.",
    inputSchema: {
      type: "object",
      properties: {
        assignment_id: {
          type: "string",
          description:
            "The port assignment ID to connect/activate with technical support.",
        },
      },
      required: ["assignment_id"],
    },
    handler: async (args: PortConnectionWithTechnicalSupportInput) => {
      try {
        const portConnection = findOne(
          "port_connections_with_support",
          "assignment_id",
          args.assignment_id
        );

        if (!portConnection) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  error: `Port connection with technical support not found for assignment ID: ${args.assignment_id}`,
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
              text: JSON.stringify(portConnection),
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
                error:
                  error instanceof Error ? error.message : "Unknown error",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  };
