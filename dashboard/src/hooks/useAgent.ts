import http from "@canmingir/link/platform/http";
import useApi from "./useApi";

import { publish, useEvent } from "@nucleoidai/react-event";

export type Agent = {
  id: string;
  name: string;
  icon: string;
  teamId: string;
  aiEngineId: string;
  projectId?: string;
  description?: string;
};

type DependencyArray = object[];

function useAgent() {
  const { Api } = useApi();

  const [agentUpdated] = useEvent("AGENT_UPDATED", null);

  const getAgent = (agentId: string, fetchState: DependencyArray = []) => {
    const eventDependencies = [agentUpdated];

    const { data, loading, error, fetch } = Api(
      () => (agentId ? http.get(`/colleagues/${agentId}`) : null),
      [agentId, ...eventDependencies, ...fetchState]
    );

    if (data) {
      publish("AGENT_LOADED", { data });
    }

    return {
      agent: data,
      loading,
      error,
      fetch,
    };
  };

  const getAgents = (fetchState: DependencyArray = []) => {
    const eventDependencies = [agentUpdated];

    const { data, loading, error, fetch } = Api(
      () => http.get("/colleagues"),
      [...eventDependencies, ...fetchState]
    );

    if (data) {
      publish("AGENTS_LOADED", { agents: data });
    }

    return {
      agents: data,
      loading,
      error,
      fetch,
    };
  };

  const updateAgent = async (agent: Agent) => {
    const response = await http.put(`/colleagues/${agent.id}`, {
      name: agent.name,
      icon: agent.icon,
      projectId: agent.projectId,
      teamId: agent.teamId,
      aiEngineId: agent.aiEngineId,
      description: agent.description,
    });

    if (response && response.data) {
      publish("AGENT_UPDATED", { agentId: agent.id });
    }

    return response.data;
  };

  return {
    getAgents,
    getAgent,
    updateAgent,
  };
}

export default useAgent;
