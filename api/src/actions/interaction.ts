import session from "../functions/session";

async function run({
  parameters,
}: {
  parameters: {
    sessionId?: string;
    agentId: string;
    answer: string;
    question: string;
  };
}) {
  const { sessionId, agentId, answer, question } = parameters;

  if (sessionId) {
    await session.addConversation({
      sessionId,
      agentId,
      role: "ASSISTANT",
      content: answer || question,
    });
  }

  return answer || question;
}

export default { run };
