import { CreateIncidentInput, Tool } from "./types";

import logger from "../../../logger/logger.js";

const SERVICENOW_API_BASE_URL = process.env.SERVICENOW_API_URL;

export const createIncidentTool: Tool<CreateIncidentInput> = {
  name: "SERVICENOW:create_incident",
  description:
    "Create an incident in ServiceNow. Requires a short description and the caller's name. Returns the created incident details including its incident number.",
  inputSchema: {
    type: "object",
    properties: {
      shortDescription: {
        type: "string",
        description: "A short summary of the incident.",
      },
      caller: {
        type: "string",
        description: "Name of the person reporting the incident.",
      },
      description: {
        type: "string",
        description: "Detailed description of the incident.",
      },
      priority: {
        type: "number",
        enum: [1, 2, 3, 4],
        description:
          "Incident priority: 1=Critical, 2=High, 3=Moderate (default), 4=Low.",
      },
      assignmentGroup: {
        type: "string",
        enum: [
          "Service Desk",
          "Network Operations",
          "Hardware Support",
          "Application Support",
          "Database Administration",
        ],
        description:
          "Group the incident is assigned to. Defaults to 'Service Desk'.",
      },
      assignee: {
        type: "string",
        description: "Name of the person the incident is assigned to.",
      },
      state: {
        type: "string",
        enum: ["New", "In Progress", "On Hold", "Resolved", "Closed"],
        description: "Incident state. Defaults to 'New'.",
      },
    },
    required: ["shortDescription", "caller"],
  },
  handler: async (args: CreateIncidentInput) => {
    try {
      logger.info(
        {
          tool: "SERVICENOW:create_incident",
          shortDescription: args.shortDescription,
          caller: args.caller,
        },
        "Creating incident in ServiceNow",
      );

      const response = await fetch(`${SERVICENOW_API_BASE_URL}/api/incidents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args),
      });

      const result = await response.json();

      if (!response.ok) {
        logger.warn(
          {
            tool: "SERVICENOW:create_incident",
            shortDescription: args.shortDescription,
            status: response.status,
          },
          "Failed to create incident in ServiceNow",
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: result.error || "Failed to create incident",
              }),
            },
          ],
          isError: true,
        };
      }

      logger.info(
        {
          tool: "SERVICENOW:create_incident",
          shortDescription: args.shortDescription,
        },
        "Incident created in ServiceNow",
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result),
          },
        ],
        isError: false,
      };
    } catch (error) {
      logger.error(
        {
          tool: "SERVICENOW:create_incident",
          err: error instanceof Error ? error : new Error(String(error)),
          shortDescription: args.shortDescription,
        },
        "Failed to create incident in ServiceNow",
      );

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
