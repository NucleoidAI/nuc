import session from "../functions/session";

async function run({
  parameters,
}: {
  parameters: {
    sessionId: string;
    agentId: string;
    message: string;
  };
}) {
  const { sessionId, agentId, message } = parameters;

  await session.addConversation({
    sessionId,
    agentId,
    role: "ASSISTANT",
    content: message,
  });

  return message;
}

export default { run };
