import { AuthenticationError } from "@canmingir/link-express/error";
import MCP from "../models/MCP";
import colleague from "../functions/colleague";
import express from "express";
import mcp from "../functions/mcp";

const router = express.Router();

router.post("/", async (req, res) => {
  const { projectId: teamId } = req.session;
  const {
    authorizationCode,
    mcpId,
    teamId: mcpTeamId,
    agentId,
  }: {
    authorizationCode: string;
    mcpId: string;
    teamId?: string;
    agentId?: string;
  } = req.body;

  if (mcpTeamId && mcpTeamId !== teamId) {
    throw new AuthenticationError();
  }

  const createData: any = {
    authorizationCode,
    mcpId,
  };

  if (mcpTeamId) {
    createData.teamId = mcpTeamId;
  } else if (agentId) {
    createData.agentId = agentId;
  }

  const tokens = await mcp.create(createData);

  res.json({ tokens });
});
router.get("/", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { agentId, teamId: queryTeamId } = req.query as {
    teamId?: string;
    agentId?: string;
  };

  if (queryTeamId && queryTeamId !== teamId) {
    throw new AuthenticationError();
  }

  if (agentId || queryTeamId) {
    if (agentId) {
      const colleagueInstance = await colleague.get({ agentId });

      if (colleagueInstance.teamId !== teamId) {
        throw new AuthenticationError();
      }
    }

    const mcpList = await mcp.read({
      agentId: agentId || undefined,
      teamId,
    });

    res.json(mcpList);
  } else {
    // TODO - split endpoint for all MCPs
    const allMCPs = await mcp.list();
    res.json(allMCPs);
  }
});

router.delete("/:id", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { id } = req.params;

  const mcpItem = await mcp.get({
    mcpId: id,
  });

  const { Colleague } = mcpItem;

  const hasAccess =
    (Colleague && Colleague.teamId === teamId) || mcpItem.teamId === teamId;

  if (!hasAccess) {
    throw new AuthenticationError();
  }

  await MCP.destroy({ where: { id } });

  res.status(204).end();
});

export default router;
