import task from "../functions/task";
import session from "../functions/session";

async function run({
  parameters,
  meta,
}: {
  parameters: { channel: string; recipient: string; question: string };
  meta: { taskId: string; stepId: string };
}) {
  const { channel, recipient, question } = parameters;
  if (channel !== "whatsapp") throw new Error("Invalid 2FA channel");
  if (!recipient?.trim() || !question?.trim())
    throw new Error("2FA requires recipient and question");
  const currentTask = await task.get({ taskId: meta.taskId });
  if (!currentTask.sessionId) throw new Error("2FA requires a session");

  await session.addConversation({
    sessionId: currentTask.sessionId,
    agentId: currentTask.agentId,
    role: "ASSISTANT",
    content: `${question} Waiting for ${channel} verification.`,
  });
  return { channel, recipient, question, status: "WAITING_FOR_APPROVAL" };
}
export default { run };
