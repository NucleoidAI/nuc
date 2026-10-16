import { PrepareEmailInput, Tool } from "./types";
import { toolError, toolResult } from "./meeting_result";

import { TEMPLATES } from "../../grey/tools/send_email.js";
import logger from "../../../logger/logger.js";

export const prepareEmailTool: Tool<PrepareEmailInput> = {
  name: "TELCO:prepare_email",
  description:
    "Render a predefined meeting email template and return the email's subject, plain text body and HTML body, ready to be passed to TELCO:send_email_ews. Does not send anything.",
  inputSchema: {
    type: "object",
    properties: {
      template: {
        type: "string",
        description: `Name of a predefined email template. Available: ${Object.keys(
          TEMPLATES
        ).join(", ")}`,
      },
      meetingName: {
        type: "string",
        description: "The meeting name, used in the subject and the title.",
      },
      meetingDate: {
        type: "string",
        description: "The meeting date, shown under the title and in the subject.",
      },
      attendees: {
        type: "array",
        items: { type: "string" },
        description: "Full names of the attendees, listed as the participants.",
      },
      summary: {
        type: "string",
        description: "The overall meeting summary.",
      },
      highlights: {
        type: "array",
        description: "The meeting's highlights grouped by topic.",
        items: {
          type: "object",
          properties: {
            topic: { type: "string" },
            highlights: { type: "array", items: { type: "string" } },
          },
          required: ["topic", "highlights"],
        },
      },
      next_steps: {
        type: "array",
        items: { type: "string" },
        description: "Next steps the meeting left behind. Rendered by meeting_summary_b only.",
      },
    },
    required: ["template"],
  },
  handler: async ({ template, ...fields }) => {
    const render = TEMPLATES[template];
    if (!render) {
      return toolError(
        `Unknown template "${template}". Available templates: ${Object.keys(
          TEMPLATES
        ).join(", ")}`
      );
    }

    const email = render({
      meetingName: fields.meetingName ?? undefined,
      meetingDate: fields.meetingDate ?? undefined,
      attendees: fields.attendees ?? undefined,
      summary: fields.summary ?? undefined,
      highlights: fields.highlights ?? undefined,
      next_steps: fields.next_steps ?? undefined,
    });

    logger.info(
      { tool: "TELCO:prepare_email", template, subject: email.subject },
      "Email prepared from template"
    );

    return toolResult(email);
  },
};
