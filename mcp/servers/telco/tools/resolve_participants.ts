import { ResolveParticipantsInput, Tool } from "./types";
import { toolError, toolResult } from "./meeting_result";

import logger from "../../../logger/logger.js";

function deepResolve(
  value: unknown,
  replacements: [string, string][],
): unknown {
  if (typeof value === "string") {
    return replacements.reduce(
      (text, [id, name]) => text.split(id).join(name),
      value,
    );
  }

  if (Array.isArray(value)) {
    return value.map((item) => deepResolve(item, replacements));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [
        key,
        deepResolve(val, replacements),
      ]),
    );
  }

  return value;
}

export const resolveParticipantsTool: Tool<ResolveParticipantsInput> = {
  name: "TELCO:resolve_participants",
  description:
    "Replace participant IDs with their real names, anywhere they appear (recursively) inside a text transcript or a structured summary object, using a participants list from metadata",
  inputSchema: {
    type: "object",
    properties: {
      content: {
        description:
          "The transcript string or structured summary object (e.g. output of summarize_meeting_by_speaker) containing participant IDs to resolve.",
      },
      participants: {
        type: "array",
        description: "Array of participant objects from meeting metadata.",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
          },
          required: ["id", "name"],
        },
      },
    },
    required: ["content", "participants"],
  },
  handler: async ({ content, participants }: ResolveParticipantsInput) => {
    try {
      if (content === undefined || content === null) {
        return toolResult({ error: "content is required" });
      }

      if (!participants?.length) {
        return toolResult({ error: "participants array is required" });
      }

      logger.info(
        {
          tool: "TELCO:resolve_participants",
          participants: participants.length,
        },
        "Resolving participant IDs to names",
      );

      const replacements = participants.map(
        ({ id, name }) => [id, name] as [string, string],
      );

      return toolResult({ content: deepResolve(content, replacements) });
    } catch (error) {
      logger.error(
        {
          tool: "TELCO:resolve_participants",
          err: error instanceof Error ? error : new Error(String(error)),
        },
        "Failed to resolve participants",
      );

      return toolError(error);
    }
  },
};
