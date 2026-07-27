import { ApproveEmployeeRequestInput, Tool } from "./types";

import logger from "../../../logger/logger.js";

const SERVICENOW_API_BASE_URL =
  process.env.SERVICENOW_API_URL || "http://localhost:5199";

export const approveEmployeeRequestTool: Tool<ApproveEmployeeRequestInput> = {
  name: "SERVICENOW:approve_employee_request",
  description:
    "Approve an employee onboarding request in ServiceNow by its request number. Returns the updated request details.",
  inputSchema: {
    type: "object",
    properties: {
      request_number: {
        type: "string",
        description:
          "The ServiceNow request number to approve (e.g. REQ0010042).",
      },
      comments: {
        type: "string",
        description: "Optional approval comments.",
      },
    },
    required: ["request_number"],
  },
  handler: async (args: ApproveEmployeeRequestInput) => {
    try {
      logger.info(
        {
          tool: "SERVICENOW:approve_employee_request",
          request_number: args.request_number,
        },
        "Approving employee request in ServiceNow",
      );

      const response = await fetch(
        `${SERVICENOW_API_BASE_URL}/api/requests/${args.request_number}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            comments: args.comments,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        logger.warn(
          {
            tool: "SERVICENOW:approve_employee_request",
            request_number: args.request_number,
            status: response.status,
          },
          "Failed to approve employee request in ServiceNow",
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: result.error || "Failed to approve employee request",
              }),
            },
          ],
          isError: true,
        };
      }

      logger.info(
        {
          tool: "SERVICENOW:approve_employee_request",
          request_number: args.request_number,
        },
        "Employee request approved in ServiceNow",
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
          tool: "SERVICENOW:approve_employee_request",
          err: error instanceof Error ? error : new Error(String(error)),
          request_number: args.request_number,
        },
        "Failed to approve employee request in ServiceNow",
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
