import http from "@canmingir/link/platform/http";
import { storage } from "@nucleoidjs/webstorage";
import useApi from "./useApi";

import { publish, useEvent } from "@nucleoidai/react-event";

type DependencyArray = object[];

function useAgents() {
  const { Api } = useApi();

  const [agentUpdated] = useEvent("AGENT_UPDATED", null);
  const [agentDeleted] = useEvent("AGENT_DELETED", null);
  const [agentAdded] = useEvent("AGENT_ADDED", null);
  const [teamSelected] = useEvent("PROJECT_SELECTED", { projectId: null });

  const getTeamAgents = (fetchState: DependencyArray = []) => {
    const eventDependencies = [
      agentUpdated,
      agentDeleted,
      agentAdded,
      teamSelected,
    ];

    const { data, loading, error, fetch } = Api(
      () => http.get(`/colleagues`),
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

  const createAgent = async (agent, teamId) => {
    try {
      agent.teamId = teamId || storage.get("projectId");

      console.log("agent", agent);

      const response = await http.post(`/colleagues`, {
        name: agent.name,
        icon: agent.icon,
        teamId: agent.teamId,
        aiEngineId: agent.aiEngineId,
        description: agent.description,
      });

      if (response && response.data) {
        publish("AGENT_ADDED", { agentId: response.data.id });
      }

      return response?.data;
    } catch (error) {
      console.error("Error creating agent:", error);
      return null;
    }
  };

  const deleteAgent = async (agentId) => {
    try {
      const response = await http.delete(`/colleagues/${agentId}`);

      if (response) {
        publish("AGENT_DELETED", { agentId });
      }

      return response?.data;
    } catch (error) {
      console.error("Error deleting agent:", error);
      return null;
    }
  };

  return {
    getTeamAgents,
    createAgent,
    deleteAgent,
  };
}

export default useAgents;
