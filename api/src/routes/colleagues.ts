import Blueprint from "../schemas/Blueprint";
import Colleague from "../models/Colleague";
import Joi from "joi";
import Session from "../models/Session";
import Supervising from "../models/Supervising";
import agent from "../functions/agent";
import { event } from "node-event-test-package/client";
import express from "express";
import schemas from "../schemas";

const router = express.Router();

router.post("/", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { body } = req;

  const validatedBody = Joi.attempt(body, schemas.Colleague);

  validatedBody.teamId = teamId;

  const colleague = await Colleague.create(validatedBody);

  res.status(201).json(colleague);
});

router.get("/", async (req, res) => {
  const { projectId: teamId } = req.session;

  const colleagues = await Colleague.findAll({
    where: { teamId },
    attributes: { exclude: ["aiEngineId"] },
    include: ["AIEngine"],
  });

  res.json(colleagues);
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { projectId: teamId } = req.session;
  const { body } = req;

  const validatedId = Joi.attempt(id, Joi.string().guid().required());
  const validatedBody = Joi.attempt(body, schemas.Colleague);

  const colleague = await Colleague.findByPk(validatedId);

  if (!colleague) {
    res.status(404);
  }

  if (colleague.teamId !== teamId) {
    res.status(401);
  }

  await colleague.update(validatedBody);

  res.json(colleague);
});

router.get("/:agentId", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { agentId } = req.params;

  const validatedId = Joi.attempt(agentId, Joi.string().guid().required());

  const colleague = await Colleague.findByPk(validatedId, {
    attributes: { exclude: ["aiEngineId"] },
    include: ["AIEngine"],
  });

  if (!colleague) {
    res.status(404);
  }

  if (colleague && colleague.teamId !== teamId) {
    res.status(401);
  }

  res.json(colleague);
});

router.delete("/:id", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { id } = req.params;

  const validatedId = Joi.attempt(id, Joi.string().guid().required());

  const colleague = await Colleague.findByPk(validatedId);

  if (!colleague) {
    res.status(404);
  }

  if (colleague && colleague.teamId !== teamId) {
    res.status(401);
  }

  await colleague?.destroy();

  res.status(204).end();
});

router.get("/:agentId/sessions", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { agentId } = Joi.attempt(
    req.params,
    Joi.object({ agentId: Joi.string().guid().required() })
  );

  const colleague = await Colleague.findByPk(agentId);

  if (!colleague) {
    res.status(404);
  }

  if (colleague && colleague.teamId !== teamId) {
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

  const colleague = await Colleague.findByPk(agentId);

  if (!colleague) {
    res.status(404);
  }

  if (colleague && colleague.teamId !== teamId) {
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

  const response = await agent.Blueprint({
    history,
    content,
  });

  res.json({
    response: response.response,
    flow: response.flow,
  });
});

router.post("/blueprint-name", async (req, res) => {
  const { body } = req;
  const { history, content } = Blueprint.createBlueprintName.parse(body);

  const response = await agent.blueprintName({ history, content });

  res.json(response);
});

export default router;
