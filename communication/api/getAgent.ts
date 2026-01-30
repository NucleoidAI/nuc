import http from "../http";

const getAgent = async (accessToken?: string, agentId?: string) => {
  const { data } = await http.get(`/agents/${agentId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return data;
};

export { getAgent };
