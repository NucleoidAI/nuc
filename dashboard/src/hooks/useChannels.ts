import http from "@canmingir/link/platform/http";
import useApi from "./useApi";

import { publish, useEvent } from "@nucleoidai/react-event";

export type ChannelPayload = {
  channelType: string;
  channelCode: string;
  blueprintId: string;
  config?: Record<string, unknown>;
};

function useChannels() {
  const { Api } = useApi();

  const [channelCreated] = useEvent("CHANNEL_CREATED", null);
  const [channelDeleted] = useEvent("CHANNEL_DELETED", null);
  const [channelUpdated] = useEvent("CHANNEL_UPDATED", null);

  const getChannels = () => {
    const eventDependencies = [channelCreated, channelDeleted, channelUpdated];

    const { data, loading, error, fetch } = Api(
      () => http.get("/channels"),
      [...eventDependencies]
    );

    if (data) {
      publish("CHANNELS_LOADED", { channels: data });
    }

    return {
      channels: data,
      loading,
      error,
      fetch,
    };
  };

  const createChannel = async (channel: ChannelPayload) => {
    const response = await http.post("/channels", channel);
    publish("CHANNEL_CREATED", { channel: response.data });
    return response.data;
  };

  const updateChannel = async (id: string, config: Record<string, unknown>) => {
    const response = await http.patch(`/channels/${id}`, { config });
    publish("CHANNEL_UPDATED", { channel: response.data });
    return response.data;
  };

  const deleteChannel = async (id: string) => {
    await http.delete(`/channels/${id}`);
    publish("CHANNEL_DELETED", { id });
  };

  return {
    getChannels,
    createChannel,
    updateChannel,
    deleteChannel,
  };
}

export default useChannels;
