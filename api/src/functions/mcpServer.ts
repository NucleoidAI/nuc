import {
  AuthenticationError,
  NotFoundError,
} from "@canmingir/link-express/error";

import Agent from "../models/Agent";
import MCPProvider from "../models/MCPProvider";
import MCPServer from "../models/MCPServer";
import MCPServerAssignment from "../models/MCPServerAssignment";
import MCPServerEnv from "../models/MCPServerEnv";
import MCPToolArg from "../models/MCPToolArg";

type Scope = {
  teamId?: string | null;
  agentId?: string | null;
};

type ScopedEntry = {
  key: string;
  value: string;
  teamId: string | null;
  agentId: string | null;
};

async function assertScopeBelongsToTeam({
  teamId,
  agentId,
  sessionTeamId,
}: Scope & { sessionTeamId: string }) {
  if (teamId && teamId !== sessionTeamId) {
    throw new AuthenticationError();
  }

  if (!agentId) {
    return;
  }

  const agentInstance = await Agent.findByPk(agentId);

  if (!agentInstance) {
    throw new NotFoundError();
  }

  if (agentInstance.teamId !== sessionTeamId) {
    throw new AuthenticationError();
  }
}

async function getServer({ serverId }: { serverId: string }) {
  const serverInstance = await MCPServer.findByPk(serverId);

  if (!serverInstance) {
    throw new NotFoundError();
  }

  return serverInstance;
}

async function listServers({ teamId, agentId }: Scope) {
  if (!teamId && !agentId) {
    return MCPServer.findAll({
      include: [{ model: MCPProvider, as: "provider" }],
    });
  }

  const assignments = await MCPServerAssignment.findAll({
    where: agentId ? { agentId } : { teamId },
  });

  const serverIds = assignments.map((assignment) => assignment.serverId);

  if (serverIds.length === 0) {
    return [];
  }

  return MCPServer.findAll({
    where: { id: serverIds },
    include: [{ model: MCPProvider, as: "provider" }],
  });
}

async function createServer({
  id,
  mcpProviderId,
}: {
  id: string;
  mcpProviderId: string;
}) {
  const providerInstance = await MCPProvider.findByPk(mcpProviderId);

  if (!providerInstance) {
    throw new NotFoundError();
  }

  const existing = await MCPServer.findByPk(id);

  if (existing) {
    throw new Error("MCP_SERVER_ID_ALREADY_EXISTS");
  }

  return MCPServer.create({ id, mcpProviderId });
}

async function assign({
  serverId,
  teamId,
  agentId,
}: { serverId: string } & Scope) {
  await getServer({ serverId });

  const existing = await MCPServerAssignment.findOne({
    where: {
      serverId,
      teamId: teamId ?? null,
      agentId: agentId ?? null,
    },
  });

  if (existing) {
    return existing;
  }

  return MCPServerAssignment.create({ serverId, teamId, agentId });
}

async function getAssignment({
  serverId,
  assignmentId,
}: {
  serverId: string;
  assignmentId: string;
}) {
  const assignment = await MCPServerAssignment.findOne({
    where: { id: assignmentId, serverId },
  });

  if (!assignment) {
    throw new NotFoundError();
  }

  return assignment;
}

async function listAssignments({ serverId }: { serverId: string }) {
  return MCPServerAssignment.findAll({ where: { serverId } });
}

function scopeWeight(entry: ScopedEntry): number {
  if (entry.agentId) {
    return 2;
  }

  if (entry.teamId) {
    return 1;
  }

  return 0;
}

function mergeByScope({
  entries,
  teamId,
  agentId,
}: { entries: ScopedEntry[] } & Scope): Record<string, string> {
  const applicable = entries.filter(
    (entry) =>
      (!entry.teamId && !entry.agentId) ||
      (entry.teamId && entry.teamId === teamId) ||
      (entry.agentId && entry.agentId === agentId)
  );

  return [...applicable]
    .sort((a, b) => scopeWeight(a) - scopeWeight(b))
    .reduce<Record<string, string>>((merged, entry) => {
      merged[entry.key] = entry.value;
      return merged;
    }, {});
}

async function setEnv({
  serverId,
  key,
  value,
  teamId,
  agentId,
}: { serverId: string; key: string; value: string } & Scope) {
  const existing = await MCPServerEnv.findOne({
    where: {
      serverId,
      key,
      teamId: teamId ?? null,
      agentId: agentId ?? null,
    },
  });

  if (existing) {
    return existing.update({ value });
  }

  return MCPServerEnv.create({ serverId, key, value, teamId, agentId });
}

async function resolveEnv({
  serverId,
  teamId,
  agentId,
}: { serverId: string } & Scope): Promise<Record<string, string>> {
  const entries = await MCPServerEnv.findAll({ where: { serverId } });

  return mergeByScope({ entries, teamId, agentId });
}

async function setToolArg({
  serverId,
  tool,
  key,
  value,
  teamId,
  agentId,
}: { serverId: string; tool: string; key: string; value: string } & Scope) {
  const existing = await MCPToolArg.findOne({
    where: {
      serverId,
      tool,
      key,
      teamId: teamId ?? null,
      agentId: agentId ?? null,
    },
  });

  if (existing) {
    return existing.update({ value });
  }

  return MCPToolArg.create({ serverId, tool, key, value, teamId, agentId });
}

async function resolveToolArgs({
  serverId,
  tool,
  teamId,
  agentId,
}: { serverId: string; tool: string } & Scope): Promise<
  Record<string, string>
> {
  const entries = await MCPToolArg.findAll({ where: { serverId, tool } });

  return mergeByScope({ entries, teamId, agentId });
}

export default {
  assertScopeBelongsToTeam,
  assign,
  createServer,
  getServer,
  getAssignment,
  listAssignments,
  listServers,
  resolveEnv,
  resolveToolArgs,
  setEnv,
  setToolArg,
};
