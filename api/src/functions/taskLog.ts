import TaskLog from "../models/TaskLog";

async function create({
  taskId,
  stepId,
  parameters,
  output,
  status,
  hallucinationScore,
  superviseScore,
}: {
  taskId: string;
  stepId?: string;
  parameters?: object;
  output?: string;
  status: "COMPLETED" | "FAILED" | "SUPERVISED";
  hallucinationScore?: number;
  superviseScore?: number;
}) {
  const log = await TaskLog.create({
    taskId,
    stepId: stepId ?? null,
    parameters: parameters ?? null,
    output: output ?? null,
    status,
    hallucinationScore: hallucinationScore ?? null,
    superviseScore: superviseScore ?? null,
  });

  return log.toJSON();
}

async function update({
  logId,
  superviseScore,
  reviewScore,
}: {
  logId: string;
  superviseScore?: number;
  reviewScore?: number;
}) {
  await TaskLog.update({ superviseScore, reviewScore }, { where: { id: logId } });
}

async function list({ taskId }: { taskId: string }) {
  const logs = await TaskLog.findAll({ where: { taskId } });
  return logs.map((log) => log.toJSON());
}

async function listByStep({ stepId }: { stepId: string }) {
  const logs = await TaskLog.findAll({ where: { stepId } });
  return logs.map((log) => log.toJSON());
}

export default { create, update, list, listByStep };
