import TwoFactorChallenge from "../models/TwoFactorChallenge";
import { matchesToken } from "../lib/twoFactorToken";
import Step from "../models/Step";
import task from "./task";

export async function completeTwoFactor(
  waiting: any,
  decision: "APPROVED" | "REJECTED",
  token?: string,
) {
  if (waiting.step.action !== "PLATFORM:two_factor")
    throw new Error("No pending 2FA request");
  const { channel } = JSON.parse(waiting.step.result);
  if (channel === "email") {
    const challenge = await TwoFactorChallenge.findByPk(waiting.step.id);
    if (
      !challenge ||
      challenge.consumed ||
      new Date(challenge.expiresAt).getTime() <= Date.now()
    ) {
      throw new Error("Verification expired or unavailable");
    }
    if (!matchesToken(token ?? "", challenge.tokenHash))
      throw new Error("Invalid verification link");
    const [updated] = await TwoFactorChallenge.update(
      { consumed: true },
      {
        where: { stepId: waiting.step.id, consumed: false },
      },
    );
    if (!updated) throw new Error("Verification link already used");
  } else if (channel !== "whatsapp") {
    throw new Error("Invalid verification channel");
  }
  const [claimed] = await Step.update(
    { status: "IN_PROGRESS" },
    {
      where: { id: waiting.step.id, status: "WAITING_FOR_APPROVAL" },
    },
  );
  if (!claimed) throw new Error("Verification already completed");
  if (decision === "REJECTED") {
    await task.update({
      taskId: waiting.taskId,
      status: "FAILED",
      comment: "2FA verification rejected",
    });
    await task.updateStep({
      stepId: waiting.step.id,
      result: decision,
      status: "FAILED",
    });
  } else {
    await task.updateStep({
      stepId: waiting.step.id,
      result: decision,
      status: "COMPLETED",
    });
  }
  return { taskId: waiting.taskId, stepId: waiting.step.id, decision };
}
