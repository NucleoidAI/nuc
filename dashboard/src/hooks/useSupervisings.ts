import http from "@canmingir/link/platform/http";
import useApi from "./useApi";
import { useCallback } from "react";

import { publish, useEvent } from "@nucleoidai/react-event";

type SupervisingInput = {
  conversationId: string;
  agentId: string;
  sessionId: string;
};

function useSupervisings() {
  const { Api } = useApi();

  const [supervisingAnswered] = useEvent("SUPERVISING_ANSWERED", null);

  const createSupervising = async (supervising: SupervisingInput) => {
    if (!supervising) {
      return null;
    }

    const response = await http.post(`/supervisings`, {
      conversationId: supervising.conversationId,
      agentId: supervising.agentId,
      sessionId: supervising.sessionId,
    });

    return response?.data;
  };

  const updateSupervising = async (
    supervisingId: string,
    inputValue: string
  ) => {
    const response = await http.patch(`/supervisings/${supervisingId}`, {
      status: "ANSWERED",
      answer: inputValue,
    });

    if (response?.data) {
      publish("SUPERVISING_ANSWERED", response.data);
    }

    return response?.data;
  };

  const resolveSupervising = async (supervisingId: string, answer: string) => {
    const response = await http.patch(`/supervisings/${supervisingId}/demo`, {
      answer,
      status: "ANSWERED",
    });

    return response?.data;
  };

  const approveBlueprintChat = async ({
    supervisingId,
    decision,
    answer,
    knowledge,
  }: {
    supervisingId: string;
    decision: "KNOWLEDGE" | "BLUEPRINT";
    answer: string;
    knowledge?: string;
  }) => {
    const response = await http.post(`/blueprint-chat/approve`, {
      supervisingId,
      decision,
      answer,
      knowledge,
    });

    return response?.data;
  };

  const blueprintChat = async ({
    supervisingId,
    agentId,
    content,
    sessionId,
    blueprintId,
  }: {
    supervisingId?: string;
    agentId?: string;
    content: string;
    sessionId: string;
    blueprintId?: string;
  }) => {
    const response = await http.post(`/blueprint-chat`, {
      supervisingId,
      agentId,
      content,
      sessionId,
      blueprintId,
    });

    return response?.data;
  };

  const submitSupervising = async (supervisingId: string) => {
    const response = await http.patch(
      `/supervisings/${supervisingId}/demo/submit`,
      { status: "ANSWERED" }
    );

    return response?.data;
  };

  const getAgentSupervising = useCallback((agentId?: string) => {
    if (!agentId) return;

    const { data, loading, error } = Api(
      () => http.get(`/agents/${agentId}/supervisings`),
      [agentId, supervisingAnswered]
    );

    return {
      supervisings: data,
      loading,
      error,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getAgentSupervisingByStatus = useCallback(
    (agentId?: string, status?: string) => {
      if (!agentId) return;

      const endpoint =
        !status || status === "All"
          ? `/agents/${agentId}/supervisings`
          : `/agents/${agentId}/supervisings?status=${status}`;

      const { data, loading, error, fetch } = Api(
        () => http.get(endpoint),
        [agentId, status, supervisingAnswered]
      );

      return {
        supervisings: data,
        loading,
        error,
        fetch,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const getTeamSupervisingByStatus = useCallback(
    (status?: string, range?: { from: string; to: string }) => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (range) {
        params.set("from", range.from);
        params.set("to", range.to);
      }
      const query = params.toString();

      const { data, loading, error, fetch } = Api(
        () => http.get(`/supervisings${query ? `?${query}` : ""}`),
        [status, range?.from, range?.to, supervisingAnswered]
      );

      return {
        supervisings: data,
        loading,
        error,
        fetch,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const getTeamSupervisingWithAgents = useCallback(
    (status?: string, range?: { from: string; to: string }) => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (range) {
        params.set("from", range.from);
        params.set("to", range.to);
      }
      const query = params.toString();

      const { data, loading, error, fetch } = Api(
        () => http.get(`/supervisings/agents${query ? `?${query}` : ""}`),
        [status, range?.from, range?.to, supervisingAnswered]
      );

      return {
        supervisings:
          (data as {
            id: string;
            question: string;
            createdAt: string;
            status: "IN_PROGRESS" | "ANSWERED";
            Agent: { id: string; name: string };
          }[]) ?? [],
        loading,
        error,
        fetch,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return {
    createSupervising,
    updateSupervising,
    resolveSupervising,
    submitSupervising,
    blueprintChat,
    approveBlueprintChat,
    getAgentSupervisingByStatus,
    getAgentSupervising,
    getTeamSupervisingByStatus,
    getTeamSupervisingWithAgents,
  };
}

export default useSupervisings;
