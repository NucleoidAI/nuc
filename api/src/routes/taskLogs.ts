import Agent from "../models/Agent";
import Joi from "joi";
import Step from "../models/Step";
import Task from "../models/Task";
import TaskLog from "../models/TaskLog";
import express from "express";
import taskLog from "../functions/taskLog";

const router = express.Router();

router.get("/", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { taskId, stepId } = Joi.attempt(
    req.query,
    Joi.object({
      taskId: Joi.string().guid({ version: ["uuidv4"] }).optional(),
      stepId: Joi.string().guid({ version: ["uuidv4"] }).optional(),
    }).or("taskId", "stepId"),
  );

  if (taskId) {
    const taskInstance = await Task.findOne({
      where: { id: taskId },
      include: [{ model: Agent, attributes: ["teamId"], required: true }],
    });

    if (!taskInstance) {
      return res.status(404).end();
    }

    if (taskInstance.Agent.teamId !== teamId) {
      return res.status(401).end();
    }

    const logs = await taskLog.list({ taskId });
    return res.status(200).json(logs);
  }

  const stepInstance = await Step.findOne({
    where: { id: stepId },
    include: [
      {
        model: Task,
        as: "task",
        include: [{ model: Agent, attributes: ["teamId"], required: true }],
        required: true,
      },
    ],
  });

  if (!stepInstance) {
    return res.status(404).end();
  }

  if (stepInstance.task.Agent.teamId !== teamId) {
    return res.status(401).end();
  }

  const logs = await taskLog.listByStep({ stepId });
  return res.status(200).json(logs);
});

router.patch("/:logId", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { logId } = req.params;
  const { superviseScore, reviewScore } = Joi.attempt(
    req.body,
    Joi.object({
      superviseScore: Joi.number().min(0).max(1).optional(),
      reviewScore: Joi.number().min(0).max(1).optional(),
    }).or("superviseScore", "reviewScore"),
  );

  const log = await TaskLog.findOne({
    where: { id: logId },
    include: [
      {
        model: Task,
        as: "task",
        include: [{ model: Agent, attributes: ["teamId"], required: true }],
        required: true,
      },
    ],
  });

  if (!log) {
    return res.status(404).end();
  }

  if (log.task.Agent.teamId !== teamId) {
    return res.status(401).end();
  }

  await taskLog.update({ logId, superviseScore, reviewScore });

  return res.status(200).end();
});

export default router;
