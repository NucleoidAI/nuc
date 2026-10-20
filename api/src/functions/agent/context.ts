import Agent from "../../models/Agent";
import actions from "../../actions";
import blueprintFn from "../blueprint";
import knowledgeFn from "../knowledge";
import mcpFn from "../mcp";
import session from "../session";

type Role = "user" | "system" | "assistant";

type ContextMessage = {
  role: Role;
  content: string | object;
};

type ChatHistory = {
  role: Role;
  content: string;
}[];

async function knowledge({ agentId }: { agentId: string }) {
  const knowledgeList = await knowledgeFn.listForLLM({ agentId });

  return knowledgeList
    .map(({ type, question, answer, text, content }) => ({
      type,
      question,
      answer,
      text,
      content,
    }))
    .filter(
      ({ question, answer, text, content }) =>
        question || answer || text || content,
    );
}

async function blueprint({ blueprintId }: { blueprintId: string }) {
  return blueprintFn.get({ blueprintId, includeDetails: false });
}

async function sessionVariables({ sessionId }: { sessionId: string }) {
  const sessionInstance = await session.get({ sessionId });

  return (sessionInstance?.variables ?? {}) as Record<string, unknown>;
}

async function conversations({
  sessionId,
}: {
  sessionId: string;
}): Promise<ContextMessage[]> {
  const conversations = await session.listConversations({ sessionId });

  return conversations.map(({ role, content }) => ({
    role: role.toLowerCase() as Role,
    content,
  }));
}

async function handoffTargets({
  agentId,
  teamId,
}: {
  agentId: string;
  teamId?: string | null;
}) {
  if (!teamId) {
    return [];
  }

  const agentInstances = await Agent.findAll({ where: { teamId } });

  return Promise.all(
    agentInstances
      .filter((instance) => instance.id !== agentId)
      .map(async (instance) => ({
        targetAgentId: instance.id,
        name: instance.name,
        description: instance.description,
        blueprints: (
          await blueprintFn.list({
            agentId: instance.id,
            includeDetails: false,
          })
        ).map(({ id, title }: { id: string; title: string }) => ({
          targetBlueprintId: id,
          title,
        })),
      })),
  );
}

async function taskContext({
  agentId,
  teamId,
  blueprintId,
  inheritedSteps,
  variables,
  isBlocking,
}: {
  agentId: string;
  teamId?: string;
  blueprintId?: string;
  inheritedSteps?: object[] | null;
  variables: Record<string, unknown>;
  isBlocking: boolean;
}) {
  const [knowledge_base, blueprint, mcp_tools] = await Promise.all([
    knowledge({ agentId }),
    blueprintId
      ? blueprintFn.get({ blueprintId, includeDetails: false })
      : null,
    mcpFn.tools({ agentId, teamId }, { includeMock: false }),
  ]);

  return {
    knowledge_base,
    blueprint,
    ...(inheritedSteps?.length && { inherited_context_steps: inheritedSteps }),
    ...(Object.keys(variables).length && { session_variables: variables }),
    mcp_tools,
    actions: actions.definitions({ blocking: isBlocking }),
  };
}

export type { ChatHistory, ContextMessage };
export {
  blueprint,
  conversations,
  handoffTargets,
  knowledge,
  sessionVariables,
  taskContext,
};
