import http from "@canmingir/link/platform/http";
import useApi from "./useApi";

export type DailyRate = {
  day: string;
  rate: number;
};

function useSupervisingStats() {
  const { Api } = useApi();

  const getDailyRate = (params: {
    agentId?: string;
    from: string;
    to: string;
  }) => {
    const query = new URLSearchParams({ from: params.from, to: params.to });
    if (params.agentId) query.set("agentId", params.agentId);

    const { data, loading, error, fetch } = Api(
      () => http.get(`/statistics/supervisings/daily?${query.toString()}`),
      [params.agentId, params.from, params.to]
    );

    return {
      trend: (data as DailyRate[]) ?? [],
      loading,
      error,
      fetch,
    };
  };

  const getCount = (params: {
    agentId?: string;
    status?: "IN_PROGRESS" | "ANSWERED";
    from: string;
    to: string;
  }) => {
    const query = new URLSearchParams({ from: params.from, to: params.to });
    if (params.agentId) query.set("agentId", params.agentId);
    if (params.status) query.set("status", params.status);

    const { data, loading, error, fetch } = Api(
      () => http.get(`/statistics/supervisings/count?${query.toString()}`),
      [params.agentId, params.status, params.from, params.to]
    );

    return {
      count: (data as { count: number })?.count ?? 0,
      loading,
      error,
      fetch,
    };
  };

  return { getDailyRate, getCount };
}

export default useSupervisingStats;
