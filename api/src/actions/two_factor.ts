import Agent from "../models/Agent";
import TwoFactorChallenge from "../models/TwoFactorChallenge";
import task from "../functions/task";
import session from "../functions/session";
import mcp from "../lib/mcp";
import { createToken, hashToken, approvalLinks } from "../lib/twoFactorToken";

async function run({
  parameters,
  meta,
}: {
  parameters: { channel: string; recipient: string; question: string };
  meta: { taskId: string; stepId: string };
}) {
  const { channel, recipient, question } = parameters;
  if (!["email", "whatsapp"].includes(channel))
    throw new Error("Invalid 2FA channel");
  if (!recipient?.trim() || !question?.trim())
    throw new Error("2FA requires recipient and question");
  const currentTask = await task.get({ taskId: meta.taskId });
  if (!currentTask.sessionId) throw new Error("2FA requires a session");

  if (channel === "email") {
    if (!/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(recipient))
      throw new Error("Invalid 2FA email recipient");
    const token = createToken();
    const links = approvalLinks(
      process.env.TWO_FACTOR_PUBLIC_URL,
      currentTask.sessionId,
      meta.stepId,
      token,
    );
    const agent = await Agent.findByPk(currentTask.agentId);
    const client = await mcp.connect({
      name: "grey",
      teamId: agent?.teamId,
      agentId: currentTask.agentId,
    });
    try {
      await TwoFactorChallenge.upsert({
        stepId: meta.stepId,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        consumed: false,
      });
      const result = await client.callTool("GREY:send_email", {
        to: recipient,
        subject: "Approval required",
        text: `${question}\n\nApprove: ${links.approve}\n\nReject: ${links.reject}\n\nThese links expire in 10 minutes.`,
      });
      if (result.isError) throw new Error("2FA email delivery failed");
    } finally {
      await client.close();
    }
  }
  await session.addConversation({
    sessionId: currentTask.sessionId,
    agentId: currentTask.agentId,
    role: "ASSISTANT",
    content:
      channel === "email"
        ? `${question} Use the Approve or Reject link sent to your email.`
        : `${question} Waiting for ${channel} verification.`,
  });
  return { channel, recipient, question, status: "WAITING_FOR_APPROVAL" };
}
export default { run };
