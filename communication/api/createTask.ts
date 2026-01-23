import http from "../http";

const createTask = async (session, description, status,agentId) => {
  const response = await http.post(
    "/tasks",
    { description, status, agentId },
    {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    }
  );

  return response.data;
};

export { createTask };

