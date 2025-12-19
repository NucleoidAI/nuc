import http from "@canmingir/link/platform/http";
import useApi from "./useApi";

type DependencyArray = object[];

function useTask(id: string) {
  const { Api } = useApi();

  const getTask = (fetchState: DependencyArray = []) => {
    const { data, loading, error, fetch } = Api(
      () => (id ? http.get(`/tasks/${id}`) : Promise.resolve({ data: null })),
      [id, ...fetchState]
    );

    return {
      task: data,
      loading,
      error,
      fetch,
    };
  };

  const result = getTask();

  return {
    loading: result.loading,
    error: result.error,
    task: result.task,
  };
}

export default useTask;
