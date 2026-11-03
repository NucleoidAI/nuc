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

type TaskStatusCounts = {
  total: number;
  COMPLETED: number;
  IN_PROGRESS: number;
  AWAITING: number;
  FAILED: number;
};

type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  calls: number;
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

  const getStatusCounts = (params: {
    agentId?: string;
    from: string;
    to: string;
  }) => {
    const query = new URLSearchParams({ from: params.from, to: params.to });
    if (params.agentId) query.set("agentId", params.agentId);

    const { data, loading, error, fetch } = Api(
      () => http.get(`/statistics/tasks/status?${query.toString()}`),
      [params.agentId, params.from, params.to]
    );

    return {
      counts: (data as TaskStatusCounts) ?? {
        total: 0,
        COMPLETED: 0,
        IN_PROGRESS: 0,
        AWAITING: 0,
        FAILED: 0,
      },
      loading,
      error,
      fetch,
    };
  };

  const getTaskCount = (params: {
    agentId?: string;
    from: string;
    to: string;
  }) => {
    const query = new URLSearchParams({ from: params.from, to: params.to });
    if (params.agentId) query.set("agentId", params.agentId);

    const { data, loading, error, fetch } = Api(
      () => http.get(`/statistics/tasks/count?${query.toString()}`),
      [params.agentId, params.from, params.to]
    );

    return {
      count: (data as { count: number })?.count ?? 0,
      loading,
      error,
      fetch,
    };
  };

  const getTokenUsage = (params: {
    agentId?: string;
    from: string;
    to: string;
  }) => {
    const query = new URLSearchParams({ from: params.from, to: params.to });
    if (params.agentId) query.set("agentId", params.agentId);

    const { data, loading, error, fetch } = Api(
      () => http.get(`/statistics/tokens?${query.toString()}`),
      [params.agentId, params.from, params.to]
    );

    return {
      usage: (data as TokenUsage) ?? {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        calls: 0,
      },
      loading,
      error,
      fetch,
    };
  };

  return {
    getDailyTrend,
    getAgentOverview,
    getStatusCounts,
    getTaskCount,
    getTokenUsage,
  };
}

export default useTaskStats;
