import Editor from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import { alpha } from "@mui/material/styles";

import remarkGfm from "remark-gfm";

import { Box, Stack } from "@mui/material";

import React, { memo, useMemo } from "react";

function tryParseJson(content: string): object | null {
  const trimmed = content.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

const JsonViewer: React.FC<{ content: string }> = memo(({ content }) => {
  const formatted = useMemo(() => {
    try {
      return JSON.stringify(JSON.parse(content), null, 2);
    } catch {
      return content;
    }
  }, [content]);

  const lineCount = formatted.split("\n").length;
  const height = Math.min(Math.max(lineCount * 19 + 24, 60), 300);

  return (
    <Box
      sx={{
        border: (theme) =>
          `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
        borderRadius: 1,
        overflow: "hidden",
        bgcolor: "#1e1e1e",
      }}
    >
      <Editor
        height={`${height}px`}
        defaultLanguage="json"
        value={formatted}
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
          cursorStyle: "line",
          contextmenu: false,
          domReadOnly: true,
        }}
      />
    </Box>
  );
});

const AIMessage: React.FC<{
  content: string;
  messageRef?: React.RefObject<HTMLDivElement>;
}> = memo(({ content, messageRef }) => {
  const parsedJson = useMemo(() => tryParseJson(content), [content]);

  return (
    <Stack
      ref={messageRef}
      sx={{
        p: 2,
        alignContent: "flex-start",
        justifyContent: "flex-start",
        backgroundColor: (theme) => alpha(theme.palette.primary.dark, 0.4),
        borderRadius: 2,
        height: "auto",
        mt: 1.5,
        boxShadow: 1,
        border: (theme) =>
          `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
      }}
    >
      {parsedJson ? (
        <JsonViewer content={content} />
      ) : (
        <Box
          sx={{
            width: "100%",
            "& p": {
              margin: "0.5em 0",
              fontSize: "0.95rem",
              lineHeight: 1.6,
              color: (theme) => theme.palette.text.primary,
            },
            "& p:first-of-type": { marginTop: 0 },
            "& p:last-of-type": { marginBottom: 0 },
            "& code": {
              backgroundColor: (theme) => alpha(theme.palette.grey[900], 0.6),
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "0.9em",
              fontFamily: "monospace",
            },
            "& pre": {
              backgroundColor: (theme) => alpha(theme.palette.grey[900], 0.7),
              padding: "12px",
              borderRadius: "6px",
              overflow: "auto",
              margin: "0.75em 0",
            },
            "& pre code": { backgroundColor: "transparent", padding: 0 },
            "& ul, & ol": {
              marginLeft: "1.5em",
              marginTop: "0.5em",
              marginBottom: "0.5em",
            },
            "& li": { marginBottom: "0.25em", lineHeight: 1.6 },
            "& blockquote": {
              borderLeft: (theme) => `3px solid ${theme.palette.primary.main}`,
              paddingLeft: "1em",
              marginLeft: 0,
              fontStyle: "italic",
              opacity: 0.9,
            },
            "& strong": { fontWeight: 600 },
            "& a": {
              color: (theme) => theme.palette.primary.light,
              textDecoration: "underline",
            },
            "& h1, & h2, & h3, & h4, & h5, & h6": {
              marginTop: "0.75em",
              marginBottom: "0.5em",
              fontWeight: 600,
            },
            "& hr": {
              border: "none",
              borderTop: (theme) =>
                `1px solid ${alpha(theme.palette.grey[500], 0.3)}`,
              margin: "1em 0",
            },
          }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </Box>
      )}
    </Stack>
  );
});

export { AIMessage };
