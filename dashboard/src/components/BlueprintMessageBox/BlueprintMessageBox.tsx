import { Iconify } from "@canmingir/link/platform/components";
import SourcedAvatar from "../SourcedAvatar/SourcedAvatar";
import { fDateTime } from "../../utils/formatTime";
import { findMCPById } from "../ChatInput/chat.config";
import useAgent from "../../hooks/useAgent";

import { Box, Card, CardContent, Typography, useTheme } from "@mui/material";
import {
  MCPElement,
  MCPScopeElement,
  MentionElement,
} from "../BlueprintChat/MCPElement";

function BlueprintMessageBox({ message }) {
  const { getAgent } = useAgent();
  const theme = useTheme();

  const renderContent = () => {
    try {
      const parts = [];
      let currentIndex = 0;

      while (currentIndex < message.content.length) {
        const startBrace = message.content.indexOf("{", currentIndex);

        if (startBrace === -1) {
          if (currentIndex < message.content.length) {
            parts.push(message.content.substring(currentIndex));
          }
          break;
        }

        if (startBrace > currentIndex) {
          parts.push(message.content.substring(currentIndex, startBrace));
        }

        let braceCount = 0;
        let endBrace = startBrace;

        for (let i = startBrace; i < message.content.length; i++) {
          if (message.content[i] === "{") braceCount++;
          if (message.content[i] === "}") braceCount--;
          if (braceCount === 0) {
            endBrace = i;
            break;
          }
        }

        const jsonPart = message.content.substring(startBrace, endBrace + 1);
        parts.push(jsonPart);
        currentIndex = endBrace + 1;
      }

      return (
        <>
          {parts.map((part, index) => {
            try {
              const parsedContent = JSON.parse(part);

              if (parsedContent.type === "MCP") {
                const mcp = findMCPById(parsedContent.id);

                return (
                  <>
                    {parsedContent.scope ? (
                      <>
                        <MCPElement key={part}>
                          <Iconify icon={mcp.icon} sx={{ mr: 1 }} />
                          {mcp.name}
                          <MCPScopeElement key={`${part}-scope`}>
                            <Iconify
                              icon={parsedContent.scope.icon}
                              sx={{ mr: 1 }}
                            />
                            {parsedContent.scope.name}
                          </MCPScopeElement>
                        </MCPElement>
                      </>
                    ) : (
                      <MCPElement key={part}>
                        <Iconify icon={mcp.icon} sx={{ mr: 1 }} />
                        {mcp.name}
                      </MCPElement>
                    )}
                  </>
                );
              } else if (parsedContent.type === "COLLEAGUE") {
                const { agent, loading } = getAgent(parsedContent.id);

                return (
                  <MentionElement key={index}>
                    <SourcedAvatar
                      iconUrl={loading ? "L" : agent.icon}
                      name="Colleague"
                      source="MINIMAL"
                      sx={{ mr: 1 }}
                    />
                    <Typography>
                      {loading ? "Loading..." : agent.name}
                    </Typography>
                  </MentionElement>
                );
              }
            } catch {
              return <span key={index}>{part}</span>;
            }
          })}
        </>
      );
    } catch (error) {
      console.error("Error processing message content:", error);
      return message.content;
    }
  };

  const isUser = message.role === "USER";

  return (
    <Box
      data-cy="message-box"
      sx={{
        width: "100%",
        marginBottom: {
          xs: "12px",
          sm: "16px",
          md: "20px",
        },
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
      }}
    >
      <Card
        elevation={0}
        sx={{
          maxWidth: "85%",
          background: isUser
            ? `linear-gradient(135deg, ${theme.palette.primary.main}08 0%, ${theme.palette.primary.light}08 100%)`
            : `linear-gradient(135deg, ${theme.palette.secondary.main}08 0%, ${theme.palette.secondary.light}08 100%)`,
          backdropFilter: "blur(10px)",
          border: `1px solid ${
            isUser
              ? theme.palette.primary.main + "20"
              : theme.palette.secondary.main + "20"
          }`,
          borderRadius: 2,
          overflow: "visible",
          position: "relative",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            border: `1px solid ${
              isUser
                ? theme.palette.primary.main + "40"
                : theme.palette.secondary.main + "40"
            }`,
            background: isUser
              ? `linear-gradient(135deg, ${theme.palette.primary.main}12 0%, ${theme.palette.primary.light}12 100%)`
              : `linear-gradient(135deg, ${theme.palette.secondary.main}12 0%, ${theme.palette.secondary.light}12 100%)`,
          },
        }}
      >
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 0.5,
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  color: isUser
                    ? theme.palette.primary.main
                    : theme.palette.secondary.main,
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
                data-cy="message-role"
              >
                {isUser ? "You" : "Assistant"}
              </Typography>
              {message.createdAt && (
                <Typography
                  variant="caption"
                  sx={{
                    ml: 1,
                    color: theme.palette.text.secondary,
                    fontSize: "0.65rem",
                  }}
                  data-cy="message-timestamp"
                >
                  {fDateTime(message.createdAt, "MMM DD, YYYY h:mm a")}
                </Typography>
              )}
            </Box>
            <Typography
              variant="body1"
              sx={{
                userSelect: "text",
                lineHeight: 1.6,
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 0.5,
                color: theme.palette.text.primary,
              }}
              data-cy="message-content"
            >
              {renderContent()}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default BlueprintMessageBox;
