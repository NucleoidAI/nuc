import http from "../http";

type Channel = {
  id: string;
  channelType: "WHATSAPP" | "SLACK" | "EMAIL";
  channelCode: string;
  blueprintId: string;
};

const getChannels = async (accessToken: string) => {
  const { data } = await http.get("/channels", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return data as Channel[];
};

export { getChannels };
export type { Channel };
