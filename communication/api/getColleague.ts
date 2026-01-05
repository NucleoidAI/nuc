import http from "../http";

const getColleague = async (accessToken?: string, colleagueId?: string) => {
  const { data } = await http.get(`/agents/${colleagueId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return data;
};

export { getColleague };
