import http from "@canmingir/link/platform/http";
import useApi from "./useApi";

type DailyTaskCount = {
  day: string;
  status: "IN_PROGRESS" | "COMPLETED" | "FAILED";
  count: number;
};

type AgentTaskOverview = {
  agentId: string;
  name: string;
  total: number;
  COMPLETED: number;
  IN_PROGRESS: number;
  AWAITING: number;
  FAILED: number;
  failureRate: number;
  totalTokens: number;
};

function useTaskStats() {
  const { Api } = useApi();

  const getDailyTrend = (params: {
    agentId?: string;
    from: string;
    to: string;
  }) => {
    const query = new URLSearchParams({ from: params.from, to: params.to });
    if (params.agentId) query.set("agentId", params.agentId);

    const { data, loading, error, fetch } = Api(
      () => http.get(`/statistics/tasks/daily?${query.toString()}`),
      [params.agentId, params.from, params.to]
    );

    return {
      trend: (data as DailyTaskCount[]) ?? [],
      loading,
      error,
      fetch,
    };
  };

  const getAgentOverview = (params: { from: string; to: string }) => {
    const query = new URLSearchParams({ from: params.from, to: params.to });

    const { data, loading, error, fetch } = Api(
      () => http.get(`/statistics/agents?${query.toString()}`),
      [params.from, params.to]
    );

    return {
      overview: (data as AgentTaskOverview[]) ?? [],
      loading,
      error,
      fetch,
    };
  };

  return { getDailyTrend, getAgentOverview };
}

export default useTaskStats;
