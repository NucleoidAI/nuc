import Blueprint from "../schemas/Blueprint";
import BlueprintModel from "../models/Blueprint";
import Agent from "../models/Agent";
import BlueprintModel from "../models/Blueprint";
import Joi from "joi";
import Session from "../models/Session";
import Step from "../models/Step";
import Supervising from "../models/Supervising";
import Task from "../models/Task";
import agentFn from "../functions/agent";
import { event } from "node-event-test-package/client";
import express from "express";
import mcpServer from "../functions/mcpServer";
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
    return res.status(404).end();
  }

  if (agent.teamId !== teamId) {
    return res.status(401).end();
  }

  const sessions = await Session.findAll({
    where: { agentId },
    include: [
      {
        association: "conversations",
        separate: true,
        order: [["createdAt", "ASC"]],
      },
    ],
  });

  const sorted = sessions
    .map((session) => session.toJSON())
    .filter((session) => session.conversations.length > 0)
    .sort((a, b) => {
      const aLast = a.conversations[a.conversations.length - 1]?.createdAt;
      const bLast = b.conversations[b.conversations.length - 1]?.createdAt;

      return new Date(bLast).getTime() - new Date(aLast).getTime();
    })
    .slice(0, 5);

  res.json(sorted);
});

router.get("/:agentId/api-calls", async (req, res) => {
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

  const tasks = await Task.findAll({
    where: { agentId, sessionId: null },
    include: [
      {
        model: Step,
        as: "steps",
        where: { action: "PLATFORM:api_request" },
        attributes: [],
        required: true,
      },
    ],
    order: [["createdAt", "DESC"]],
    limit: 5,
    subQuery: false,
  });

  res.json(tasks);
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
    meta: { teamId: req.session.projectId },
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

router.get("/:agentId/mcp-servers", async (req, res) => {
  const { projectId: sessionTeamId } = req.session;
  const { agentId } = req.params;

  await mcpServer.assertScopeBelongsToTeam({ agentId, sessionTeamId });

  const servers = await mcpServer.listServers({ agentId });

  res.json(servers);
});

router.put("/:agentId/mcp-servers/:serverId", async (req, res) => {
  const { projectId: sessionTeamId } = req.session;
  const { agentId, serverId } = req.params;

  await mcpServer.assertScopeBelongsToTeam({ agentId, sessionTeamId });

  const assignment = await mcpServer.assign({ serverId, agentId });

  res.json(assignment);
});

router.delete("/:agentId/mcp-servers/:serverId", async (req, res) => {
  const { projectId: sessionTeamId } = req.session;
  const { agentId, serverId } = req.params;

  await mcpServer.assertScopeBelongsToTeam({ agentId, sessionTeamId });

  await mcpServer.unassign({ serverId, agentId });

  res.status(204).end();
});

router.get("/:agentId/mcp-servers/:serverId/envs", async (req, res) => {
  const { projectId: sessionTeamId } = req.session;
  const { agentId, serverId } = req.params;

  await mcpServer.assertScopeBelongsToTeam({ agentId, sessionTeamId });
  await mcpServer.getServer({ serverId });

  const envs = await mcpServer.listEnvs({ serverId, agentId });

  res.json(envs);
});

router.put("/:agentId/mcp-servers/:serverId/envs/:key", async (req, res) => {
  const { projectId: sessionTeamId } = req.session;
  const { agentId, serverId } = req.params;
  const key = Joi.attempt(req.params.key, schemas.MCPServer.env.key);
  const { value } = Joi.attempt(req.body, schemas.MCPServer.env.set);

  await mcpServer.assertScopeBelongsToTeam({ agentId, sessionTeamId });
  await mcpServer.getServer({ serverId });

  const env = await mcpServer.setEnv({ serverId, key, value, agentId });

  res.json(env);
});

router.delete("/:agentId/mcp-servers/:serverId/envs/:key", async (req, res) => {
  const { projectId: sessionTeamId } = req.session;
  const { agentId, serverId } = req.params;
  const key = Joi.attempt(req.params.key, schemas.MCPServer.env.key);

  await mcpServer.assertScopeBelongsToTeam({ agentId, sessionTeamId });

  await mcpServer.deleteEnv({ serverId, key, agentId });

  res.status(204).end();
});

export default router;
