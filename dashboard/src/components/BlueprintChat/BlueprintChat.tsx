import BlueprintChatContent from "./BlueprintChatContent";
import Box from "@mui/material/Box";
import { Close } from "@mui/icons-material";
import InlineChatInput from "../../widgets/ChatInput/InlineChatInput";
import React from "react";
import http from "@canmingir/link/platform/http";
import { publish } from "@nucleoidai/react-event";
import useBlueprint from "../../hooks/useBlueprint";

import { Card, CardContent, IconButton, useTheme } from "@mui/material";
import { useEffect, useState } from "react";

function BlueprintChat({
  setAiResponse,
  selectedItem,
  aiResponse,
  setSelectedItem,
  onTitleChange,
  onDescriptionChange,
  onCreateBlueprint,
  onMessagesChange,
  taskId,
  agentId,
  setIsChatOpen,
}) {
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const { upsertBlueprint, getBlueprintWithNode } = useBlueprint();
  const { blueprintNodes } = getBlueprintWithNode(selectedItem?.id);
  const theme = useTheme();

  useEffect(
    () => {
      if (onCreateBlueprint) {
        onCreateBlueprint(handleCreateBlueprint);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onCreateBlueprint]
  );

  useEffect(() => {
    if (blueprintNodes?.messages) {
      setMessages(blueprintNodes.messages);
    } else {
      setMessages([]);
    }
  }, [blueprintNodes]);

  useEffect(() => {
    if (onMessagesChange) onMessagesChange(messages);
  }, [messages, onMessagesChange]);

  const handleCreateBlueprint = async (title, description) => {
    const response = await upsertBlueprint(
      selectedItem?.id,
      title,
      description,
      selectedItem?.agentId || agentId,
      messages.length > 0 ? messages : undefined
    );

    if (setSelectedItem) {
      setSelectedItem(response.Blueprint);
    }
  };

  const addMessage = async (message, role = "user") => {
    try {
      const parsedMessage = message
        .split(/(\{.*?\})/)
        .map((part) => {
          if (part.startsWith("{") && part.endsWith("}")) {
            try {
              const parsed = JSON.parse(part);
              return JSON.stringify(parsed);
            } catch {
              return part;
            }
          }
          return part;
        })
        .filter((part) => part !== "")
        .join("");

      setMessages((prevMessages) => [
        ...prevMessages,
        { content: parsedMessage, role, createdAt: new Date().toISOString() },
      ]);

      if (role === "user") {
        setLoading(true);
        setError(null);

        const history = [
          ...messages,
          ...(aiResponse?.flow || blueprintNodes
            ? [
                {
                  content: JSON.stringify(aiResponse?.flow || blueprintNodes),
                  role: "assistant",
                  createdAt: new Date().toISOString(),
                },
              ]
            : []),
          {
            content: parsedMessage,
            role: "user",
            createdAt: new Date().toISOString(),
          },
        ];

        const { data } = await http.post("/agents/blueprints", {
          history,
          content: message,
        });

        const { data: blueprintNameData } = await http.post(
          `/agents/${selectedItem?.agentId || agentId}/blueprints`,
          {
            history: messages,
            content: message,
          }
        );

        if (onTitleChange)
          onTitleChange(
            blueprintNameData.title || blueprintNameData?.train[0]?.title
          );
        if (onDescriptionChange)
          onDescriptionChange(
            blueprintNameData.description ||
              blueprintNameData?.train[0]?.description
          );

        const aiMessage = data?.response;

        const updatedMessages = [
          ...messages,
          {
            content: parsedMessage,
            role: "user",
            createdAt: new Date().toISOString(),
          },
          {
            content: aiMessage,
            role: "assistant",
            createdAt: new Date().toISOString(),
          },
        ];

        const response = await upsertBlueprint(
          selectedItem?.id,
          blueprintNameData.title || blueprintNameData?.train[0]?.title,
          blueprintNameData.description ||
            blueprintNameData?.train[0]?.description,
          selectedItem?.agentId || selectedItem?.agentId || agentId,
          selectedItem?.nodes,
          taskId,
          updatedMessages
        );

        if (setSelectedItem) {
          setSelectedItem(response.Blueprint);
        }

        if (setAiResponse) {
          setAiResponse(data);
        }

        setMessages(updatedMessages);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch AI response";
      setError(errorMessage);
    } finally {
      setLoading(false);
      publish("MESSAGES_LOADED", true);
    }
  };

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        width: {
          xs: "100%",
          sm: "100%",
          md: "100%",
          lg: "100%",
          xl: "100%",
        },
        maxWidth: "100%",
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default}20 100%)`,
        backdropFilter: "blur(10px)",
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        overflow: "hidden",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        zIndex: theme.zIndex.modal,
      }}
    >
      <CardContent
        sx={{
          p: 0,
          "&:last-child": { pb: 0 },
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <Box
          sx={{
            p: 1,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <IconButton size="small" onClick={() => setIsChatOpen(false)}>
            <Close fontSize="small" />
          </IconButton>
        </Box>
        <Box
          sx={{
            flex: 1,
            paddingTop: {
              xs: "8px",
              sm: "10px",
              md: "10px",
            },
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <BlueprintChatContent loading={loading} messages={messages} />
          {error && (
            <Box
              sx={{
                color: "error.main",
                my: 1,
                mx: 2,
                fontSize: {
                  xs: "0.75rem",
                  sm: "0.825rem",
                  md: "0.875rem",
                },
                padding: {
                  xs: "8px",
                  sm: "10px",
                  md: "12px",
                },
                backgroundColor: "error.light",
                borderRadius: 2,
                border: `1px solid ${theme.palette.error.main}20`,
              }}
            >
              {error}
            </Box>
          )}
        </Box>
        <Box sx={{ borderTop: `1px solid ${theme.palette.divider}20`, mt: 1 }}>
          <InlineChatInput onSend={(message) => addMessage(message)} />
        </Box>
      </CardContent>
    </Card>
  );
}

export default BlueprintChat;
