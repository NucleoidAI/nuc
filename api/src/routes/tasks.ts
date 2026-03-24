import Agent from "../models/Agent";
import Joi from "joi";
import Task from "../models/Task";
import express from "express";
import knowledge from "../functions/knowledge";
import task from "../functions/task";

const router = express.Router();

router.post("/", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { agentId, description, sessionId, blueprintId } = Joi.attempt(
    req.body,
    Joi.object({
      agentId: Joi.string()
        .guid({ version: ["uuidv4"] })
        .required(),
      description: Joi.string().required(),
      sessionId: Joi.string()
        .guid({ version: ["uuidv4"] })
        .optional(),
      blueprintId: Joi.string()
        .guid({ version: ["uuidv4"] })
        .optional(),
    }),
  );

  const agent = await Agent.findByPk(agentId);

  if (!agent) {
    return res.status(404).end();
  }

  if (agent.teamId !== teamId) {
    return res.status(401).end();
  }

  const taskInstance = await task.create({
    agentId,
    description,
    sessionId,
    blueprintId,
  });

  return res.status(200).json(taskInstance);
});

router.get("/", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { agentId } = Joi.attempt(
    req.query,
    Joi.object({
      agentId: Joi.string()
        .guid({ version: ["uuidv4"] })
        .required(),
    }),
  );

  const tasks = await task.list({ agentId, teamId });

  return res.status(200).json(tasks);
});

router.get("/:taskId", async (req, res) => {
  const teamId = req.session.projectId;
  const { taskId } = req.params;

  const task = await Task.findOne({
    where: { id: taskId },
    include: [
      {
        model: Agent,
        attributes: ["teamId"],
        required: true,
      },
    ],
  });

  if (!task) {
    return res.status(404);
  }

  if (task.Agent.teamId !== teamId) {
    return res.status(401);
  }

  return res.status(200).json(task);
});

router.get("/:taskId/steps", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { taskId } = req.params;

  const taskInstance = await Task.findOne({
    where: { id: taskId },
    include: [
      {
        model: Agent,
        attributes: ["teamId"],
        required: true,
      },
    ],
  });

  if (!taskInstance) {
    return res.status(404);
  }

  if (taskInstance.Agent.teamId !== teamId) {
    return res.status(401);
  }

  const steps = await task.listSteps({ taskId });

  return res.status(200).json(steps);
});

router.post("/:taskId/supervising", async (req, res) => {
  const { taskId } = req.params;
  const { text, addToKnowledgeBase, agentId } = Joi.attempt(
    req.body,
    Joi.object({
      text: Joi.string().required(),
      agentId: Joi.string()
        .guid({ version: ["uuidv4"] })
        .required(),
      addToKnowledgeBase: Joi.boolean().required(),
    }),
  );

  await task.addStep({
    taskId,
    action: "SUPERVISED",
    comment: "Supervising: " + text,
    parameters: {
      message: text,
    },
  });

  if (addToKnowledgeBase) {
    await knowledge.create({
      agentId,
      knowledge: {
        type: "TASK",
        taskId,
      },
    });
  }

  return res.status(201).end();
});

export default router;
