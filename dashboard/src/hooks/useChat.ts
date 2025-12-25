import http from "@canmingir/link/platform/http";
import useApi from "./useApi";
import { useLocation } from "react-router-dom";
import useMessage from "./useMessage";

import { publish, useEvent } from "@nucleoidai/react-event";
import { useEffect, useRef, useState } from "react";

type DependencyArray = object[];

function useChat() {
  const { Api } = useApi();
  const location = useLocation();

  const onChatPage = location.pathname === "/chat";

  const { getMessagesByDate, updateMessageStatus } = useMessage();

  const [messageCreated] = useEvent("MESSAGE_CREATED", null);
  const [supervisingAnswered] = useEvent("SUPERVISING_ANSWERED", null);
  const [taskStatus] = useEvent("TASK_STATUS_CHANGED", null);
  const [taskCreated] = useEvent("TASK_CREATED", null);
  const [knowledgeStatusChanged] = useEvent("KNOWLEDGE_STATUS_CHANGED", null);

  const getMessages = (fetchState: DependencyArray = []) => {
    const eventDependencies = [
      messageCreated,
      supervisingAnswered,
      taskStatus,
      taskCreated,
      knowledgeStatusChanged,
    ];

    const { data, loading, error, fetch } = Api(
      () => http.get(`/messages`),
      [...eventDependencies, ...fetchState]
    );

    if (data) {
      const sortedMessages = [...data].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      publish("MESSAGES_LOADED", { messages: sortedMessages });
    }

    return {
      messages: data || [],
      loading,
      error,
      fetch,
    };
  };

  const result = getMessages();
  const [messages, setMessages] = useState(result.messages);

  useEffect(() => {
    const sorted = [...(result.messages || [])].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    setMessages(sorted);
  }, [result.messages]);

  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const intervalId = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const fetchMessages = async () => {
      const currentMessages = messagesRef.current;
      if (currentMessages.length > 0) {
        let lastMessageDate = null;
        for (let i = currentMessages.length - 1; i >= 0; i--) {
          if (currentMessages[i].status === "READ") {
            lastMessageDate = currentMessages[i].createdAt;
            break;
          }
        }

        const newMessages = await getMessagesByDate(lastMessageDate);
        const filteredMessages = newMessages.filter(
          (newMessage) =>
            !Array.isArray(currentMessages) ||
            !currentMessages.some((message) => message.id === newMessage.id)
        );

        if (filteredMessages.length > 0) {
          setMessages((prevMessages) =>
            [...prevMessages, ...filteredMessages].sort(
              (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
            )
          );
          publish("MESSAGE_LOADED", { message: filteredMessages });
        }

        if (onChatPage && !document.hidden) {
          updateMessageStatus(lastMessageDate);

          const updatedStatus = newMessages.filter(
            (message) => message.status === "READ"
          );

          if (updatedStatus.length > 0) {
            setMessages((prevMessages) => {
              const updated = prevMessages.map((message) => {
                const updatedMessage = updatedStatus.find(
                  (newMessage) => newMessage.id === message.id
                );
                return updatedMessage
                  ? { ...message, status: "READ" }
                  : message;
              });

              return [...updated].sort(
                (a, b) =>
                  new Date(a.createdAt).getTime() -
                  new Date(b.createdAt).getTime()
              );
            });

            publish("MESSAGE_STATUS_UPDATED", { message: updatedStatus });
          }
        }
      }
    };

    intervalId.current = setInterval(fetchMessages, 2000);

    return () => {
      if (intervalId.current) clearInterval(intervalId.current);
    };
  }, [getMessagesByDate, onChatPage, updateMessageStatus]);

  return {
    messages,
    loading: result.loading,
    error: result.error,
  };
}

export default useChat;
