import Joi from "joi";
import MCPServerEnv from "../models/MCPServerEnv";
import MCPToolArg from "../models/MCPToolArg";
import { NotFoundError } from "@canmingir/link-express/error";
import express from "express";
import mcpServer from "../functions/mcpServer";
import schemas from "../schemas";

const router = express.Router();

router.get("/", async (req, res) => {
  const { projectId: sessionTeamId } = req.session;
  const { teamId, agentId } = Joi.attempt(req.query, schemas.MCPServer.list);

  await mcpServer.assertScopeBelongsToTeam({ teamId, agentId, sessionTeamId });

  const servers = await mcpServer.listServers({ teamId, agentId });

  res.json(servers);
});

router.post("/", async (req, res) => {
  const { id, mcpProviderId } = Joi.attempt(req.body, schemas.MCPServer.create);

  const server = await mcpServer.createServer({ id, mcpProviderId });

  res.status(201).json(server);
});

router.get("/:serverId", async (req, res) => {
  const { serverId } = req.params;

  const server = await mcpServer.getServer({ serverId });

  res.json(server);
});

router.delete("/:serverId", async (req, res) => {
  const { serverId } = req.params;

  const server = await mcpServer.getServer({ serverId });

  await server.destroy();

  res.status(204).end();
});

router.get("/:serverId/assignments", async (req, res) => {
  const { serverId } = req.params;

  await mcpServer.getServer({ serverId });

  const assignments = await mcpServer.listAssignments({ serverId });

  res.json(assignments);
});

router.post("/:serverId/assignments", async (req, res) => {
  const { projectId: sessionTeamId } = req.session;
  const { serverId } = req.params;
  const { teamId, agentId } = Joi.attempt(
    req.body,
    schemas.MCPServer.assignment.create
  );

  await mcpServer.assertScopeBelongsToTeam({ teamId, agentId, sessionTeamId });

  const assignment = await mcpServer.assign({ serverId, teamId, agentId });

  res.status(201).json(assignment);
});

router.delete("/:serverId/assignments/:assignmentId", async (req, res) => {
  const { projectId: sessionTeamId } = req.session;
  const { serverId, assignmentId } = req.params;

  const assignment = await mcpServer.getAssignment({ serverId, assignmentId });

  await mcpServer.assertScopeBelongsToTeam({
    teamId: assignment.teamId,
    agentId: assignment.agentId,
    sessionTeamId,
  });

  await assignment.destroy();

  res.status(204).end();
});

router.get("/:serverId/envs", async (req, res) => {
  const { serverId } = req.params;

  await mcpServer.getServer({ serverId });

  const envs = await MCPServerEnv.findAll({ where: { serverId } });

  res.json(envs);
});

router.post("/:serverId/envs", async (req, res) => {
  const { projectId: sessionTeamId } = req.session;
  const { serverId } = req.params;
  const { key, value, teamId, agentId } = Joi.attempt(
    req.body,
    schemas.MCPServer.env.create
  );

  await mcpServer.getServer({ serverId });
  await mcpServer.assertScopeBelongsToTeam({ teamId, agentId, sessionTeamId });

  const env = await mcpServer.setEnv({ serverId, key, value, teamId, agentId });

  res.status(201).json(env);
});

router.patch("/:serverId/envs/:envId", async (req, res) => {
  const { serverId, envId } = req.params;
  const { value } = Joi.attempt(req.body, schemas.MCPServer.env.update);

  const env = await MCPServerEnv.findOne({ where: { id: envId, serverId } });

  if (!env) {
    throw new NotFoundError();
  }

  await env.update({ value });

  res.json(env);
});

router.delete("/:serverId/envs/:envId", async (req, res) => {
  const { serverId, envId } = req.params;

  const env = await MCPServerEnv.findOne({ where: { id: envId, serverId } });

  if (!env) {
    throw new NotFoundError();
  }

  await env.destroy();

  res.status(204).end();
});

router.get("/:serverId/tool-args", async (req, res) => {
  const { serverId } = req.params;
  const { tool } = req.query as { tool?: string };

  await mcpServer.getServer({ serverId });

  const where = tool ? { serverId, tool } : { serverId };

  const toolArgs = await MCPToolArg.findAll({ where });

  res.json(toolArgs);
});

router.post("/:serverId/tool-args", async (req, res) => {
  const { projectId: sessionTeamId } = req.session;
  const { serverId } = req.params;
  const { tool, key, value, teamId, agentId } = Joi.attempt(
    req.body,
    schemas.MCPServer.toolArg.create
  );

  await mcpServer.getServer({ serverId });
  await mcpServer.assertScopeBelongsToTeam({ teamId, agentId, sessionTeamId });

  const toolArg = await mcpServer.setToolArg({
    serverId,
    tool,
    key,
    value,
    teamId,
    agentId,
  });

  res.status(201).json(toolArg);
});

router.patch("/:serverId/tool-args/:toolArgId", async (req, res) => {
  const { serverId, toolArgId } = req.params;
  const { value } = Joi.attempt(req.body, schemas.MCPServer.toolArg.update);

  const toolArg = await MCPToolArg.findOne({
    where: { id: toolArgId, serverId },
  });

  if (!toolArg) {
    throw new NotFoundError();
  }

  await toolArg.update({ value });

  res.json(toolArg);
});

router.delete("/:serverId/tool-args/:toolArgId", async (req, res) => {
  const { serverId, toolArgId } = req.params;

  const toolArg = await MCPToolArg.findOne({
    where: { id: toolArgId, serverId },
  });

  if (!toolArg) {
    throw new NotFoundError();
  }

  await toolArg.destroy();

  res.status(204).end();
});

export default router;
