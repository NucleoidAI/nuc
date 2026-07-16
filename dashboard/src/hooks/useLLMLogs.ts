import http from "@canmingir/link/platform/http";
import useApi from "./useApi";

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
    createdAt: string;
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

  return { getUsageByAgent };
}

export default useLLMLogs;
