import http from "@canmingir/link/platform/http";
import useApi from "./useApi";

type DependencyArray = object[];

function useTeamDetails() {
  const { Api } = useApi();

  const getTeamDetails = (fetchState: DependencyArray = []) => {
    const { data, loading, error, fetch } = Api(
      () => http.get("/teams/details"),
      [...fetchState]
    );

    return {
      teamDetails: data,
      loading,
      error,
      fetch,
    };
  };

  const result = getTeamDetails();

  return {
    teamDetails: result.teamDetails,
    loading: result.loading,
    error: result.error,
  };
}

export default useTeamDetails;
