import session from "../functions/session";

async function run({
  parameters,
}: {
  parameters: {
    sessionId: string;
    colleagueId: string;
    answer: string;
  };
}) {
  const { sessionId, colleagueId, answer } = parameters;

  await session.addConversation({
    sessionId,
    colleagueId,
    role: "ASSISTANT",
    content: answer,
  });

  return answer;
}

export default { run };
