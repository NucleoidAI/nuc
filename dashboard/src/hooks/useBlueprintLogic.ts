import http from "@canmingir/link/platform/http";
import useApi from "./useApi";

type DependencyArray = object[];

function useBlueprintLogic() {
  const { Api } = useApi();

  const getBlueprintLogicRules = (
    blueprintId?: string,
    fetchState: DependencyArray = []
  ) => {
    const { data, loading, error, fetch } = Api(
      () =>
        blueprintId
          ? http.get(`/logic-rules?blueprintId=${blueprintId}`)
          : null,
      [blueprintId, ...fetchState]
    );

    return {
      logicRules: data,
      loading,
      error,
      fetch,
    };
  };

  return { getBlueprintLogicRules };
}

export default useBlueprintLogic;
