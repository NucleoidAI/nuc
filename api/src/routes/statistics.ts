import Joi from "joi";
import Statistics from "../models/Statistics";
import express from "express";
import platform from "@canmingir/link-express";
import statisticsFn from "../functions/statistics";
import { v4 as uuid } from "uuid";
const router = express.Router();

router.get("/", async (req, res) => {
  const { projectId: teamId } = req.session;

  if (!teamId) {
    return res.status(400);
  }

  let statistics = await Statistics.findOne({ where: { teamId } });

  if (!statistics) {
    const defaultStatistics = {
      id: uuid(),
      responseRate: 0,
      supervisingRate: 0,
      knowledgeSize: 0,
      taskCount: 0,
      totalMessages: 0,
      teamId: teamId,
    };

    await Statistics.create(defaultStatistics);

    statistics = await Statistics.findOne({ where: { teamId } });
  }

  res.status(200).json(statistics);
});

const rangeSchema = Joi.object({
  agentId: Joi.string()
    .guid({ version: ["uuidv4"] })
    .optional(),
  from: Joi.string().isoDate().required(),
  to: Joi.string().isoDate().required(),
});

router.get("/tasks/daily", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { agentId, from, to } = Joi.attempt(req.query, rangeSchema);

  const trend = await statisticsFn.taskDailyTrend({
    teamId,
    agentId,
    from,
    to,
  });

  return res.status(200).json(trend);
});

router.get("/supervisings/daily", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { agentId, from, to } = Joi.attempt(req.query, rangeSchema);

  const trend = await statisticsFn.supervisingDailyRate({
    teamId,
    agentId,
    from,
    to,
  });

  return res.status(200).json(trend);
});

router.get("/tasks/agents", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { from, to } = Joi.attempt(
    req.query,
    Joi.object({
      from: Joi.string().isoDate().required(),
      to: Joi.string().isoDate().required(),
    })
  );

  const distribution = await statisticsFn.taskByAgent({ teamId, from, to });

  return res.status(200).json(distribution);
});

export default router;
