import http from "@canmingir/link/platform/http";
import useApi from "./useApi";
import { useEvent } from "@nucleoidai/react-event";

type DependencyArray = object[];

function useSupervising(id: string) {
  const { Api } = useApi();

  const [supervisingAnswered] = useEvent("SUPERVISING_ANSWERED", null);

  const getSupervisingById = (fetchState: DependencyArray = []) => {
    const eventDependencies = [supervisingAnswered];

    const { data, loading, error, fetch } = Api(
      () =>
        id ? http.get(`/supervisings/${id}`) : Promise.resolve({ data: null }),
      [id, ...eventDependencies, ...fetchState]
    );

    return {
      supervising: data,
      loading,
      error,
      fetch,
    };
  };

  const result = getSupervisingById();

  return {
    loading: result.loading,
    error: result.error,
    supervising: result.supervising,
  };
}

export default useSupervising;
