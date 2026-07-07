import Blueprint from "../schemas/Blueprint";
import BlueprintModel from "../models/Blueprint";
import Agent from "../models/Agent";
import BlueprintModel from "../models/Blueprint";
import Joi from "joi";
import Session from "../models/Session";
import Supervising from "../models/Supervising";
import agentFn from "../functions/agent";
import { event } from "node-event-test-package/client";
import express from "express";
import schemas from "../schemas";

const router = express.Router();

router.post("/", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { body } = req;

  const validatedBody = Joi.attempt(body, schemas.Agent);

  validatedBody.teamId = teamId;

  const agent = await Agent.create(validatedBody);

  res.status(201).json(agent);
});

router.get("/", async (req, res) => {
  const { projectId: teamId } = req.session;

  const agents = await Agent.findAll({
    where: { teamId },
    attributes: { exclude: ["aiEngineId"] },
    include: ["AIEngine"],
  });

  res.json(agents);
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { projectId: teamId } = req.session;
  const { body } = req;

  const validatedId = Joi.attempt(id, Joi.string().guid().required());
  const validatedBody = Joi.attempt(body, schemas.Agent);

  const agent = await Agent.findByPk(validatedId);

  if (!agent) {
    res.status(404);
  }

  if (agent.teamId !== teamId) {
    res.status(401);
  }

  await agent.update(validatedBody);

  res.json(agent);
});

router.get("/:agentId", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { agentId } = req.params;

  const validatedId = Joi.attempt(agentId, Joi.string().guid().required());

  const agent = await Agent.findByPk(validatedId, {
    attributes: { exclude: ["aiEngineId"] },
    include: ["AIEngine"],
  });

  if (!agent) {
    res.status(404);
  }

  if (agent && agent.teamId !== teamId) {
    res.status(401);
  }

  res.json(agent);
});

router.delete("/:id", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { id } = req.params;

  const validatedId = Joi.attempt(id, Joi.string().guid().required());

  const agent = await Agent.findByPk(validatedId);

  if (!agent) {
    res.status(404);
  }

  if (agent && agent.teamId !== teamId) {
    res.status(401);
  }

  await agent?.destroy();

  res.status(204).end();
});

router.get("/:agentId/sessions", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { agentId } = Joi.attempt(
    req.params,
    Joi.object({ agentId: Joi.string().guid().required() })
  );

  const agent = await Agent.findByPk(agentId);

  if (!agent) {
    res.status(404);
  }

  if (agent && agent.teamId !== teamId) {
    res.status(401);
  }

  const sessions = await Session.findAll({ where: { agentId } });

  res.json(sessions);
});

router.get("/:agentId/supervisings", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { agentId } = req.params;

  const { status } = Joi.attempt(
    req.query,
    Joi.object({
      status: Joi.string().valid("ANSWERED", "IN_PROGRESS").optional(),
    })
  );

  const agent = await Agent.findByPk(agentId);

  if (!agent) {
    res.status(404);
  }

  if (agent && agent.teamId !== teamId) {
    res.status(401);
  }

  const where = { agentId } as {
    agentId: string;
    status?: string;
  };

  if (status) {
    where.status = status;
  }

  const supervisings = await Supervising.findAll({ where });

  res.json(supervisings);
});

router.post("/blueprints", async (req, res) => {
  const { body } = req;

  const { history, content } = Blueprint.create.parse(body);

  const response = await agentFn.Blueprint({
    history,
    content,
  });

  res.json({
    response: response.response,
    flow: response.flow,
  });
});

router.get("/:agentId/blueprints", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { agentId } = req.params;

  const agent = await Agent.findByPk(agentId);

  if (!agent) {
    return res.status(404).json({ message: "Agent not found" });
  }

  if (agent.teamId !== teamId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const blueprints = await BlueprintModel.findAll({ where: { agentId } });

  res.json(blueprints);
});

router.post("/:agentId/blueprints", async (req, res) => {
  const { body } = req;
  const { agentId } = req.params;
  const { history, content } = Blueprint.createBlueprintName.parse(body);

  const response = await agentFn.blueprintName({ history, content, agentId });

  res.json(response);
});

router.get("/:agentId/blueprints", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { agentId } = Joi.attempt(
    req.params,
    Joi.object({ agentId: Joi.string().guid().required() })
  );

  const agent = await Agent.findByPk(agentId);

  if (!agent) {
    return res.status(404).end();
  }

  if (agent.teamId !== teamId) {
    return res.status(401).end();
  }

  const blueprints = await BlueprintModel.findAll({ where: { agentId } });

  res.json(blueprints);
});

export default router;
