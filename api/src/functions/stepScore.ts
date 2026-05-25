import StepScore from "../models/StepScore";

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
  const score = await StepScore.create({
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

  return score.toJSON();
}

async function update({
  scoreId,
  superviseScore,
  resultScore,
}: {
  scoreId: string;
  superviseScore?: number;
  resultScore?: number;
}) {
  await StepScore.update(
    { superviseScore, resultScore },
    { where: { id: scoreId } },
  );
}

async function list({ taskId }: { taskId: string }) {
  const scores = await StepScore.findAll({ where: { taskId } });
  return scores.map((score) => score.toJSON());
}

async function listByStep({ stepId }: { stepId: string }) {
  const scores = await StepScore.findAll({ where: { stepId } });
  return scores.map((score) => score.toJSON());
}

async function removeSuperviseScore({ scoreId }: { scoreId: string }) {
  await StepScore.update({ superviseScore: null }, { where: { id: scoreId } });
}

export default { create, update, list, listByStep, removeSuperviseScore };
