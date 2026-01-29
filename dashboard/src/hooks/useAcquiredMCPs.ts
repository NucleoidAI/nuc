import http from "@canmingir/link/platform/http";
import useApi from "./useApi";
import { useCallback } from "react";

import { publish, useEvent } from "@nucleoidai/react-event";

export type MCP = {
  id: string;
  refreshToken: string;
};

export type MCPSkill = {
  id: string;
  provider: string;
  title?: string;
  description?: string;
  direction: "INCOMING" | "OUTGOING";
  logo?: string;
  oauth?: {
    scope: string;
    tokenUrl: string;
    clientId: string;
    redirectUri: string;
  };
};

function useAcquiredMCPs() {
  const { Api } = useApi();

  const [authorized] = useEvent("MCP_UPDATED", null);

  const getTokens = async (code: string, mcp, id: string, isTeam: boolean) => {
    const payload = {
      authorizationCode: code,
      mcpId: mcp.id,
      teamId: isTeam ? id : undefined,
      agentId: isTeam ? undefined : id,
    };

    if (isTeam) {
      payload.teamId = id;
    } else {
      payload.agentId = id;
    }

    const response = await http.post(`/mcps`, payload);

    console.log(response);

    publish("AUTHORIZED", {});

    return response.data;
  };

  const getMCPs = useCallback(() => {
    const { data, loading, error } = Api(() => http.get(`/mcps`), []);

    const mcps: MCPSkill[] = data?.content?.mcps ?? [];

    if (data) {
      publish("MCPS_LOADED", {
        mcps: data,
      });
    }

    return {
      mcps,
      loading,
      error,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getAcquiredMCPs = useCallback(
    (teamId: string) => {
      const { data, loading, error } = Api(
        () => http.get(`/mcps?teamId=${teamId}`),
        [authorized]
      );

      if (data) {
        publish("ACQUIRED_MCPS_LOADED", {
          acquiredMCPs: data,
        });
      }

      return {
        acquiredMCPs: data,
        loading,
        error,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const getAgentAcquiredMCPs = useCallback(
    (agentId: string) => {
      const { data, loading, error } = Api(
        () => http.get(`/mcps?agentId=${agentId}`),
        []
      );

      if (data) {
        publish("AGENT_ACQUIRED_MCPS_LOADED", {
          acquiredMCPs: data,
        });
      }

      return {
        acquiredMCPs: data,
        loading,
        error,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return {
    getMCPs,
    getAcquiredMCPs,
    getAgentAcquiredMCPs,
    getTokens,
  };
}

export default useAcquiredMCPs;
