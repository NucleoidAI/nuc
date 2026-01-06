import session from "../functions/session";

async function run({
  parameters,
}: {
  parameters: {
    sessionId: string;
    agentId: string;
    answer: string;
  };
}) {
  const { sessionId, agentId, answer } = parameters;

  await session.addConversation({
    sessionId,
    agentId,
    role: "ASSISTANT",
    content: answer,
  });

  return answer;
}

export default { run };
