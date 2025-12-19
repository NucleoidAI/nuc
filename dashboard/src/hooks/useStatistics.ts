import http from "@canmingir/link/platform/http";
import useApi from "./useApi";
import { useEvent } from "@nucleoidai/react-event";

type DependencyArray = object[];

function useStatistics() {
  const { Api } = useApi();

  const [teamSelected] = useEvent("PROJECT_SELECTED", null);
  const [configInitialized] = useEvent("CONFIG_INITIALIZED", null);

  const getStatistics = (fetchState: DependencyArray = []) => {
    const eventDependencies = [teamSelected, configInitialized];

    const { data, loading, error, fetch } = Api(
      () => http.get(`/statistics`),
      [...eventDependencies, ...fetchState]
    );

    return {
      statistics: data,
      loading,
      error,
      fetch,
    };
  };

  const result = getStatistics();

  return {
    loading: result.loading,
    error: result.error,
    statistics: result.statistics,
  };
}

export default useStatistics;
