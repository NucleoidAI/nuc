import type { Stack } from "./stack";

type TaskRecord = {
  id: string;
  agentId: string;
  blueprintId: string | null;
  sessionId: string | null;
  status: "IN_PROGRESS" | "COMPLETED" | "FAILED";
  result: string | null;
  comment: string | null;
};

type StepRecord = {
  id: string;
  action: string;
  status: string;
  parameters: Record<string, unknown>;
  comment: string | null;
  result: string | null;
};

type RaisedSupervising = {
  id: string;
  question: string;
  taskId: string | null;
  blueprintId: string | null;
  agentId: string;
  sessionId: string;
  status: string;
};

async function listTasks(stack: Stack, agentId: string) {
  return await stack.client.get<TaskRecord[]>(`/tasks?agentId=${agentId}`);
}

async function listSteps(stack: Stack, taskId: string) {
  return await stack.client.get<StepRecord[]>(`/tasks/${taskId}/steps`);
}

async function stepActions(stack: Stack, taskId: string) {
  return (await listSteps(stack, taskId)).map((step) => step.action);
}

/** Opens a chat session with an agent and sends the opening user message. */
async function startSession(stack: Stack, agentId: string, content: string) {
  const session = await stack.client.post<{ id: string }>("/sessions", {
    type: "CHAT",
    agentId,
  });

  await stack.client.post(`/sessions/${session.id}`, { content });

  return session.id;
}

/**
 * Runs a task to its terminal state while answering the two things the agent
 * can block on: questions to the user and questions to the supervisor.
 *
 * `userAnswers` are consumed in order, one per `PLATFORM:user_interaction`
 * step. `onSupervising` is invoked once per raised supervision, and is what a
 * scenario uses to hand back either knowledge or a reshaped blueprint.
 */
async function driveTask({
  stack,
  taskId,
  agentId,
  sessionId,
  userAnswers = [],
  onSupervising,
  timeoutMs = 300_000,
  pollMs = 1_000,
}: {
  stack: Stack;
  taskId: string;
  agentId: string;
  sessionId: string;
  userAnswers?: string[];
  onSupervising?: (supervising: RaisedSupervising) => Promise<void>;
  timeoutMs?: number;
  pollMs?: number;
}): Promise<TaskRecord> {
  const pendingAnswers = [...userAnswers];
  const answeredSteps = new Set<string>();
  const handledSupervisings = new Set<string>();

  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const task = (await listTasks(stack, agentId)).find(
      (candidate) => candidate.id === taskId
    );

    if (task && task.status !== "IN_PROGRESS") {
      return task;
    }

    const steps = await listSteps(stack, taskId);

    const waitingStep = steps.find(
      (step) =>
        step.status === "WAITING_FOR_USER" && !answeredSteps.has(step.id)
    );

    if (waitingStep) {
      answeredSteps.add(waitingStep.id);
      const answer = pendingAnswers.shift();

      if (answer === undefined) {
        throw new Error(
          "Agent asked the user something it has no scripted answer for: " +
            JSON.stringify(waitingStep.parameters)
        );
      }

      await stack.client.post(`/sessions/${sessionId}`, { content: answer });
    }

    if (onSupervising) {
      const supervisings = await stack.client.get<RaisedSupervising[]>(
        "/supervisings?status=IN_PROGRESS"
      );

      for (const supervising of supervisings) {
        if (supervising.taskId !== taskId) continue;
        if (handledSupervisings.has(supervising.id)) continue;
        handledSupervisings.add(supervising.id);
        await onSupervising(supervising);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }

  const steps = await listSteps(stack, taskId);

  throw new Error(
    `Task ${taskId} did not settle within ${timeoutMs}ms. Steps so far:\n` +
      steps
        .map(
          (step) => `  ${step.action} [${step.status}] ${step.comment ?? ""}`
        )
        .join("\n")
  );
}

export { driveTask, startSession, listTasks, listSteps, stepActions };
export type { RaisedSupervising, StepRecord, TaskRecord };
