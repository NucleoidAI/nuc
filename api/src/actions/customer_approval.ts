import session from "../functions/session";

async function run({
  parameters,
}: {
  parameters: {
    sessionId?: string;
    agentId: string;
    question: string;
  };
}) {
  const { sessionId, agentId, question } = parameters;

  if (sessionId) {
    await session.addConversation({
      sessionId,
      agentId,
      role: "ASSISTANT",
      content: question,
    });
  }

  return question;
}

export default { run };
