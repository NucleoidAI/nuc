import Agent from "../models/Agent";
import Joi from "joi";
import express from "express";
import llmLog from "../functions/llmLog";

const router = express.Router();

router.get("/", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { agentId, from, to } = Joi.attempt(
    req.query,
    Joi.object({
      agentId: Joi.string().uuid().optional(),
      from: Joi.string().isoDate().optional(),
      to: Joi.string().isoDate().optional(),
    })
  );

  if (!agentId) {
    const usage = await llmLog.listByTeam({ teamId, from, to });
    return res.status(200).json(usage);
  }

  const agent = await Agent.findByPk(agentId);

  if (!agent) {
    return res.status(404).end();
  }

  if (agent.teamId !== teamId) {
    return res.status(401).end();
  }

  const usage = await llmLog.listByAgent({ agentId });

  return res.status(200).json(usage);
});

export default router;
