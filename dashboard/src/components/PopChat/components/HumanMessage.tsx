import Editor from "@monaco-editor/react";
import { alpha } from "@mui/material/styles";
import { Box, Stack, Typography } from "@mui/material";

import { memo, useMemo } from "react";

function tryParseJson(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return false;
  try {
    JSON.parse(trimmed);
    return true;
  } catch {
    return false;
  }
}

const HumanMessage = memo(
  ({
    message,
    selectedId,
    messageRef,
  }: {
    message: { id: string; content: string };
    selectedId: string;
    messageRef: React.RefObject<HTMLDivElement>;
  }) => {
    const isJson = useMemo(
      () => tryParseJson(message.content),
      [message.content]
    );

    const formattedJson = useMemo(() => {
      if (!isJson) return null;
      try {
        return JSON.stringify(JSON.parse(message.content), null, 2);
      } catch {
        return null;
      }
    }, [isJson, message.content]);

    const editorHeight = useMemo(() => {
      if (!formattedJson) return 0;
      const lines = formattedJson.split("\n").length;
      return Math.min(Math.max(lines * 19 + 24, 60), 200);
    }, [formattedJson]);

    return (
      <Stack
        ref={messageRef}
        sx={{
          p: isJson ? 1.5 : 2.5,
          minHeight: "auto",
          mt: 1.5,
          ml: isJson ? 0 : "auto",
          maxWidth: isJson ? "100%" : "85%",
          alignContent: "center",
          justifyContent: "center",
          borderWidth: message?.id === selectedId ? 3 : 0,
          borderRadius: isJson ? 2 : "16px 16px 4px 16px",
          borderStyle: "none",
          borderColor: "transparent",
          backgroundColor: (theme) =>
            isJson
              ? alpha(theme.palette.grey[800], 0.5)
              : alpha(theme.palette.grey[700], 0.4),
          animation: "none",
          boxShadow: 1,
        }}
      >
        {isJson ? (
          <Box>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                mb: 0.75,
                color: (theme) => alpha(theme.palette.text.secondary, 0.6),
                fontSize: "0.68rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              JSON Request
            </Typography>
            <Box
              sx={{
                border: (theme) =>
                  `1px solid ${alpha(theme.palette.grey[500], 0.2)}`,
                borderRadius: 1,
                overflow: "hidden",
                bgcolor: "#1e1e1e",
              }}
            >
              <Editor
                height={`${editorHeight}px`}
                defaultLanguage="json"
                value={formattedJson}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 12,
                  lineNumbers: "off",
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  tabSize: 2,
                  folding: false,
                  glyphMargin: false,
                  lineDecorationsWidth: 0,
                  lineNumbersMinChars: 0,
                  padding: { top: 8, bottom: 8 },
                  scrollbar: { vertical: "hidden", horizontal: "hidden" },
                  renderLineHighlight: "none",
                  selectionHighlight: false,
                  occurrencesHighlight: "off",
                  contextmenu: false,
                  domReadOnly: true,
                }}
              />
            </Box>
          </Box>
        ) : (
          <Typography
            variant="body1"
            textAlign="end"
            sx={{
              fontSize: "0.95rem",
              lineHeight: 1.6,
              wordWrap: "break-word",
            }}
          >
            {message.content}
          </Typography>
        )}
      </Stack>
    );
  }
);

export { HumanMessage };
