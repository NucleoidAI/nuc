import Joi from "joi";
import agentFn from "../functions/agent";
import express from "express";

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
    })
  );

  const waiting = await pending(sessionId);

  if (!waiting) {
    return res.status(404).end();
  }

  const result = await agentFn.approve({ sessionId, decision, comment });

  return res.status(200).json(result);
});

export default router;
