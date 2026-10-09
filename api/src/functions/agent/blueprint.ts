import { type ChatHistory, handoffTargets, knowledge } from "./context";
import type { LLMMeta } from "@canmingir/link-express/llm";
import blueprintFn from "../blueprint";
import dataset from "../../dataset";
import { generate } from "@canmingir/link-express/llm";
import { normalizeFlow } from "./flow";

type BlueprintChatDecision = "KNOWLEDGE" | "BLUEPRINT";

type BlueprintChatContextSummary = {
  knowledge: { type?: string; question?: string; text?: string }[];
  referenceBlueprint: { id?: string; title?: string; nodeCount: number } | null;
  supervising: { question?: string; status?: string } | null;
};

function system(content: object) {
  return { role: "system" as const, content: JSON.stringify(content) };
}

async function blueprintChatContext({
  agentId,
  teamId,
  blueprintId,
  supervising,
}: {
  agentId: string;
  teamId?: string | null;
  blueprintId?: string | null;
  supervising?: {
    id: string;
    question: string;
    status: string;
    taskId?: string | null;
    blueprintId?: string | null;
  } | null;
}): Promise<{
  messages: { role: "system"; content: string }[];
  summary: BlueprintChatContextSummary;
}> {
  const [knowledge_base, referenceBlueprint, targets] = await Promise.all([
    knowledge({ agentId }),
    blueprintId ? blueprintFn.getWithNodes(blueprintId) : Promise.resolve(null),
    handoffTargets({ agentId, teamId }),
  ]);

  const messages = [
    system({ knowledge_base }),
    ...(referenceBlueprint
      ? [
          system({
            referenceBlueprint: blueprintFn.stripDetails(referenceBlueprint),
          }),
        ]
      : []),
    ...(supervising ? [system({ supervising })] : []),
    system({ handoffTargets: targets }),
  ];

  const reference = referenceBlueprint as {
    id?: string;
    title?: string;
    nodes?: unknown[];
  } | null;

  const summary: BlueprintChatContextSummary = {
    knowledge: knowledge_base.map(({ type, question, text }) => ({
      type: type ?? undefined,
      question: question ?? undefined,
      text: text ?? undefined,
    })),
    referenceBlueprint: reference
      ? {
          id: reference.id,
          title: reference.title,
          nodeCount: Array.isArray(reference.nodes)
            ? reference.nodes.length
            : 0,
        }
      : null,
    supervising: supervising
      ? { question: supervising.question, status: supervising.status }
      : null,
  };

  return { messages, summary };
}

async function blueprintChatDecision({
  history,
  content,
  meta,
}: {
  history?: ChatHistory;
  content: string;
  meta?: LLMMeta;
}) {
  const response = await generate({
    dataset: dataset.train.blueprintChatDecision,
    context: history,
    content,
    json_format: '{ decision: <"KNOWLEDGE"|"BLUEPRINT"> }',
    meta,
  });

  return response as { decision: BlueprintChatDecision };
}

async function blueprintChatSufficiency({
  history,
  content,
  decision,
  meta,
}: {
  history?: ChatHistory;
  content: string;
  decision: BlueprintChatDecision;
  meta?: LLMMeta;
}) {
  const response = await generate({
    dataset: dataset.train.blueprintChatSufficiency,
    context: [system({ decision }), ...(history ?? [])],
    content,
    json_format: "{ sufficient: <true|false>, answer: <ANSWER> }",
    meta,
  });

  return response as { sufficient: boolean; answer?: string };
}

async function blueprintChatKnowledge({
  content,
  meta,
}: {
  content: string;
  meta?: LLMMeta;
}) {
  const response = await generate({
    dataset: dataset.train.blueprintChatKnowledge,
    content,
    json_format: "{ knowledge: <EXTRACTED_KNOWLEDGE> }",
    meta,
  });

  return response as { knowledge: string };
}

async function Blueprint({
  history,
  content,
  existingBlueprint,
  meta,
}: {
  history?: ChatHistory;
  content: string;
  existingBlueprint?: { nodes?: unknown[] } | null;
  meta?: LLMMeta;
}) {
  const context = [
    ...(existingBlueprint
      ? [
          {
            role: "system" as const,
            content: {
              existingBlueprint: blueprintFn.stripDetails(existingBlueprint),
            },
          },
        ]
      : []),
    ...(history ?? []),
  ];

  const response = await generate({
    dataset: dataset.train.blueprintChat,
    context,
    content,
    json_format: "{ response: <RESPONSE>, flow: [<FLOW>] }",
    meta,
  });

  if (Array.isArray(response.flow)) {
    response.flow = normalizeFlow(response.flow, existingBlueprint?.nodes);
  }

  return response;
}

async function blueprintName({
  history,
  content,
  agentId,
}: {
  history?: ChatHistory;
  content: string;
  agentId: string;
}) {
  return generate({
    dataset: dataset.train.blueprintName,
    context: history,
    content,
    json_format: "{ title: <TITLE>, description: <DESCRIPTION> }",
    meta: { agentId, source: "agent.blueprintName" },
  });
}

async function blueprintDescription({
  nodes,
  meta,
}: {
  nodes: object[];
  meta?: LLMMeta;
}) {
  const response = await generate({
    dataset: dataset.train.blueprintDescription,
    context: [{ role: "system", content: { nodes } }],
    content: nodes,
    json_format: "{ description: <DESCRIPTION> }",
    meta,
  });

  return response.description as string;
}

async function blueprintSkill({ nodes }: { nodes: object[] }) {
  const response = await generate({
    dataset: dataset.train.blueprintSkill,
    context: [{ role: "system", content: { nodes } }],
    content: nodes,
    json_format: "{ skill: <SKILL> }",
  });

  return response.skill as string;
}

export {
  Blueprint,
  blueprintChatContext,
  blueprintChatDecision,
  blueprintChatKnowledge,
  blueprintChatSufficiency,
  blueprintDescription,
  blueprintName,
  blueprintSkill,
};
