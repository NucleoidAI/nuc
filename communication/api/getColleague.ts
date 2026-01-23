import http from "../http";

const getColleague = async (accessToken?: string, agentId?: string) => {
  const { data } = await http.get(`/agents/${agentId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return data;
};

export { getColleague };
