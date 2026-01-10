import session from "../functions/session";

async function run({
  parameters,
}: {
  parameters: {
    sessionId: string;
    colleagueId: string;
    answer: string;
    question: string;
  };
}) {
  const { sessionId, colleagueId, answer, question } = parameters;

  await session.addConversation({
    sessionId,
    colleagueId,
    role: "ASSISTANT",
    content: answer || question,
  });

  return answer || question;
}

export default { run };
