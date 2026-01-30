import http from "../http";

const getAgents = async (session) => {
  const { data } = await http.get("/agents", {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
  });

  return data;
};

export { getAgents };
