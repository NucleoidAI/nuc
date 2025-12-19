import http from "@canmingir/link/platform/http";
import useApi from "./useApi";

type DependencyArray = object[];

function useAIEngines() {
  const { Api } = useApi();

  const getEngines = (fetchState: DependencyArray = []) => {
    const { data, loading, error, fetch } = Api(
      () => http.get(`/engines`),
      [...fetchState]
    );

    return {
      engines: data,
      loading,
      error,
      fetch,
    };
  };

  const result = getEngines();

  return {
    loading: result.loading,
    error: result.error,
    engines: result.engines,
  };
}

export default useAIEngines;
