import { ask, noul } from "../../lib/decision";
import { conversations, knowledge } from "./context";
import { findStep, replyToApproval } from "./approval";
import type { EntryType } from "@typesafe-ai/sdk";
import agentData from "../agentData";
import blueprintFn from "../blueprint";
import dataset from "../../dataset";
import { generate } from "@canmingir/link-express/llm";
import message from "../message";
import platform from "@canmingir/link-express";
import session from "../session";
import supervising from "../supervising";
import taskFn from "../task";

async function startBlueprintTask({
  agentId,
  sessionId,
  blueprintId,
  debug,
  request,
}: {
  agentId: string;
  sessionId: string;
  blueprintId: string;
  debug: boolean;
  request?: { nodeId: string; body: Record<string, unknown> };
}) {
  const [blueprint, taskCount] = await Promise.all([
    blueprintFn.get({ blueprintId }),
    taskFn.count({ blueprintId, debug }),
  ]);

  return taskFn.create({
    agentId,
    description: `${blueprint.title} #${taskCount + 1}`,
    blueprintId,
    sessionId,
    debug,
    request,
  });
}

async function answerOrEscalate({
  agentId,
  sessionId,
  content,
}: {
  agentId: string;
  sessionId: string;
  content: string;
}) {
  const [knowledge_base, history] = await Promise.all([
    knowledge({ agentId }),
    conversations({ sessionId }),
  ]);

  const context = [
    { role: "system" as const, content: { knowledge_base } },
    ...history,
  ];

  const dialogue = history.filter(({ role }) => role !== "system");

  const { answer_known } = await ask({
    state: JSON.parse(
      JSON.stringify({
        knowledge_base,
        ...(dialogue.length && { conversation: dialogue }),
        customer_message: content,
      }),
    ) as EntryType,
    questions: {
      answer_known: noul(
        {
          decide: "answer_is_known",
          question: "`customer_message`",
          evidence: ["`knowledge_base`", "`conversation`"],
        },
        {
          true: { knowledge_base: "contains_the_answer" },
          false: { knowledge_base: "does_not_contain_the_answer" },
        },
      ),
    },
    meta: { agentId, sessionId, source: "agent.chat.evaluation" },
  });

  console.debug(`[decision] chat answer known with ${answer_known.noul}`);

  if (answer_known.noul >= 0.5) {
    const { answer } = await generate({
      policy: dataset.llm.policy,
      context,
      content,
      json_format: "{ answer: <ANSWER_IN_NLP>}",
      meta: { agentId, sessionId, source: "agent.chat.answer" },
    });

    await session.addConversation({
      sessionId,
      agentId,
      role: "ASSISTANT",
      content: answer,
    });
    return;
  }

  const conversation = await session.addConversation({
    sessionId,
    agentId,
    role: "ASSISTANT",
    content: "Please wait while I am working on your request.",
  });

  await supervising.create({
    sessionId,
    conversationId: conversation.id,
    question: content,
    agentId,
  });
}

// TODO: Rename
async function chat({
  agentId,
  sessionId,
  content,
}: {
  agentId: string;
  sessionId: string;
  content: string;
}) {
  const agent = await agentData.get({ agentId });

  if (!agent) {
    throw new Error("Agent not found");
  }

  const tasks = await taskFn.list({
    teamId: agent.teamId,
    agentId,
    status: "IN_PROGRESS",
    sessionId,
    includeSteps: true,
  });

  const approval = findStep(tasks, "WAITING_FOR_APPROVAL");

  if (approval) {
    return replyToApproval({ agentId, sessionId, content, ...approval });
  }

  const waiting = findStep(tasks, "WAITING_FOR_USER");

  if (waiting) {
    await taskFn.updateStep({
      stepId: waiting.step.id,
      result: content,
      status: "COMPLETED",
    });
    return;
  }

  if (tasks.length > 0) {
    return;
  }

  const sessionInstance = await session.get({ sessionId });

  if (sessionInstance?.blueprintId) {
    return startBlueprintTask({
      agentId,
      sessionId,
      blueprintId: sessionInstance.blueprintId,
      debug: sessionInstance.debug,
    });
  }

  return answerOrEscalate({ agentId, sessionId, content });
}

async function teamChat({
  content,
  teamId,
}: {
  content: string;
  teamId: string;
}) {
  const context = (await message.listMessages({ teamId }))
    .filter(({ role }) => role === "USER" || role === "ASSISTANT")
    .map(({ role, content }) => ({
      role: role.toLowerCase() as "user" | "assistant",
      content,
    }));

  const meta = { teamId, source: "agent.teamChat" };

  const next = await generate({
    dataset: dataset.llm.teamChat,
    context,
    content,
    json_format:
      "{ resource: <RESOURCE>, function: <FUNCTION>, parameters: <PARAMETERS> }",
    meta,
  });

  const hasCall = next.resource && next.function && next.parameters;
  let data;

  if (hasCall) {
    try {
      const resource = require(`../${next.resource}`).default;
      data = await resource[next.function]({ ...next.parameters, teamId });
    } catch (err) {
      platform.logger.error(err);
    }
  }

  const { response } = await generate({
    context,
    content: hasCall
      ? `${next.resource}.${next.function}(${JSON.stringify(
          next.parameters,
        )})=${JSON.stringify(data)} ${content}`
      : content,
    json_format: "{ response: <RESPONSE> }",
    meta,
  });

  await message.create({
    role: "ASSISTANT",
    content: typeof response === "object" ? JSON.stringify(response) : response,
    teamId,
  });
}

export { chat, teamChat };
