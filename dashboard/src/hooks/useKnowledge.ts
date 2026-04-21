import http from "@canmingir/link/platform/http";
import useApi from "./useApi";

import { publish, useEvent } from "@nucleoidai/react-event";

export type Knowledge = {
  id: string;
  type: string;
  text: string;
  url: string;
  question: string;
  answer: string;
  agentId: string;
  status: string;
  createdAt: string;
  teamId: string;
  blueprintId?: string;
  organizationId?: string;
};

export type KnowledgeInput = {
  type: string;
  text?: string;
  url?: string;
  question?: string;
  answer?: string;
  blueprintId?: string;
  organizationId?: string;
};

type DependencyArray = object[];

function useKnowledge() {
  const { Api } = useApi();

  const [knowledgeCreated] = useEvent("KNOWLEDGE_CREATED", null);
  const [knowledgeUpdated] = useEvent("KNOWLEDGE_UPDATED", null);
  const [knowledgeDeleted] = useEvent("KNOWLEDGE_DELETED", null);
  const [knowledgeStatusChanged] = useEvent("KNOWLEDGE_STATUS_CHANGED", null);

  const getKnowledge = (
    knowledgeId: string,
    fetchState: DependencyArray = []
  ) => {
    const eventDependencies = [
      knowledgeUpdated,
      knowledgeStatusChanged,
      knowledgeDeleted,
    ];

    const { data, loading, error, fetch } = Api(
      () => http.get(`/knowledge/${knowledgeId}`),
      [knowledgeId, ...eventDependencies, ...fetchState]
    );

    return {
      knowledge: data,
      loading,
      error,
      fetch,
    };
  };

  const getTeamKnowledges = (
    teamId: string,
    fetchState: DependencyArray = []
  ) => {
    const eventDependencies = [
      knowledgeCreated,
      knowledgeUpdated,
      knowledgeDeleted,
      knowledgeStatusChanged,
    ];

    const { data, loading, error, fetch } = Api(
      () => (teamId ? http.get(`/knowledge?teamId=${teamId}`) : null),
      [teamId, ...eventDependencies, ...fetchState]
    );

    if (data) {
      publish("KNOWLEDGE_LOADED", { knowledge: data });
    }

    return {
      knowledges: data,
      loading,
      error,
      fetch,
    };
  };

  const getAgentKnowledges = (
    agentId: string,
    fetchState: DependencyArray = []
  ) => {
    const eventDependencies = [
      knowledgeCreated,
      knowledgeUpdated,
      knowledgeDeleted,
      knowledgeStatusChanged,
    ];

    const { data, loading, error, fetch } = Api(
      () => (agentId ? http.get(`/knowledge?agentId=${agentId}`) : null),
      [agentId, ...eventDependencies, ...fetchState]
    );

    if (data) {
      publish("KNOWLEDGE_LOADED", { knowledge: data });
    }

    return {
      knowledges: data,
      loading,
      error,
      fetch,
    };
  };

  const createKnowledge = async (
    knowledge: KnowledgeInput,
    agentId: string,
    teamId?: string,
    blueprintId?: string,
    organizationId?: string
  ) => {
    const response = await http.post("/knowledge", {
      url: knowledge.url,
      text: knowledge.text,
      question: knowledge.question,
      answer: knowledge.answer,
      agentId: agentId,
      teamId: teamId,
      blueprintId: blueprintId || knowledge.blueprintId,
      organizationId: organizationId || knowledge.organizationId,
      type: knowledge.type,
    });

    if (response && response.data) {
      publish("KNOWLEDGE_CREATED", { knowledge: response.data });
    }

    return response.data;
  };

  const deleteKnowledge = async (knowledge: Knowledge) => {
    if (!knowledge || !knowledge.id) {
      return null;
    }

    const response = await http.delete(`/knowledge/${knowledge.id}`);

    if (response) {
      publish("KNOWLEDGE_DELETED", { knowledge: knowledge.id });
    }

    return response.data;
  };

  const changeKnowledgeStatus = async (knowledgeId: string, status: string) => {
    const result = await http.patch(`/knowledge/${knowledgeId}/status`, {
      status,
    });

    if (result.data) {
      publish("KNOWLEDGE_STATUS_CHANGED", { knowledge: result.data });
    }

    return result.data;
  };

  return {
    getKnowledge,
    getTeamKnowledges,
    getAgentKnowledges,
    createKnowledge,
    deleteKnowledge,
    changeKnowledgeStatus,
  };
}

export default useKnowledge;
