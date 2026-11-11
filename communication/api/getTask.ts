import http from "../http";

const getTask = async (accessToken: string, taskId: string) => {
  const { data } = await http.get(`/tasks/${taskId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return data;
};

export { getTask };
