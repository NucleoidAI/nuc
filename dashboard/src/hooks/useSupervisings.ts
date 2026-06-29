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

  const evaluateSupervising = async (
    supervisingId: string,
    answer: string,
    blueprintId?: string
  ) => {
    const response = await http.post(
      `/supervisings/${supervisingId}/evaluate`,
      {
        answer,
        blueprintId,
      }
    );

    return response?.data;
  };

  const resolveSupervising = async (supervisingId: string, answer: string) => {
    const response = await http.patch(`/supervisings/${supervisingId}/demo`, {
      answer,
      status: "ANSWERED",
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

  return {
    createSupervising,
    updateSupervising,
    evaluateSupervising,
    resolveSupervising,
    submitSupervising,
    getAgentSupervisingByStatus,
    getAgentSupervising,
  };
}

export default useSupervisings;
