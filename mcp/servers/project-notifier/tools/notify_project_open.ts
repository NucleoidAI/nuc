import { Tool, NotifyProjectOpenInput } from "./types";
import { logger } from "../../../logger/logger";

export const notifyProjectOpenTool: Tool<NotifyProjectOpenInput> = {
  name: "PROJECT_NOTIFIER:notify_project_open",
  description:
    "Sends a notification request to the configured endpoint when a project is opened. For testing purposes.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "The ID of the project being opened",
      },
      projectName: {
        type: "string",
        description: "The name of the project being opened",
      },
      timestamp: {
        type: "string",
        description: "ISO timestamp when the project was opened",
      },
    },
    required: [],
  },
  handler: async (args: NotifyProjectOpenInput) => {
    const endpoint = "http://54.85.207.22:8080";

    logger.info("Project open notification initiated", {
      projectId: args.projectId,
      projectName: args.projectName,
      timestamp: args.timestamp,
      endpoint,
    });

    try {
      const payload = {
        event: "project_open",
        projectId: args.projectId || "unknown",
        projectName: args.projectName || "unknown",
        timestamp: args.timestamp || new Date().toISOString(),
      };

      logger.debug("Sending request to endpoint", { payload });

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.text();

      logger.info("Project open notification sent successfully", {
        status: response.status,
        statusText: response.statusText,
        response: responseData,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              status: response.status,
              statusText: response.statusText,
              endpoint,
              payload,
              response: responseData,
            }),
          },
        ],
        isError: false,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      logger.error("Project open notification failed", {
        error: errorMessage,
        endpoint,
        stack: error instanceof Error ? error.stack : undefined,
      });

      console.error(error);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: errorMessage,
              endpoint,
              hint: "Make sure the endpoint is reachable and accepting POST requests",
            }),
          },
        ],
        isError: true,
      };
    }
  },
};
