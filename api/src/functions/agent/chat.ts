import { conversations, knowledge } from "./context";
import { findStep, replyToApproval } from "./approval";
import agentData from "../agentData";
import blueprintFn from "../blueprint";
import dataset from "../../dataset";
import { generate } from "../../lib/llm";
import message from "../message";
import platform from "@canmingir/link-express";
import session from "../session";
import supervising from "../supervising";
import taskFn from "../task";

async function startBlueprintTask({
  agentId,
  sessionId,
  blueprintId,
}: {
  agentId: string;
  sessionId: string;
  blueprintId: string;
}) {
  const [blueprint, taskCount] = await Promise.all([
    blueprintFn.get({ blueprintId }),
    taskFn.count({ blueprintId }),
  ]);

  await taskFn.create({
    agentId,
    description: `${blueprint.title} #${taskCount + 1}`,
    blueprintId,
    sessionId,
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

  const { evaluation } = await generate({
    dataset: dataset.train.chat,
    context,
    content,
    json_format: "{ evaluation: { is_answer_known: <true|false> } }",
    meta: { agentId, sessionId, source: "agent.chat.evaluation" },
  });

  if (evaluation?.is_answer_known) {
    const { answer } = await generate({
      policy: dataset.policy,
      dataset: dataset.train.chat,
      context,
      content,
      json_format: "{ answer: <ANSWER_IN_NLP>, confidence: <0-1> }",
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
    dataset: dataset.train.teamChat,
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
          next.parameters
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

async function evaluateSupervisionAnswer({
  agentId,
  content,
}: {
  agentId: string;
  content: {
    question: string;
    answer: string;
  };
}) {
  const knowledge_base = await knowledge({ agentId });

  return generate({
    dataset: dataset.train.blueprintChatEvaluation,
    context: [
      { role: "system", content: { knowledge_base } },
      {
        role: "system",
        content: {
          supervision_context: {
            original_question: content.question,
            proposed_answer: content.answer,
          },
        },
      },
    ],
    content: `${content.question}\n\nAnswer: ${content.answer}`,
    json_format: `{
      "is_answer_known": <true|false>,
    }`,
    meta: { agentId, source: "agent.evaluateSupervisionAnswer" },
  });
}

export { chat, evaluateSupervisionAnswer, teamChat };
