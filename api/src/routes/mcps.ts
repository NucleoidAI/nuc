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
    colleagueId,
  }: {
    authorizationCode: string;
    mcpId: string;
    teamId?: string;
    colleagueId?: string;
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
  } else if (colleagueId) {
    createData.colleagueId = colleagueId;
  }

  const tokens = await mcp.create(createData);

  res.json({ tokens });
});
router.get("/", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { colleagueId, teamId: queryTeamId } = req.query as {
    teamId?: string;
    colleagueId?: string;
  };

  if (queryTeamId && queryTeamId !== teamId) {
    throw new AuthenticationError();
  }

  if (colleagueId || queryTeamId) {
    if (colleagueId) {
      const colleagueInstance = await colleague.get({ colleagueId });

      if (colleagueInstance.teamId !== teamId) {
        throw new AuthenticationError();
      }
    }

    const mcpList = await mcp.read({
      colleagueId: colleagueId || undefined,
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
