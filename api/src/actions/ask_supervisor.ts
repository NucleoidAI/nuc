import supervising from "../functions/supervising";

async function run({
  parameters,
}: {
  parameters: {
    sessionId: string;
    colleagueId: string;
    question: string;
  };
}) {
  const { sessionId, colleagueId, question } = parameters;

  return await supervising.create({
    sessionId,
    question,
    colleagueId,
  });
}

export default {
  run,
};
