import Agent from "../models/Agent";
import Joi from "joi";
import Task from "../models/Task";
import apiSchema from "../lib/apiSchema";
import blueprintFn from "../functions/blueprint";
import express from "express";
import { jsonRequestOf, startNodeOf } from "../lib/apiNodes";
import schemas from "../schemas";
import task from "../functions/task";

const router = express.Router();

async function blueprintTaskDescription({
  blueprint,
  debug,
}: {
  blueprint: { id: string; title: string };
  debug: boolean;
}) {
  const count = await task.count({ blueprintId: blueprint.id, debug });

  return `${blueprint.title} #${count + 1}`;
}

router.post("/", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { agentId, description, sessionId, blueprintId, variables, debug } =
    Joi.attempt(
      req.body,
      Joi.object({
        agentId: Joi.string()
          .guid({ version: ["uuidv4"] })
          .required(),
        description: Joi.string().when("blueprintId", {
          is: Joi.exist(),
          then: Joi.optional(),
          otherwise: Joi.required(),
        }),
        sessionId: Joi.string()
          .guid({ version: ["uuidv4"] })
          .optional(),
        blueprintId: Joi.string()
          .guid({ version: ["uuidv4"] })
          .optional(),
        variables: Joi.object().optional(),
        debug: Joi.boolean().optional(),
      })
    );

  const agent = await Agent.findByPk(agentId);

  if (!agent) {
    return res.status(404).end();
  }

  if (agent.teamId !== teamId) {
    return res.status(401).end();
  }

  const blueprint = blueprintId
    ? await blueprintFn.get({ blueprintId, includeDetails: false })
    : null;

  const request = sessionId ? undefined : jsonRequestOf(blueprint, variables);

  if (request) {
    const start = startNodeOf(blueprint.nodes);
    const input = apiSchema.validate(
      start.properties?.fields ?? [],
      request.body,
      { strict: Boolean(start.properties?.strict) }
    );

    if (!input.success) {
      return res
        .status(400)
        .json({ error: "INVALID_REQUEST", issues: input.issues });
    }
  }

  const taskInstance = await task.create({
    agentId,
    description:
      description ??
      (await blueprintTaskDescription({ blueprint, debug: Boolean(debug) })),
    sessionId,
    blueprintId,
    variables,
    request,
    debug,
  });

  return res.status(200).json(taskInstance);
});

router.get("/", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { agentId, from, to } = Joi.attempt(
    req.query,
    Joi.object({
      agentId: Joi.string()
        .guid({ version: ["uuidv4"] })
        .optional(),
      from: Joi.string().isoDate().optional(),
      to: Joi.string().isoDate().optional(),
    })
  );

  const tasks = await task.listWithEffectiveStatus({
    teamId,
    agentId,
    from,
    to,
  });

  return res.status(200).json(tasks);
});

router.get("/agents", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { status, from, to } = Joi.attempt(req.query, schemas.Task.list);

  const tasks = await task.listWithAgents({ teamId, status, from, to });

  return res.status(200).json(tasks);
});

router.get("/agents/:agentId", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { agentId } = Joi.attempt(req.params, schemas.Task.agentParams);
  const { status, from, to } = Joi.attempt(req.query, schemas.Task.list);

  const agent = await Agent.findByPk(agentId);

  if (!agent) {
    return res.status(404).end();
  }

  if (agent.teamId !== teamId) {
    return res.status(401).end();
  }

  const tasks = await task.listWithAgents({
    teamId,
    agentId,
    status,
    from,
    to,
  });

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

router.get("/:taskId/logs", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { taskId } = Joi.attempt(
    req.params,
    Joi.object({
      taskId: Joi.string()
        .guid({ version: ["uuidv4"] })
        .required(),
    }),
  );

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
    return res.status(404).end();
  }

  if (taskInstance.Agent.teamId !== teamId) {
    return res.status(401).end();
  }

  return res.status(200).json(await task.logs({ taskId }));
});

router.patch("/:taskId/steps/:stepId", async (req, res) => {
  const { taskId, stepId } = req.params;
  const { comment } = Joi.attempt(
    req.body,
    Joi.object({
      comment: Joi.string().max(100).allow(null, "").optional(),
    })
  );

  await task.updateStepComment({ taskId, stepId, comment: comment ?? null });
  return res.status(200).end();
});

export default router;
