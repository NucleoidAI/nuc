import http from "../http";

const getBlueprint = async (accessToken: string, blueprintId: string) => {
  const { data } = await http.get(`/blueprints/${blueprintId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return data as { id: string; agentId: string; title: string };
};

export { getBlueprint };
