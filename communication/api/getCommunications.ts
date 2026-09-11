import http from "../http";

type Communication = {
  id: string;
  channelType: "WHATSAPP" | "SLACK" | "EMAIL";
  channelCode: string;
  blueprintId: string;
};

const getCommunications = async (accessToken: string) => {
  const { data } = await http.get("/communications", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return data as Communication[];
};

export { getCommunications };
export type { Communication };
