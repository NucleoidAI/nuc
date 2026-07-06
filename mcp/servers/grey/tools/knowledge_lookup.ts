import { Tool } from "../../gdrive/tools/types";
import logger from "../../../logger/logger.js";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || "greycollar-internal";

export const knowledgeLookupTool: Tool<any> = {
  name: "GREY:knowledge_lookup",
  description:
    "Look up all knowledge entries for this agent. Returns every knowledge item the agent has, including TEXT, QA, and DATA types. Always use this before making decisions that depend on facts that may have been updated by a supervisor, such as product certificates or policies.",
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
  },
  handler: async (args: any) => {
    logger.info(
      { tool: "GREY:knowledge_lookup", agentId: args.agentId, query: args.query },
      "Looking up agent knowledge"
    );

    try {
      const url = new URL(`${API_BASE_URL}/internal/knowledge`);
      url.searchParams.set("agentId", args.agentId);

      const response = await fetch(url.toString(), {
        headers: {
          "x-internal-key": INTERNAL_API_KEY,
        },
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        let errorMessage = "LOOKUP_FAILED";
        try {
          const parsed = body ? JSON.parse(body) : null;
          if (parsed && parsed.error) errorMessage = parsed.error;
        } catch (_) {}
        logger.warn(
          { tool: "GREY:knowledge_lookup", status: response.status, body },
          "Knowledge lookup failed"
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ error: errorMessage }),
            },
          ],
          isError: true,
        };
      }

      const knowledgeList: any[] = await response.json();

      logger.info(
        { tool: "GREY:knowledge_lookup", agentId: args.agentId, total: knowledgeList.length },
        "Knowledge lookup completed"
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ agentId: args.agentId, knowledge: knowledgeList }),
          },
        ],
        isError: false,
      };
    } catch (error) {
      logger.error(
        {
          tool: "GREY:knowledge_lookup",
          err: error instanceof Error ? error : new Error(String(error)),
          agentId: args.agentId,
        },
        "Knowledge lookup error"
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
