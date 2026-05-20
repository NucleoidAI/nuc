import Agent from "../models/Agent";
import Joi from "joi";
import Step from "../models/Step";
import Task from "../models/Task";
import StepLog from "../models/StepLog";
import express from "express";
import stepLog from "../functions/stepLog";
import schemas from "../schemas";

const router = express.Router();

router.get("/", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { taskId, stepId } = Joi.attempt(req.query, schemas.StepLog.list);

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

    const logs = await stepLog.list({ taskId });
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

  const logs = await stepLog.listByStep({ stepId });
  return res.status(200).json(logs);
});

router.patch("/:logId", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { logId } = req.params;
  const { superviseScore, resultScore } = Joi.attempt(
    req.body,
    schemas.StepLog.patch,
  );

  const log = await StepLog.findOne({
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

  await stepLog.update({ logId, superviseScore, resultScore });

  return res.status(200).end();
});

export default router;
