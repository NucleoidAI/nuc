import http from "@canmingir/link/platform/http";
import useApi from "./useApi";

export type DailyTaskCount = {
  day: string;
  status: "IN_PROGRESS" | "COMPLETED" | "FAILED";
  count: number;
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

  return { getDailyTrend };
}

export default useTaskStats;
