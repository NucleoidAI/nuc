import http from "@canmingir/link/platform/http";
import useApi from "./useApi";

import { useEvent } from "@nucleoidai/react-event";

export type LLMLogEntry = {
  id: string;
  provider: string;
  model: string | null;
  source: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  cost: number | null;
  costSource: "provider" | "pricing" | null;
  durationMs: number | null;
  taskId: string;
  createdAt: string;
};

export type TaskUsage = {
  task: {
    id: string;
    description: string;
    status: string;
    comment: string | null;
    createdAt: string;
    debug?: boolean;
    agentId?: string;
    Agent?: { id: string; name: string };
  };
  totals: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost: number;
    calls: number;
  };
  logs: LLMLogEntry[];
};

function useLLMLogs() {
  const { Api } = useApi();
  const [teamSelected] = useEvent("PROJECT_SELECTED", { projectId: null });

  const getUsageByAgent = (agentId: string) => {
    const { data, loading, error, fetch } = Api(
      () =>
        agentId
          ? http.get(`/llm-logs?agentId=${agentId}`)
          : Promise.resolve({ data: [] }),
      [agentId]
    );

    return {
      usage: (data as TaskUsage[]) ?? [],
      loading,
      error,
      fetch,
    };
  };

  const getUsageByTeam = (range?: { from: string; to: string }) => {
    const query = new URLSearchParams();
    if (range) {
      query.set("from", range.from);
      query.set("to", range.to);
    }
    const queryString = query.toString();

    const { data, loading, error, fetch } = Api(
      () => http.get(`/llm-logs${queryString ? `?${queryString}` : ""}`),
      [range?.from, range?.to, teamSelected]
    );

    return {
      usage: (data as TaskUsage[]) ?? [],
      loading,
      error,
      fetch,
    };
  };

  return { getUsageByAgent, getUsageByTeam };
}

export default useLLMLogs;
