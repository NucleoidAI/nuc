import type { EntryType, JsonValue } from "@typesafe-ai/sdk";
import { ask, choice, noul } from "../../lib/decision";
import { type ChatHistory, handoffTargets, knowledge } from "./context";
import type { LLMMeta } from "@canmingir/link-express/llm";
import blueprintFn from "../blueprint";
import dataset from "../../dataset";
import { generate } from "@canmingir/link-express/llm";
import { normalizeFlow } from "./flow";

type BlueprintChatDecision = "KNOWLEDGE" | "BLUEPRINT";

const SUFFICIENT_ANSWERS: Record<BlueprintChatDecision, string> = {
  KNOWLEDGE: "I'll add it to the knowledge base.",
  BLUEPRINT: "I'll add it to the blueprint.",
};

const CHAT_CONTEXT = [
  "`supervising`",
  "`conversation`",
  "`knowledge_base`",
  "`blueprint`",
];

type BlueprintChatContextSummary = {
  knowledge: { type?: string; question?: string; text?: string }[];
  referenceBlueprint: { id?: string; title?: string; nodeCount: number } | null;
  supervising: { question?: string; status?: string } | null;
};

function system(content: object) {
  return { role: "system" as const, content: JSON.stringify(content) };
}

function chatDecisionState(history: ChatHistory = [], content: string) {
  const conversation = history.filter(({ role }) => role !== "system");

  return JSON.parse(
    JSON.stringify({
      ...history
        .filter(({ role }) => role === "system")
        .reduce(
          (state, message) => ({
            ...state,
            ...JSON.parse(message.content),
          }),
          {},
        ),
      ...(conversation.length && { conversation }),
      user_message: content,
    }),
  ) as Record<string, JsonValue>;
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
            blueprint: blueprintFn.stripDetails(referenceBlueprint),
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
  const { decision } = await ask({
    state: chatDecisionState(history, content) as EntryType,
    questions: {
      decision: choice(
        {
          select: "update_target",
          supervisor_reply: "`user_message`",
          context: CHAT_CONTEXT,
          few_shots: dataset.decision
            .supervisingChatDecision as unknown as JsonValue[],
        },
        {
          KNOWLEDGE: {
            target: "knowledge_base",
          },
          BLUEPRINT: {
            target: "blueprint",
          },
        },
      ),
    },
    meta: { ...meta, source: "agent.blueprintChatDecision" },
  });

  console.debug(
    `[decision] blueprint chat decision ${decision.choice}:`,
    JSON.stringify(decision.probabilities),
  );

  return { decision: decision.choice as BlueprintChatDecision };
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
  const { sufficient } = await ask({
    state: { ...chatDecisionState(history, content), decision } as EntryType,
    questions: {
      sufficient: noul(
        {
          decide: "reply_is_sufficient",
          update_target: "`decision`",
          supervisor_reply: "`user_message`",
          context: CHAT_CONTEXT,
          few_shots: dataset.decision
            .supervisingChatSufficiency as unknown as JsonValue[],
        },
        {
          true: { reply: "clear and specific enough to apply" },
          false: { reply: "vague or missing details" },
        },
      ),
    },
    meta: { ...meta, source: "agent.blueprintChatSufficiency" },
  });

  console.debug(
    `[decision] blueprint chat ${decision} sufficient with ${sufficient.noul}`,
  );

  if (sufficient.noul >= 0.5) {
    return { sufficient: true, answer: SUFFICIENT_ANSWERS[decision] };
  }

  const { answer } = await generate({
    dataset: dataset.llm.blueprintChatSufficiency,
    context: [system({ decision, sufficient: false }), ...(history ?? [])],
    content,
    json_format: "{ answer: <FOLLOW_UP_QUESTION> }",
    meta,
  });

  return { sufficient: false, answer: answer as string | undefined };
}

async function blueprintChatKnowledge({
  content,
  meta,
}: {
  content: string;
  meta?: LLMMeta;
}) {
  const response = await generate({
    dataset: dataset.llm.blueprintChatKnowledge,
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
    dataset: dataset.llm.blueprintChat,
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
    dataset: dataset.llm.blueprintName,
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
    dataset: dataset.llm.blueprintDescription,
    context: [{ role: "system", content: { nodes } }],
    content: nodes,
    json_format: "{ description: <DESCRIPTION> }",
    meta,
  });

  return response.description as string;
}

async function blueprintSkill({ nodes }: { nodes: object[] }) {
  const response = await generate({
    dataset: dataset.llm.blueprintSkill,
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
