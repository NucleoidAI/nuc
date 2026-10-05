import { defineTool, string } from "../../../lib/mock-api-tool";

export const sendMessageTool = defineTool({
  name: "AS400:send_message",
  description:
    "Send a message to the QSYSOPR message queue. Type INQ posts an inquiry that waits for an operator reply and lights the MW indicator on the green screen. Uses the local IBM i (AS/400) enterprise mock API.",
  env: "AS400_API_URL",
  properties: {
    text: string("Message text"),
    type: {
      type: "string",
      description: "INFO informational, INQ waits for a reply, ESCAPE error",
      enum: ["INFO", "INQ", "ESCAPE"],
    },
    severity: {
      type: "integer",
      minimum: 0,
      maximum: 99,
      description: "Severity",
    },
    from: string("Sending job or user, for example ORDPOST"),
  },
  required: ["text"],
  request: (args) => ({
    path: "/api/messages",
    method: "POST",
    body: {
      text: args.text,
      type: args.type,
      severity: args.severity,
      from: args.from,
    },
  }),
});
