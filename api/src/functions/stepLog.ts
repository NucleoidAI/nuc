import StepLog from "../models/StepLog";

async function create({
  taskId,
  stepId,
  parameters,
  output,
  status,
  hallucinationScore,
  superviseScore,
  knowledgeScore,
  resultScore,
}: {
  taskId: string;
  stepId?: string;
  parameters?: object;
  output?: string;
  status: "COMPLETED" | "FAILED" | "SUPERVISED";
  hallucinationScore?: number;
  superviseScore?: number;
  knowledgeScore?: number;
  resultScore?: number;
}) {
  const log = await StepLog.create({
    taskId,
    stepId: stepId ?? null,
    parameters: parameters ?? null,
    output: output ?? null,
    status,
    hallucinationScore: hallucinationScore ?? null,
    superviseScore: superviseScore ?? null,
    knowledgeScore: knowledgeScore ?? null,
    resultScore: resultScore ?? null,
  });

  return log.toJSON();
}

async function update({
  logId,
  superviseScore,
  resultScore,
}: {
  logId: string;
  superviseScore?: number;
  resultScore?: number;
}) {
  await StepLog.update(
    { superviseScore, resultScore },
    { where: { id: logId } },
  );
}

async function list({ taskId }: { taskId: string }) {
  const logs = await StepLog.findAll({ where: { taskId } });
  return logs.map((log) => log.toJSON());
}

async function listByStep({ stepId }: { stepId: string }) {
  const logs = await StepLog.findAll({ where: { stepId } });
  return logs.map((log) => log.toJSON());
}

export default { create, update, list, listByStep };
