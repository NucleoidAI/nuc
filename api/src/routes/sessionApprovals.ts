import Step from "../models/Step";
import Task from "../models/Task";
import { completeTwoFactor } from "../functions/twoFactor";
import Joi from "joi";
import agentFn from "../functions/agent";
import express from "express";
import schemas from "../schemas";
import sessionFn from "../functions/session";

const router = express.Router();

function isAuthorized(req: express.Request) {
  const token = process.env.TEST_TOKEN;

  if (!token) {
    return false;
  }

  const header = req.headers["x-test-token"];

  return header === token;
}

async function pending(sessionId: string) {
  try {
    return await agentFn.waitingApproval({ sessionId });
  } catch (error) {
    return null;
  }
}

router.get("/two-factor/pending", async (req, res) => {
  if (!isAuthorized(req)) return res.status(401).end();
  res.set("Cache-Control", "no-store");
  const steps = await Step.findAll({
    where: { action: "PLATFORM:two_factor", status: "WAITING_FOR_APPROVAL" },
    order: [["createdAt", "ASC"]],
  });
  const requests = [];
  for (const step of steps) {
    const result = JSON.parse(step.result?.toString() || "{}");
    if (result.channel !== "whatsapp") continue;
    const task = await Task.findByPk(step.taskId);
    if (!task?.sessionId || task.status !== "IN_PROGRESS") continue;
    requests.push({
      sessionId: task.sessionId,
      taskId: task.id,
      stepId: step.id,
      channel: result.channel,
      recipient: result.recipient,
      question: result.question,
      status: step.status,
      createdAt: step.createdAt,
    });
  }
  return res.json({ requests });
});

router.get("/:sessionId/approval", async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(401).end();
  }

  const { sessionId } = req.params;

  const waiting = await pending(sessionId);

  if (!waiting) {
    return res.status(404).end();
  }

  return res.status(200).json({
    taskId: waiting.taskId,
    stepId: waiting.step.id,
    question: waiting.step.parameters?.question ?? null,
    status: waiting.step.status,
  });
});

router.post("/:sessionId/approval", async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(401).end();
  }

  const { sessionId } = req.params;

  const { decision, comment } = Joi.attempt(
    req.body,
    Joi.object({
      decision: Joi.string().valid("APPROVED", "REJECTED").required(),
      comment: Joi.string().optional(),
    }),
  );

  const waiting = await pending(sessionId);

  if (!waiting) {
    return res.status(404).end();
  }

  if (waiting.step.action === "PLATFORM:two_factor") {
    return res.status(409).json({ error: "Use the 2FA verification endpoint" });
  }

  await sessionFn.logConversation({
    sessionId,
    role: "USER",
    content: JSON.stringify({ decision, ...(comment && { comment }) }),
  });

  const result = await agentFn.approve({ sessionId, decision, comment });

  return res.status(200).json(result);
});

router.get("/:sessionId/two-factor", async (req, res) => {
  if (!isAuthorized(req)) return res.status(401).end();
  const waiting = await pending(req.params.sessionId);
  if (waiting?.step.action !== "PLATFORM:two_factor")
    return res.status(404).end();
  const result = JSON.parse(waiting.step.result);
  return res.json({
    taskId: waiting.taskId,
    stepId: waiting.step.id,
    channel: result.channel,
    recipient: result.recipient,
    question: result.question,
    status: waiting.step.status,
  });
});

router.post("/:sessionId/two-factor", async (req, res) => {
  if (!isAuthorized(req)) return res.status(401).end();
  const { error, value } = Joi.object({
    stepId: Joi.string()
      .guid({ version: ["uuidv4"] })
      .required(),
    decision: Joi.string()
      .valid("APPROVED", "REJECTED", "approved", "declined")
      .required(),
  }).validate(req.body);
  if (error) return res.status(400).json({ error: error.message });
  const waiting = await pending(req.params.sessionId);
  if (
    waiting?.step.action !== "PLATFORM:two_factor" ||
    waiting.step.id !== value.stepId
  )
    return res.status(404).end();
  try {
    if (JSON.parse(waiting.step.result).channel === "email")
      return res.status(409).json({ error: "Use the email approval link" });
    const decision = ["APPROVED", "approved"].includes(value.decision)
      ? "APPROVED"
      : "REJECTED";
    return res.json(await completeTwoFactor(waiting, decision));
  } catch (error) {
    return res.status(400).json({
      error: error instanceof Error ? error.message : "Verification failed",
    });
  }
});

router.all("/:sessionId/two-factor/email", (req, res, next) => {
  res.set({
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
    "Content-Security-Policy":
      "default-src 'none'; form-action 'self'; frame-ancestors 'none'",
  });
  next();
});

router.get("/:sessionId/two-factor/email", (req, res) => {
  const { error, value } = schemas.Session.emailDecision.validate(req.query);
  if (error) return res.status(400).send("Invalid approval link.");
  const label = value.decision === "APPROVED" ? "Approve" : "Reject";
  return res
    .type("html")
    .send(
      `<!doctype html><html lang="en"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${label} request</title><body><h1>${label} request</h1><p>Confirm your decision to complete the email verification.</p><form method="post"><input type="hidden" name="stepId" value="${value.stepId}"><input type="hidden" name="token" value="${value.token}"><input type="hidden" name="decision" value="${value.decision}"><button type="submit">${label}</button></form></body></html>`,
    );
});

router.post(
  "/:sessionId/two-factor/email",
  express.urlencoded({ extended: false }),
  async (req, res) => {
    const { error, value } = schemas.Session.emailDecision.validate(req.body);
    if (error) return res.status(400).send("Invalid approval link.");
    const waiting = await pending(req.params.sessionId);
    if (
      waiting?.step.action !== "PLATFORM:two_factor" ||
      waiting.step.id !== value.stepId ||
      JSON.parse(waiting.step.result).channel !== "email"
    )
      return res
        .status(404)
        .send("This approval request is no longer pending.");
    try {
      await completeTwoFactor(waiting, value.decision, value.token);
      return res.send(
        value.decision === "APPROVED"
          ? "Approved. You can return to your conversation."
          : "Rejected. The workflow has stopped.",
      );
    } catch {
      return res
        .status(400)
        .send("This approval link is invalid, expired, or already used.");
    }
  },
);

export default router;
