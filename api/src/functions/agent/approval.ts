import type { EntryType, JsonValue } from "@typesafe-ai/sdk";
import { ask, choice } from "../../lib/decision";
import type { ContextMessage } from "./context";
import type { LLMMeta } from "@canmingir/link-express/llm";
import Agent from "../../models/Agent";
import dataset from "../../dataset";
import { generate } from "@canmingir/link-express/llm";
import platform from "@canmingir/link-express";
import session from "../session";
import taskFn from "../task";

type TaskWithSteps = Awaited<ReturnType<typeof taskFn.list>>[number];

function findStep(tasks: TaskWithSteps[], status: string) {
  for (const task of tasks) {
    const step = task.steps.find((step) => step.status === status);

    if (step) {
      return { task, step };
    }
  }

  return null;
}

async function approvalQuestion({
  instructions,
  label,
  context,
  content,
  meta,
}: {
  instructions?: string;
  label?: string;
  context?: ContextMessage[];
  content: string | object;
  meta?: LLMMeta;
}) {
  const fallback = instructions || label;

  try {
    const { question } = await generate({
      dataset: dataset.llm.approvalQuestion,
      context,
      content: { instructions, label, task: content },
      json_format: "{ question: <QUESTION> }",
      meta,
    });

    const generated = typeof question === "string" ? question.trim() : "";

    return generated || fallback;
  } catch (error) {
    platform.logger.error(error);

    return fallback;
  }
}

async function approvalDecision({
  question,
  content,
  meta,
}: {
  question?: string;
  content: string;
  meta?: LLMMeta;
}) {
  const { decision } = await ask({
    state: JSON.parse(
      JSON.stringify({ question, customer_reply: content }),
    ) as EntryType,
    questions: {
      decision: choice(
        {
          select: "customer_decision",
          question: "`question`",
          reply: "`customer_reply`",
          few_shots: dataset.decision
            .customerApproval as unknown as JsonValue[],
        },
        {
          APPROVED: { customer: "approves" },
          REJECTED: { customer: "rejects" },
          UNCLEAR: { customer: "asks_something_else_or_has_not_decided" },
        },
      ),
    },
    meta: { ...meta, source: "agent.approvalDecision" },
  });

  console.debug(
    `[decision] approval decision ${decision.choice}:`,
    JSON.stringify(decision.probabilities),
  );

  return decision.choice;
}

async function replyToApproval({
  agentId,
  sessionId,
  content,
  task,
  step,
}: {
  agentId: string;
  sessionId: string;
  content: string;
} & NonNullable<ReturnType<typeof findStep>>) {
  if (step.action === "PLATFORM:two_factor") {
    await session.addConversation({
      sessionId,
      agentId,
      role: "ASSISTANT",
      content: "Please complete the pending 2FA verification to continue.",
    });
    return;
  }

  const question = step.parameters?.question;

  const decision = await approvalDecision({
    question,
    content,
    meta: { agentId, sessionId, taskId: task.id },
  });

  if (decision === "APPROVED" || decision === "REJECTED") {
    await taskFn.updateStep({
      stepId: step.id,
      result: decision,
      status: "COMPLETED",
    });
    return;
  }

  await session.addConversation({
    sessionId,
    agentId,
    role: "ASSISTANT",
    content: question
      ? `I still need your decision. ${question}`
      : "I still need your approval to continue.",
  });
}

async function waitingApproval({ sessionId }: { sessionId: string }) {
  const sessionInstance = await session.get({ sessionId });

  if (!sessionInstance) {
    throw new Error("Session not found");
  }

  const agentInstance = await Agent.findByPk(sessionInstance.agentId);

  if (!agentInstance) {
    throw new Error("Agent not found");
  }

  const tasks = await taskFn.list({
    teamId: agentInstance.teamId,
    agentId: sessionInstance.agentId,
    status: "IN_PROGRESS",
    sessionId,
    includeSteps: true,
  });

  const waiting = findStep(tasks, "WAITING_FOR_APPROVAL");

  return waiting
    ? {
        agentId: sessionInstance.agentId,
        taskId: waiting.task.id,
        step: waiting.step,
      }
    : null;
}

async function approve({
  sessionId,
  decision,
  comment,
}: {
  sessionId: string;
  decision: "APPROVED" | "REJECTED";
  comment?: string;
}) {
  const waiting = await waitingApproval({ sessionId });

  if (!waiting) {
    throw new Error("No step is waiting for approval in this session");
  }

  if (waiting.step.action === "PLATFORM:two_factor") {
    throw new Error("Use the 2FA verification endpoint");
  }

  if (comment) {
    await taskFn.updateStepComment({
      taskId: waiting.taskId,
      stepId: waiting.step.id,
      comment,
    });
  }

  await taskFn.updateStep({
    stepId: waiting.step.id,
    result: decision,
    status: "COMPLETED",
  });

  return { taskId: waiting.taskId, stepId: waiting.step.id, decision };
}

export {
  approvalQuestion,
  approve,
  findStep,
  replyToApproval,
  waitingApproval,
};
