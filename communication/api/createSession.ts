import http from "../http";
import storage from "../Storage";

const createSession = async (accessToken?: string, agentId?: string) => {
  let selectedAgentId = storage.get("selectedAgentId") || agentId;

  const create = await http.post(
    `/sessions`,
    {
      type: "CHAT",
      agentId: selectedAgentId,
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
