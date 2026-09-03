import http from "@canmingir/link/platform/http";
import useApi from "./useApi";
import { useCallback } from "react";

export type MCPProvider = {
  id: string;
  name: string;
};

export type MCPServer = {
  id: string;
  mcpProviderId: string;
  description: string | null;
  icon: string | null;
  provider?: MCPProvider;
};

export type MCPServerAssignment = {
  id: string;
  serverId: string;
  teamId: string | null;
  agentId: string | null;
};

export type MCPScope = {
  teamId?: string;
  agentId?: string;
};

export type MCPServerEnv = {
  id: string;
  serverId: string;
  key: string;
  value: string;
  teamId: string | null;
  agentId: string | null;
};

export type MCPToolArg = MCPServerEnv & {
  tool: string;
};

export type MCPTool = {
  id: string;
  action: string;
  label: string;
  description?: string;
  icon?: string;
  direction: "INCOMING" | "OUTGOING";
};

function scopeQuery({ teamId, agentId }: MCPScope): string {
  return agentId ? `agentId=${agentId}` : `teamId=${teamId}`;
}

function useMCPServers() {
  const { Api } = useApi();

  const getProviders = useCallback(() => {
    const { data, loading, error } = Api(() => http.get(`/mcp-providers`), []);

    return { providers: (data ?? []) as MCPProvider[], loading, error };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getAssignedServers = useCallback((scope: MCPScope) => {
    const { data, loading, error, fetch } = Api(
      () => http.get(`/mcp-servers?${scopeQuery(scope)}`),
      [scope.teamId, scope.agentId]
    );

    return {
      servers: (data ?? []) as MCPServer[],
      loading,
      error,
      refetch: fetch,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getAllServers = useCallback(() => {
    const { data, loading, error } = Api(() => http.get(`/mcp-servers`), []);

    return { servers: (data ?? []) as MCPServer[], loading, error };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const listAssignments = async (serverId: string) => {
    const response = await http.get(`/mcp-servers/${serverId}/assignments`);

    return response.data as MCPServerAssignment[];
  };

  const assign = async ({
    serverId,
    teamId,
    agentId,
  }: { serverId: string } & MCPScope) => {
    const response = await http.post(`/mcp-servers/${serverId}/assignments`, {
      teamId: agentId ? undefined : teamId,
      agentId,
    });

    return response.data as MCPServerAssignment;
  };

  const unassign = async ({
    serverId,
    assignmentId,
  }: {
    serverId: string;
    assignmentId: string;
  }) => {
    await http.delete(`/mcp-servers/${serverId}/assignments/${assignmentId}`);
  };

  const listTools = async (serverId: string) => {
    const response = await http.get(`/mcp-servers/${serverId}/tools`);

    return response.data as MCPTool[];
  };

  const listEnvs = async (serverId: string) => {
    const response = await http.get(`/mcp-servers/${serverId}/envs`);

    return response.data as MCPServerEnv[];
  };

  const createEnv = async ({
    serverId,
    key,
    value,
    teamId,
    agentId,
  }: { serverId: string; key: string; value: string } & MCPScope) => {
    const response = await http.post(`/mcp-servers/${serverId}/envs`, {
      key,
      value,
      teamId: agentId ? undefined : teamId,
      agentId,
    });

    return response.data as MCPServerEnv;
  };

  const deleteEnv = async ({
    serverId,
    envId,
  }: {
    serverId: string;
    envId: string;
  }) => {
    await http.delete(`/mcp-servers/${serverId}/envs/${envId}`);
  };

  const listToolArgs = async (serverId: string) => {
    const response = await http.get(`/mcp-servers/${serverId}/tool-args`);

    return response.data as MCPToolArg[];
  };

  const createToolArg = async ({
    serverId,
    tool,
    key,
    value,
    teamId,
    agentId,
  }: {
    serverId: string;
    tool: string;
    key: string;
    value: string;
  } & MCPScope) => {
    const response = await http.post(`/mcp-servers/${serverId}/tool-args`, {
      tool,
      key,
      value,
      teamId: agentId ? undefined : teamId,
      agentId,
    });

    return response.data as MCPToolArg;
  };

  const deleteToolArg = async ({
    serverId,
    toolArgId,
  }: {
    serverId: string;
    toolArgId: string;
  }) => {
    await http.delete(`/mcp-servers/${serverId}/tool-args/${toolArgId}`);
  };

  return {
    assign,
    createEnv,
    createToolArg,
    deleteEnv,
    deleteToolArg,
    getAllServers,
    getAssignedServers,
    getProviders,
    listAssignments,
    listEnvs,
    listToolArgs,
    listTools,
    unassign,
  };
}

export default useMCPServers;
