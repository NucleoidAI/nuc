import http from "../http";
import storage from "../Storage";

const createSession = async (accessToken?: string, agentId?: string, blueprintId?: string, variables?: Record<string, unknown>) => {
  let selectedAgentId = storage.get("selectedAgentId") || agentId;

  const create = await http.post(
    `/sessions`,
    {
      type: "CHAT",
      agentId: selectedAgentId,
      ...(blueprintId ? { blueprintId } : {}),
      ...(variables && Object.keys(variables).length > 0 ? { variables } : {}),
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return create.data;
};

export { createSession };
