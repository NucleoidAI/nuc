import session from "../functions/session";

async function run({
  parameters,
}: {
  parameters: {
    sessionId: string;
    colleagueId: string;
    message: string;
  };
}) {
  const { sessionId, colleagueId, message } = parameters;

  await session.addConversation({
    sessionId,
    colleagueId,
    role: "ASSISTANT",
    content: message,
  });

  return message;
}

export default { run };
