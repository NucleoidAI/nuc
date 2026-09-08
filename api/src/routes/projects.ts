import { Permission, Project } from "@canmingir/link-express/models";
import Joi from "joi";
import TeamDetails from "../models/TeamDetails";
import express from "express";
import mcpServer from "../functions/mcpServer";
import schemas from "../schemas";

const router = express.Router();

router.post("/", async (req, res) => {
  const { userId, appId } = req.session;
  const project = Joi.attempt(req.body, schemas.Project) as {
    name: string;
    icon: string;
    description?: string | null;
    type?: string | null;
    organizationId?: string | null;
    coach?: string | null;
  };

  const projectInstance = await Project.create(project);

  if (!projectInstance.organizationId) {
    return res.status(400).json({ error: "Organization ID is required" });
  }

  await Permission.create({
    userId,
    organizationId: projectInstance.organizationId,
    role: "OWNER",
    projectId: projectInstance.id,
    appId,
  });

  await TeamDetails.create({
    id: projectInstance.id,
    coach: "Marcus Aurelius",
    coachAvatar: ":12:",
  });

  await res.status(201).json(projectInstance);
});

router.get("/:projectId/mcp-servers", async (req, res) => {
  const { projectId: sessionTeamId } = req.session;
  const { projectId: teamId } = req.params;

  await mcpServer.assertScopeBelongsToTeam({ teamId, sessionTeamId });

  const servers = await mcpServer.listServers({ teamId });

  res.json(servers);
});

router.put("/:projectId/mcp-servers/:serverId", async (req, res) => {
  const { projectId: sessionTeamId } = req.session;
  const { projectId: teamId, serverId } = req.params;

  await mcpServer.assertScopeBelongsToTeam({ teamId, sessionTeamId });

  const assignment = await mcpServer.assign({ serverId, teamId });

  res.json(assignment);
});

router.delete("/:projectId/mcp-servers/:serverId", async (req, res) => {
  const { projectId: sessionTeamId } = req.session;
  const { projectId: teamId, serverId } = req.params;

  await mcpServer.assertScopeBelongsToTeam({ teamId, sessionTeamId });

  await mcpServer.unassign({ serverId, teamId });

  res.status(204).end();
});

router.get("/:projectId/mcp-servers/:serverId/envs", async (req, res) => {
  const { projectId: sessionTeamId } = req.session;
  const { projectId: teamId, serverId } = req.params;

  await mcpServer.assertScopeBelongsToTeam({ teamId, sessionTeamId });
  await mcpServer.getServer({ serverId });

  const envs = await mcpServer.listEnvs({ serverId, teamId });

  res.json(envs);
});

router.put("/:projectId/mcp-servers/:serverId/envs/:key", async (req, res) => {
  const { projectId: sessionTeamId } = req.session;
  const { projectId: teamId, serverId, key } = req.params;
  const { value } = Joi.attempt(req.body, schemas.MCPServer.env.set);

  await mcpServer.assertScopeBelongsToTeam({ teamId, sessionTeamId });
  await mcpServer.getServer({ serverId });

  const env = await mcpServer.setEnv({ serverId, key, value, teamId });

  res.json(env);
});

router.delete(
  "/:projectId/mcp-servers/:serverId/envs/:key",
  async (req, res) => {
    const { projectId: sessionTeamId } = req.session;
    const { projectId: teamId, serverId, key } = req.params;

    await mcpServer.assertScopeBelongsToTeam({ teamId, sessionTeamId });

    await mcpServer.deleteEnv({ serverId, key, teamId });

    res.status(204).end();
  }
);

export default router;
