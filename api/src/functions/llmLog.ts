import Agent from "../models/Agent";
import LLMLog from "../models/LLMLog";
import ModelPricing from "../models/ModelPricing";
import Task from "../models/Task";
import { Op } from "sequelize";

const LOG_ATTRIBUTES = [
  "id",
  "provider",
  "model",
  "source",
  "inputTokens",
  "outputTokens",
  "totalTokens",
  "cost",
  "durationMs",
  "taskId",
  "createdAt",
];

type CostSource = "provider" | "pricing" | null;

function resolveCost(
  log: LLMLog,
  pricingMap: Map<string, ModelPricing>
): { cost: number | null; costSource: CostSource } {
  if (log.cost != null) {
    return { cost: log.cost, costSource: "provider" };
  }

  const pricing = pricingMap.get(`${log.provider}:${log.model}`);

  if (!pricing || (log.inputTokens == null && log.outputTokens == null)) {
    return { cost: null, costSource: null };
  }

  const cost =
    ((log.inputTokens ?? 0) / 1_000_000) * pricing.inputPricePerMillion +
    ((log.outputTokens ?? 0) / 1_000_000) * pricing.outputPricePerMillion;

  return { cost, costSource: "pricing" };
}

async function buildUsage(tasks: Task[]) {
  const taskIds = tasks.map((task) => task.id);

  const [logs, pricings] = await Promise.all([
    taskIds.length
      ? LLMLog.findAll({
          where: { taskId: { [Op.in]: taskIds } },
          attributes: LOG_ATTRIBUTES,
          order: [["createdAt", "ASC"]],
        })
      : Promise.resolve([] as LLMLog[]),
    ModelPricing.findAll(),
  ]);

  const pricingMap = new Map(
    pricings.map((pricing) => [`${pricing.provider}:${pricing.model}`, pricing])
  );

  const logsByTask = new Map<string, LLMLog[]>();
  for (const log of logs) {
    const list = logsByTask.get(log.taskId as string) ?? [];
    list.push(log);
    logsByTask.set(log.taskId as string, list);
  }

  return tasks.map((task) => {
    const taskLogs = (logsByTask.get(task.id) ?? []).map((log) => {
      const { cost, costSource } = resolveCost(log, pricingMap);
      return { ...log.toJSON(), cost, costSource };
    });

    const totals = taskLogs.reduce(
      (acc, log) => ({
        inputTokens: acc.inputTokens + (log.inputTokens ?? 0),
        outputTokens: acc.outputTokens + (log.outputTokens ?? 0),
        totalTokens: acc.totalTokens + (log.totalTokens ?? 0),
        cost: acc.cost + (log.cost ?? 0),
        calls: acc.calls + 1,
      }),
      {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        cost: 0,
        calls: 0,
      }
    );

    return {
      task: task.toJSON(),
      totals,
      logs: taskLogs,
    };
  });
}

async function listByAgent({
  agentId,
  taskLimit = 50,
}: {
  agentId: string;
  taskLimit?: number;
}) {
  const tasks = await Task.findAll({
    where: { agentId },
    attributes: ["id", "description", "status", "comment", "createdAt"],
    order: [["createdAt", "DESC"]],
    limit: taskLimit,
  });

  return buildUsage(tasks);
}

async function listByTeam({
  teamId,
  taskLimit = 200,
  from,
  to,
}: {
  teamId: string;
  taskLimit?: number;
  from?: string;
  to?: string;
}) {
  const tasks = await Task.findAll({
    where: from && to ? { createdAt: { [Op.between]: [from, to] } } : {},
    attributes: [
      "id",
      "description",
      "status",
      "comment",
      "createdAt",
      "agentId",
    ],
    include: [
      {
        model: Agent,
        attributes: ["id", "name"],
        where: { teamId },
        required: true,
      },
    ],
    order: [["createdAt", "DESC"]],
    limit: taskLimit,
  });

  return buildUsage(tasks);
}

export default { listByAgent, listByTeam };
