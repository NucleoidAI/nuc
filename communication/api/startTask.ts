import http from "../http";

const startTask = async (
  accessToken: string,
  agentId: string,
  blueprintId: string,
  variables?: Record<string, unknown>
) => {
  const { data } = await http.post(
    "/tasks",
    {
      agentId,
      blueprintId,
      ...(variables && Object.keys(variables).length > 0 ? { variables } : {}),
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return data;
};

export { startTask };
