import http from "@canmingir/link/platform/http";
import useApi from "./useApi";

import { publish, useEvent } from "@nucleoidai/react-event";

type DependencyArray = object[];

function useOrganization(id?: string) {
  const { Api } = useApi();

  const [teamSelected] = useEvent("TEAM_SELECTED", null);

  const getOrganizationsById = (fetchState: DependencyArray = []) => {
    const eventDependencies = [teamSelected];

    const { data, loading, error, fetch } = Api(
      () =>
        id ? http.get(`/organizations/${id}`) : Promise.resolve({ data: [] }),
      [id, ...eventDependencies, ...fetchState]
    );

    return {
      organizations: data,
      loading,
      error,
      fetch,
    };
  };

  const createOrganization = async (organization) => {
    try {
      const response = await http.post("/organizations", organization);

      if (response && response.data) {
        publish("ORGANIZATION_CREATED", { organization: response.data });
      }

      return response?.data;
    } catch (error) {
      console.error("Error creating organization:", error);
      return null;
    }
  };

  const result = getOrganizationsById();

  return {
    createOrganization,
    organizations: result.organizations,
    loading: result.loading,
    error: result.error,
  };
}

export default useOrganization;
