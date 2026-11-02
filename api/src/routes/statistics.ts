import Joi from "joi";
import Statistics from "../models/Statistics";
import express from "express";
import platform from "@canmingir/link-express";
import schemas from "../schemas";
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

router.get("/tasks/daily", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { agentId, from, to } = Joi.attempt(
    req.query,
    schemas.Statistics.range
  );

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
  const { agentId, from, to } = Joi.attempt(
    req.query,
    schemas.Statistics.range
  );

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
  const { from, to } = Joi.attempt(req.query, schemas.Statistics.period);

  const distribution = await statisticsFn.taskByAgent({ teamId, from, to });

  return res.status(200).json(distribution);
});

router.get("/tasks/count", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { agentId, from, to } = Joi.attempt(
    req.query,
    schemas.Statistics.range
  );

  const count = await statisticsFn.taskCount({ teamId, agentId, from, to });

  return res.status(200).json({ count });
});

router.get("/tasks/status", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { agentId, from, to } = Joi.attempt(
    req.query,
    schemas.Statistics.range
  );

  const counts = await statisticsFn.taskStatusCounts({
    teamId,
    agentId,
    from,
    to,
  });

  return res.status(200).json(counts);
});

router.get("/supervisings/count", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { agentId, status, from, to } = Joi.attempt(
    req.query,
    schemas.Statistics.supervisingCount
  );

  const count = await statisticsFn.supervisingCount({
    teamId,
    agentId,
    status,
    from,
    to,
  });

  return res.status(200).json({ count });
});

router.get("/tokens", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { agentId, from, to } = Joi.attempt(
    req.query,
    schemas.Statistics.range
  );

  const usage = await statisticsFn.tokenUsage({ teamId, agentId, from, to });

  return res.status(200).json(usage);
});

router.get("/agents", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { from, to } = Joi.attempt(req.query, schemas.Statistics.period);

  const overview = await statisticsFn.agentOverview({ teamId, from, to });

  return res.status(200).json(overview);
});

export default router;
