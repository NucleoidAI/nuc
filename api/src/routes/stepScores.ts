import Agent from "../models/Agent";
import Joi from "joi";
import Step from "../models/Step";
import StepScore from "../models/StepScore";
import Task from "../models/Task";
import express from "express";
import schemas from "../schemas";
import stepScore from "../functions/stepScore";

const router = express.Router();

router.get("/", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { taskId, stepId } = Joi.attempt(req.query, schemas.StepScore.list);

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

    const scores = await stepScore.list({ taskId });
    return res.status(200).json(scores);
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

  const scores = await stepScore.listByStep({ stepId });
  return res.status(200).json(scores);
});

router.patch("/:scoreId", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { scoreId } = req.params;
  const { superviseScore, resultScore } = Joi.attempt(
    req.body,
    schemas.StepScore.patch,
  );

  const score = await StepScore.findOne({
    where: { id: scoreId },
    include: [
      {
        model: Task,
        as: "task",
        include: [{ model: Agent, attributes: ["teamId"], required: true }],
        required: true,
      },
    ],
  });

  if (!score) {
    return res.status(404).end();
  }

  if (score.task.Agent.teamId !== teamId) {
    return res.status(401).end();
  }

  await stepScore.update({ scoreId, superviseScore, resultScore });

  return res.status(200).end();
});

router.delete("/:scoreId/supervise-score", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { scoreId } = req.params;

  const score = await StepScore.findOne({
    where: { id: scoreId },
    include: [
      {
        model: Task,
        as: "task",
        include: [{ model: Agent, attributes: ["teamId"], required: true }],
        required: true,
      },
    ],
  });

  if (!score) {
    return res.status(404).end();
  }

  if (score.task.Agent.teamId !== teamId) {
    return res.status(401).end();
  }

  await stepScore.removeSuperviseScore({ scoreId });

  return res.status(200).end();
});

export default router;
