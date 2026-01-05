import supervising from "../functions/supervising";

async function run({
  parameters,
}: {
  parameters: {
    sessionId: string;
    colleagueId: string;
    question: string;
    responsibilityId?: string;
  };
}) {
  const { sessionId, colleagueId, question, responsibilityId } = parameters;

  return await supervising.create({
    sessionId,
    question,
    colleagueId,
    type: "RESPONSIBILITY",
    responsibilityId,
  });
}

export default {
  run,
};
