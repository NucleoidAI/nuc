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

export type MCPTool = {
  id: string;
  action: string;
  label: string;
  description?: string;
  icon?: string;
  direction: "INCOMING" | "OUTGOING";
};

function scopePath({ teamId, agentId }: MCPScope): string {
  return agentId ? `/agents/${agentId}` : `/projects/${teamId}`;
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
      () => http.get(`${scopePath(scope)}/mcp-servers`),
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
    ...scope
  }: { serverId: string } & MCPScope) => {
    const response = await http.put(
      `${scopePath(scope)}/mcp-servers/${serverId}`
    );

    return response.data as MCPServerAssignment;
  };

  const unassign = async ({
    serverId,
    ...scope
  }: { serverId: string } & MCPScope) => {
    await http.delete(`${scopePath(scope)}/mcp-servers/${serverId}`);
  };

  const listTools = async (serverId: string) => {
    const response = await http.get(`/mcp-servers/${serverId}/tools`);

    return response.data as MCPTool[];
  };

  const listEnvs = async (serverId: string, scope: MCPScope) => {
    const response = await http.get(
      `${scopePath(scope)}/mcp-servers/${serverId}/envs`
    );

    return response.data as MCPServerEnv[];
  };

  const setEnv = async ({
    serverId,
    key,
    value,
    ...scope
  }: { serverId: string; key: string; value: string } & MCPScope) => {
    const response = await http.put(
      `${scopePath(scope)}/mcp-servers/${serverId}/envs/${encodeURIComponent(
        key
      )}`,
      { value }
    );

    return response.data as MCPServerEnv;
  };

  const deleteEnv = async ({
    serverId,
    key,
    ...scope
  }: { serverId: string; key: string } & MCPScope) => {
    await http.delete(
      `${scopePath(scope)}/mcp-servers/${serverId}/envs/${encodeURIComponent(
        key
      )}`
    );
  };

  return {
    assign,
    deleteEnv,
    getAllServers,
    getAssignedServers,
    getProviders,
    listAssignments,
    listEnvs,
    listTools,
    setEnv,
    unassign,
  };
}

export default useMCPServers;
