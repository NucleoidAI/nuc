import supervising from "../functions/supervising";

async function run({
  parameters,
}: {
  parameters: {
    sessionId: string;
    agentId: string;
    question: string;
    blueprintId?: string;
    taskId?: string;
  };
}) {
  const { sessionId, agentId, question, blueprintId, taskId } = parameters;

  return await supervising.create({
    sessionId,
    question,
    agentId,
    blueprintId,
    taskId,
  });
}

export default {
  run,
};
