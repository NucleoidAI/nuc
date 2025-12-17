import http from "@canmingir/link/platform/http";
import { storage } from "@nucleoidjs/webstorage";
import useApi from "./useApi";

import { publish, useEvent } from "@nucleoidai/react-event";
import { useCallback, useEffect, useState } from "react";

function useAgents() {
  const [agents, setAgents] = useState([]);
  const { loading, error, handleResponse } = useApi();
  const [agentUpdated] = useEvent("AGENT_UPDATED", null);
  const [agentDeleted] = useEvent("AGENT_DELETED", null);
  const [agentAdded] = useEvent("AGENT_ADDED", null);

  const [teamSelected] = useEvent("PROJECT_SELECTED", { projectId: null });

  useEffect(() => {
    getTeamAgents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentUpdated, agentDeleted, agentAdded, teamSelected]);

  const getTeamAgents = useCallback(() => {
    handleResponse(
      http.get(`/colleagues`),
      (response) => setAgents(response.data),
      (error) => {
        console.error(error);
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createAgent = useCallback(async (agent, teamId) => {
    agent.teamId = teamId || storage.get("projectId");

    console.log("agent", agent);

    const response = await http.post(`/colleagues`, {
      name: agent.name,
      icon: agent.icon,
      teamId: agent.teamId,
      aiEngineId: agent.aiEngineId,
      description: agent.description,
    });

    publish("AGENT_ADDED", { agentId: response.data.id });

    return response.data;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deleteAgent = useCallback((agentId) => {
    handleResponse(
      http.delete(`/colleagues/${agentId}`),
      publish("AGENT_DELETED", { agentId }),
      (error) => {
        console.error(error);
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    agents,
    loading,
    error,
    createAgent,
    deleteAgent,
    getTeamAgents,
  };
}

export default useAgents;
