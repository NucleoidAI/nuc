import Joi from "joi";
import actions from "../actions";
import agentFn from "../functions/agent";
import express from "express";
import sessionFn from "../functions/session";

type ApprovalTarget = { sessionId: string } | { taskId: string };

const router = express.Router();

function isAuthorized(req: express.Request) {
  const token = process.env.TEST_TOKEN;

  if (!token) {
    return false;
  }

  const header = req.headers["x-test-token"];

  return header === token;
}

function approvalRoutes(targetOf: (id: string) => ApprovalTarget) {
  const approvals = express.Router();

  approvals.get("/:id/approval", async (req, res) => {
    if (!isAuthorized(req)) {
      return res.status(401).end();
    }

    const waiting = await agentFn.waitingApproval(targetOf(req.params.id));

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

  approvals.post("/:id/approval", async (req, res) => {
    if (!isAuthorized(req)) {
      return res.status(401).end();
    }

    const target = targetOf(req.params.id);

    const { decision, comment } = Joi.attempt(
      req.body,
      Joi.object({
        decision: Joi.string().valid("APPROVED", "REJECTED").required(),
        comment: Joi.string().optional(),
      })
    );

    const waiting = await agentFn.waitingApproval(target);

    if (!waiting) {
      return res.status(404).end();
    }

    if (actions.isExternalApproval(waiting.step.action)) {
      return res.status(409).json({ error: "Use the verification endpoint" });
    }

    if ("sessionId" in target) {
      await sessionFn.logConversation({
        sessionId: target.sessionId,
        role: "USER",
        content: JSON.stringify({ decision, ...(comment && { comment }) }),
      });
    }

    const result = await agentFn.approve({ ...target, decision, comment });

    return res.status(200).json(result);
  });

  return approvals;
}

router.use(approvalRoutes((sessionId) => ({ sessionId })));

const taskApprovals = approvalRoutes((taskId) => ({ taskId }));

export { taskApprovals };
export default router;
