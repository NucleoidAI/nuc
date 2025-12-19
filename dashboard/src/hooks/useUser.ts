import useApi from "./useApi";
import userInstance from "../http/user";

type DependencyArray = object[];

function useUser() {
  const { Api } = useApi();

  const getUser = (fetchState: DependencyArray = []) => {
    const { data, loading, error, fetch } = Api(async () => {
      const userData = await userInstance.getUserDetails();
      // Wrap the data in the expected format for Api
      return { data: userData };
    }, [...fetchState]);

    return {
      user: data,
      loading,
      error,
      fetch,
    };
  };

  const result = getUser();

  return {
    user: result.user,
    loading: result.loading,
    error: result.error,
  };
}

export default useUser;
