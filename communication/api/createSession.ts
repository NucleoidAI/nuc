import http from "../http";
import storage from "../Storage";

const createSession = async (accessToken?: string, agentId?: string) => {
  let selectedColleagueId = storage.get("selectedColleagueId") || agentId;

  const create = await http.post(
    `/sessions`,
    {
      type: "CHAT",
      agentId: selectedColleagueId,
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  console.log("Session created", create.data);
  return create.data;
};

export { createSession };
