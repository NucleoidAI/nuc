import http from "@canmingir/link/platform/http";
import { publish } from "@nucleoidai/react-event";

function useMessage() {
  const createMessage = async (message) => {
    try {
      const response = await http.post(`/messages`, {
        role: message.role,
        userId: message.userId,
        content: message.content,
        status: message.status,
        replyTo: message.replyTo,
      });

      if (response && response.data) {
        publish("MESSAGE_CREATED", { message: response.data });
      }

      return response?.data;
    } catch (error) {
      console.error("Error creating message:", error);
      return null;
    }
  };

  const updateMessageStatus = async (date) => {
    try {
      const response = await http.patch(`/messages?offset=${date}`, {
        status: "READ",
      });

      if (response && response.data) {
        publish("MESSAGE_STATUS_UPDATED", { message: response.data });
      }

      return response?.data;
    } catch (error) {
      console.error("Error updating message status:", error);
      return null;
    }
  };

  const getMessagesByDate = async (date) => {
    try {
      const response = await http.get(`/messages?offset=${date}`);
      const messages = response.data;

      if (messages) {
        publish("MESSAGES_LOADED_BY_DATE", { messages });
      }

      return messages;
    } catch (error) {
      console.error("Error getting messages by date:", error);
      return [];
    }
  };

  return {
    createMessage,
    updateMessageStatus,
    getMessagesByDate,
  };
}

export default useMessage;
