import http from "@canmingir/link/platform/http";
import { publish } from "@nucleoidai/react-event";
import useApi from "./useApi";
import { useCallback } from "react";

function useMCPs() {
  const { Api } = useApi();

  const getMCPs = useCallback(() => {
    const { data, loading, error } = Api(() => http.get(`/mcps`), []);

    if (data) {
      publish("MCPS_LOADED", {
        mcps: data,
      });
    }

    return {
      mcps: data,
      loading,
      error,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getColleagueMCP = useCallback(
    (agentId: string) => {
      const { data, loading, error } = Api(
        () => http.get(`/mcps?agentId=${agentId}`),
        [agentId]
      );

      if (data) {
        publish("COLLEAGUE_MCPS_LOADED", {
          colleagueMCPs: data,
        });
      }

      return {
        colleagueMCPs: data,
        loading,
        error,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return {
    getMCPs,
    getColleagueMCP,
  };
}

export default useMCPs;
