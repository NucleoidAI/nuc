import http from "@canmingir/link/platform/http";
import { publish } from "@nucleoidai/react-event";
import useApi from "./useApi";
import { useCallback } from "react";

function useIntegrations() {
  const { Api } = useApi();

  const getIntegrations = useCallback(() => {
    const { data, loading, error } = Api(() => http.get(`/integrations`), []);

    if (data) {
      publish("INTEGRATIONS_LOADED", {
        integrations: data,
      });
    }

    return {
      integrations: data,
      loading,
      error,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getActions = useCallback(() => {
    const { data, loading, error } = Api(
      () => http.get(`/integrations/actions`),
      []
    );

    if (data) {
      publish("ACTIONS_LOADED", {
        actions: data,
      });
    }

    return {
      actions: data,
      loading,
      error,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getColleagueIntegration = useCallback(
    (colleagueId: string) => {
      const { data, loading, error } = Api(
        () => http.get(`/integrations?colleagueId=${colleagueId}`),
        [colleagueId]
      );

      if (data) {
        publish("COLLEAGUE_INTEGRATIONS_LOADED", {
          colleagueIntegrations: data,
        });
      }

      return {
        colleagueIntegrations: data,
        loading,
        error,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return {
    getIntegrations,
    getActions,
    getColleagueIntegration,
  };
}

export default useIntegrations;
