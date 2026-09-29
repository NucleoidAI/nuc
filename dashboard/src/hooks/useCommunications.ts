import http from "@canmingir/link/platform/http";
import useApi from "./useApi";

import { publish, useEvent } from "@nucleoidai/react-event";

export type CommunicationPayload = {
  channelType: string;
  channelCode: string;
  blueprintId: string;
  config?: Record<string, unknown>;
};

function useCommunications() {
  const { Api } = useApi();

  const [communicationCreated] = useEvent("COMMUNICATION_CREATED", null);
  const [communicationDeleted] = useEvent("COMMUNICATION_DELETED", null);
  const [communicationUpdated] = useEvent("COMMUNICATION_UPDATED", null);

  const getCommunications = () => {
    const eventDependencies = [
      communicationCreated,
      communicationDeleted,
      communicationUpdated,
    ];

    const { data, loading, error, fetch } = Api(
      () => http.get("/communications"),
      [...eventDependencies]
    );

    if (data) {
      publish("COMMUNICATIONS_LOADED", { communications: data });
    }

    return {
      communications: data,
      loading,
      error,
      fetch,
    };
  };

  const createCommunication = async (communication: CommunicationPayload) => {
    const response = await http.post("/communications", communication);
    publish("COMMUNICATION_CREATED", { communication: response.data });
    return response.data;
  };

  const updateCommunication = async (
    id: string,
    config: Record<string, unknown>
  ) => {
    const response = await http.patch(`/communications/${id}`, { config });
    publish("COMMUNICATION_UPDATED", { communication: response.data });
    return response.data;
  };

  const deleteCommunication = async (id: string) => {
    await http.delete(`/communications/${id}`);
    publish("COMMUNICATION_DELETED", { id });
  };

  return {
    getCommunications,
    createCommunication,
    updateCommunication,
    deleteCommunication,
  };
}

export default useCommunications;
