import Colleague from "../models/Colleague";
import MCP from "../models/MCP";
import MCPs from "../mcps/mcps";
import { NotFoundError } from "@canmingir/link-express/error";
import axios from "axios";

async function read({
  agentId,
  teamId,
}: {
  teamId?: string;
  agentId?: string;
}) {
  const mcpWhere: {
    agentId?: string;
    teamId?: string;
  } = {};

  if (agentId) {
    const colleagueInstance = await Colleague.findByPk(agentId);

    if (!colleagueInstance) {
      throw new Error("INVALID_COLLEAGUE");
    }

    mcpWhere.agentId = agentId;
  } else if (teamId) {
    mcpWhere.teamId = teamId;
  }

  const mcpInstance = await MCP.findAll({
    where: mcpWhere,
  });

  return mcpInstance
    .map((mcp) => mcp.toJSON())
    .map(({ Colleague, ...mcpData }) => ({
      ...mcpData,
      agentId: mcpData.agentId,
      teamId: mcpData.teamId,
    }));
}

async function create({
  authorizationCode,
  mcpId,
  teamId,
  agentId,
}: {
  authorizationCode: string;
  mcpId: string;
  teamId?: string;
  agentId?: string;
}) {
  if ((agentId && teamId) || (!agentId && !teamId)) {
    throw new Error("EITHER_COLLEAGUE_ID_OR_TEAM_ID_REQUIRED");
  }

  const params = new URLSearchParams();

  const mcpAuth = MCPs.find((mcp) => mcp.id === mcpId);

  if (!mcpAuth) {
    throw new NotFoundError();
  }

  if (!mcpAuth.oauth) {
    throw new Error("NO_OAUTH_CONFIG");
  }

  const { clientId, clientSecret, redirectUri, tokenUrl } = mcpAuth.oauth;

  if (clientId && clientSecret && redirectUri && tokenUrl) {
    params.append("code", authorizationCode);
    params.append("client_id", clientId);
    params.append("client_secret", clientSecret);
    params.append("redirect_uri", redirectUri);
    params.append("grant_type", "authorization_code");
  }

  const response = await axios.post(tokenUrl, params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  const tokens = response.data;

  const { refresh_token } = tokens;

  await MCP.create({
    refreshToken: refresh_token,
    mcpId,
    teamId,
    agentId,
  });
}

function list() {
  if (!MCPs || MCPs.length === 0) {
    throw new NotFoundError();
  }

  const mcps = MCPs.map((provider) => ({
    id: provider.id,
    provider: provider.provider,
    description: provider.description,
    action: provider.action,
    direction: provider.direction,
    lib: provider.lib,
    inputSchema: provider.inputSchema,
    outputSchema: provider.outputSchema,
    oauth: provider.oauth
      ? {
          scope: provider.oauth.scope,
          tokenUrl: provider.oauth.tokenUrl,
          clientId: provider.oauth.clientId,
          redirectUri: provider.oauth.redirectUri,
          authUrl: provider.oauth.authUrl,
          clientScript: provider.oauth.clientScript,
        }
      : null,
  }));

  return {
    role: "system",
    content: { mcps },
  } as {
    role: "user" | "system" | "assistant";
    content: object;
  };
}

async function get({ mcpId }: { mcpId: string }) {
  const mcpItem = await MCP.findByPk(mcpId);

  if (!mcpItem) {
    throw new NotFoundError();
  }

  return mcpItem.toJSON();
}

export default { read, get, create, list };
