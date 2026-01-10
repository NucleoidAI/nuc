import supervising from "../functions/supervising";

async function run({
  parameters,
}: {
  parameters: {
    sessionId: string;
    colleagueId: string;
    question: string;
    responsibilityId?: string;
    taskId?: string;
  };
}) {
  const { sessionId, colleagueId, question, responsibilityId, taskId } =
    parameters;

  return await supervising.create({
    sessionId,
    question,
    colleagueId,
    responsibilityId,
    taskId,
  });
}

export default {
  run,
};
