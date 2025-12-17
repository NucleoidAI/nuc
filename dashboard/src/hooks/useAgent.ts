import http from "@canmingir/link/platform/http";
import { publish } from "@nucleoidai/react-event";
import useApi from "./useApi";

import { useCallback, useEffect, useState } from "react";

function useAgent(agentId) {
  const [agent, setAgent] = useState({
    name: "",
    icon: "",
    teamId: "",
    AIEngine: "",
  });

  const { loading, error, handleResponse } = useApi();

  // TODO - Research self-call events

  useEffect(() => {
    if (agentId) {
      getAgent(agentId);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  const getAgent = useCallback((agentId) => {
    if (!agentId) {
      return;
    }

    handleResponse(
      http.get(`/colleagues/${agentId}`),
      (response) => setAgent(response.data),
      (error) => {
        console.error(error);
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateAgent = useCallback((agent) => {
    handleResponse(
      http.put(`/colleagues/${agent.id}`, {
        name: agent.name,
        icon: agent.icon,
        projectId: agent.projectId,
        teamId: agent.teamId,
        aiEngineId: agent.aiEngineId,
        description: agent.description,
      }),
      () => {
        publish("AGENT_UPDATED", { agentId: agent.id });
      },
      (error) => {
        console.error(error);
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    agent,
    loading,
    error,
    getAgent,
    updateAgent,
  };
}

export default useAgent;
