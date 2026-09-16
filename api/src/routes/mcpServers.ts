import Joi from "joi";
import express from "express";
import mcpServer from "../functions/mcpServer";
import schemas from "../schemas";

const router = express.Router();

router.get("/", async (_req, res) => {
  const servers = await mcpServer.listServers({});

  res.json(servers);
});

router.post("/", async (req, res) => {
  const { id, mcpProviderId, description } = Joi.attempt(
    req.body,
    schemas.MCPServer.create
  );

  const server = await mcpServer.createServer({
    id,
    mcpProviderId,
    description,
  });

  res.status(201).json(server);
});

router.get("/:serverId", async (req, res) => {
  const { serverId } = req.params;

  const server = await mcpServer.getServer({ serverId });

  res.json(server);
});

router.patch("/:serverId", async (req, res) => {
  const { serverId } = req.params;
  const changes = Joi.attempt(req.body, schemas.MCPServer.update);

  const server = await mcpServer.getServer({ serverId });

  await server.update(changes);

  res.json(server);
});

router.delete("/:serverId", async (req, res) => {
  const { serverId } = req.params;

  const server = await mcpServer.getServer({ serverId });

  await server.destroy();

  res.status(204).end();
});

router.get("/:serverId/tools", async (req, res) => {
  const { serverId } = req.params;

  const tools = await mcpServer.listTools({ serverId });

  res.json(tools);
});

router.get("/:serverId/assignments", async (req, res) => {
  const { serverId } = req.params;

  await mcpServer.getServer({ serverId });

  const assignments = await mcpServer.listAssignments({ serverId });

  res.json(assignments);
});

export default router;
