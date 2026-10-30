import Agent from "../models/Agent";
import LLMLog from "../models/LLMLog";
import Step from "../models/Step";
import Supervising from "../models/Supervising";
import Task from "../models/Task";
import { Op, col, fn } from "sequelize";
import { event } from "@canmingir/link-express/event/client";

async function create({
  agentId,
  description,
  blueprintId,
  sessionId,
  inheritedSteps,
  request,
}: {
  agentId: string;
  description: string;
  blueprintId?: string;
  sessionId?: string;
  inheritedSteps?: object[];
  request?: { nodeId: string; body: Record<string, unknown> };
}) {
  const task = await Task.create({
    agentId,
    description,
    status: "IN_PROGRESS",
    blueprintId,
    sessionId,
    inheritedSteps: inheritedSteps?.length ? inheritedSteps : null,
  });

  if (request) {
    await Step.create({
      taskId: task.id,
      action: "PLATFORM:api_request",
      parameters: request.body,
      result: JSON.stringify(request.body),
      comment: "Received API request.",
      status: "COMPLETED",
      nodeId: request.nodeId,
    });
  }

  await event.publish("TASK_CREATED", {
    taskId: task.id,
    agentId,
    description,
    blueprintId,
    sessionId,
  });

  return task;
}

async function update({
  taskId,
  result,
  comment,
  status,
}: {
  taskId: string;
  result?: string;
  comment?: string;
  status: "COMPLETED" | "FAILED";
}) {
  await Task.update({ result, comment, status }, { where: { id: taskId } });

  if (status === "COMPLETED") {
    await event.publish("TASK_COMPLETED", { taskId, result, comment });
  } else {
    await event.publish("TASK_FAILED", { taskId, comment });
  }
}

const waiters = new Map<string, Set<() => void>>();

let listening: Promise<unknown> | undefined;

async function waitFor({
  taskId,
  timeoutMs,
}: {
  taskId: string;
  timeoutMs: number;
}) {
  listening ??= Promise.all(
    ["TASK_COMPLETED", "TASK_FAILED"].map((type) =>
      event.subscribe<{ taskId: string }>(type, ({ taskId }) => {
        waiters.get(taskId)?.forEach((notify) => notify());
      })
    )
  ).catch((error) => {
    listening = undefined;
    throw error;
  });

  await listening;

  let notify!: () => void;
  const settled = new Promise<void>((resolve) => (notify = resolve));
  const timer = setTimeout(notify, timeoutMs);

  const taskWaiters = waiters.get(taskId) ?? new Set<() => void>();
  taskWaiters.add(notify);
  waiters.set(taskId, taskWaiters);

  try {
    const task = await Task.findByPk(taskId);
    if (task && task.status !== "IN_PROGRESS") return task.toJSON();

    await settled;

    const settledTask = await Task.findByPk(taskId);
    return settledTask && settledTask.status !== "IN_PROGRESS"
      ? settledTask.toJSON()
      : null;
  } finally {
    clearTimeout(timer);
    taskWaiters.delete(notify);
    if (!taskWaiters.size) waiters.delete(taskId);
  }
}

async function get({ taskId }: { taskId: string }) {
  const taskInstance = await Task.findOne({ where: { id: taskId } });
  if (!taskInstance) throw new Error(`Task not found: ${taskId}`);
  return taskInstance.toJSON();
}

async function count({ blueprintId }: { blueprintId: string }) {
  return Task.count({ where: { blueprintId } });
}

async function list({
  teamId,
  agentId,
  status,
  sessionId,
  includeSteps,
  from,
  to,
}: {
  teamId: string;
  agentId?: string;
  status?: "IN_PROGRESS" | "COMPLETED" | "FAILED";
  sessionId?: string;
  includeSteps?: boolean;
  from?: string;
  to?: string;
}) {
  const where: {
    agentId?: string;
    status?: "IN_PROGRESS" | "COMPLETED" | "FAILED";
    sessionId?: string;
    createdAt?: { [Op.between]: [string, string] };
  } = {};

  if (agentId) {
    where.agentId = agentId;
  }

  if (status) {
    where.status = status;
  }

  if (sessionId) {
    where.sessionId = sessionId;
  }

  if (from && to) {
    where.createdAt = { [Op.between]: [from, to] };
  }

  const taskInstances = await Task.findAll({
    include: [
      {
        model: Agent,
        attributes: [],
        where: { teamId },
        required: true,
      },
      ...(includeSteps
        ? [
            {
              model: Step,
              as: "steps",
            },
          ]
        : []),
    ],
    where,
    ...(includeSteps && {
      order: [[{ model: Step, as: "steps" }, "createdAt", "ASC"]],
    }),
  });

  return taskInstances.map((task) => task.toJSON());
}

async function listWithAgents({
  teamId,
  agentId,
  status,
  from,
  to,
}: {
  teamId: string;
  agentId?: string;
  status?: "IN_PROGRESS" | "COMPLETED" | "FAILED";
  from?: string;
  to?: string;
}) {
  const where: {
    agentId?: string;
    status?: "IN_PROGRESS" | "COMPLETED" | "FAILED";
    createdAt?: { [Op.between]: [string, string] };
  } = {};

  if (agentId) {
    where.agentId = agentId;
  }

  if (status) {
    where.status = status;
  }

  if (from && to) {
    where.createdAt = { [Op.between]: [from, to] };
  }

  const taskInstances = await Task.findAll({
    attributes: ["id", "description", "status", "comment", "createdAt"],
    include: [
      {
        model: Agent,
        attributes: ["id", "name"],
        where: { teamId },
        required: true,
      },
    ],
    where,
    order: [["createdAt", "DESC"]],
  });

  const taskIds = taskInstances.map((task) => task.id);

  const usageRows = taskIds.length
    ? await LLMLog.findAll({
        attributes: [
          "taskId",
          [fn("SUM", col("duration_ms")), "durationMs"],
          [fn("SUM", col("input_tokens")), "inputTokens"],
          [fn("SUM", col("output_tokens")), "outputTokens"],
          [fn("SUM", col("total_tokens")), "totalTokens"],
        ],
        where: { taskId: { [Op.in]: taskIds } },
        group: ["task_id"],
        raw: true,
      })
    : [];

  const usageByTask = new Map(
    (
      usageRows as unknown as Array<{
        taskId: string;
        durationMs: number | null;
        inputTokens: number | null;
        outputTokens: number | null;
        totalTokens: number | null;
      }>
    ).map((row) => [row.taskId, row])
  );

  return taskInstances.map((task) => {
    const usage = usageByTask.get(task.id);
    return {
      ...task.toJSON(),
      durationMs: Number(usage?.durationMs ?? 0),
      inputTokens: Number(usage?.inputTokens ?? 0),
      outputTokens: Number(usage?.outputTokens ?? 0),
      totalTokens: Number(usage?.totalTokens ?? 0),
    };
  });
}

async function listWithEffectiveStatus({
  teamId,
  agentId,
  from,
  to,
}: {
  teamId: string;
  agentId?: string;
  from?: string;
  to?: string;
}) {
  const tasks = await list({ teamId, agentId, from, to });
  const taskIds = tasks.map((task) => task.id);

  const awaitingSupervisings = taskIds.length
    ? await Supervising.findAll({
        where: { status: "IN_PROGRESS", taskId: { [Op.in]: taskIds } },
        attributes: ["taskId"],
      })
    : [];

  const awaitingTaskIds = new Set(
    awaitingSupervisings.map((supervising) => supervising.taskId)
  );

  return tasks.map((task) => ({
    ...task,
    effectiveStatus:
      task.status === "IN_PROGRESS" && awaitingTaskIds.has(task.id)
        ? "AWAITING"
        : task.status,
  }));
}

async function addStep({
  taskId,
  action,
  parameters,
  comment,
  knowledgeScore,
  resultScore,
  nodeId,
}: {
  taskId: string;
  action: string;
  parameters: object;
  comment: string;
  knowledgeScore?: number;
  resultScore?: number;
  nodeId?: string | null;
}) {
  const step = await Step.create({
    taskId,
    action,
    parameters,
    comment,
    knowledgeScore: knowledgeScore ?? null,
    nodeId: nodeId ?? null,
  });

  await event.publish("STEP_ADDED", {
    stepId: step.id,
    taskId,
    action,
    parameters,
    comment,
    resultScore,
  });

  return step.toJSON();
}

async function getStep({ stepId }: { stepId: string }) {
  const step = await Step.findOne({ where: { id: stepId } });
  if (!step) throw new Error(`Step not found: ${stepId}`);
  return step.toJSON();
}

async function updateStep({
  stepId,
  result,
  status,
}: {
  stepId: string;
  result: string;
  status:
    | "IN_PROGRESS"
    | "SUPERVISED_NEEDED"
    | "COMPLETED"
    | "FAILED"
    | "WAITING_FOR_USER"
    | "WAITING_FOR_APPROVAL";
}) {
  const { taskId, action, parameters } = await Step.findOne({
    where: { id: stepId },
  });
  const step = await Step.update(
    {
      result,
      status,
    },
    { where: { id: stepId } }
  );

  if (status !== "IN_PROGRESS") {
    await event.publish(`STEP_${status}`, {
      taskId,
      stepId,
      action,
      parameters,
      result,
    });
  }

  return step;
}

async function updateStepComment({
  taskId,
  stepId,
  comment,
}: {
  taskId: string;
  stepId: string;
  comment: string | null;
}) {
  await Step.update({ comment }, { where: { id: stepId, taskId } });
}

async function listSteps({ taskId }: { taskId: string }) {
  const steps = await Step.findAll({
    where: { taskId },
    order: [["createdAt", "ASC"]],
  });

  return steps
    .map((step) => step.toJSON())
    .map((step) => {
      const rest = { ...step };
      delete rest.knowledgeScore;
      return {
        ...rest,
        result: rest.result ? rest.result.toString() : null,
      };
    });
}

export default {
  create,
  get,
  count,
  update,
  waitFor,
  list,
  listWithAgents,
  listWithEffectiveStatus,
  getStep,
  addStep,
  updateStep,
  updateStepComment,
  listSteps,
};
