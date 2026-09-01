import { Iconify } from "@canmingir/link/platform/components";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { Fragment, useEffect, useState } from "react";

type TokenKind =
  | "string"
  | "comment"
  | "block"
  | "keyword"
  | "literal"
  | "call"
  | "operator"
  | "plain";

const TOKEN_PATTERN = new RegExp(
  [
    `("[^"]*"|'[^']*')`,
    `(\\/\\/[^\\n]*|#[^\\n]*)`,
    `(\\b(?:BEGIN|END)_[A-Z][A-Z0-9_]*\\b)`,
    `(\\b(?:IF|THEN|ELSE|ELSEIF|ELSE_IF|WHILE|DO|FOR|FOREACH|EACH|IN|REPEAT|UNTIL|SWITCH|CASE|DEFAULT|BREAK|CONTINUE|RETURN|AND|OR|NOT)\\b)`,
    `(\\b(?:TRUE|FALSE|NULL|NONE)\\b|\\b\\d+(?:\\.\\d+)?\\b)`,
    `([A-Za-z_]\\w*(?:\\.[A-Za-z_]\\w*)*)(?=\\s*\\()`,
    `(==|!=|>=|<=|\\+=|-=|\\*=|\\/=|[=+\\-*/<>])`,
  ].join("|"),
  "g"
);

const GROUP_KINDS: TokenKind[] = [
  "string",
  "comment",
  "block",
  "keyword",
  "literal",
  "call",
  "operator",
];

const KIND_COLORS: Record<TokenKind, string> = {
  string: "success.main",
  comment: "text.disabled",
  block: "secondary.main",
  keyword: "primary.main",
  literal: "warning.main",
  call: "info.main",
  operator: "text.secondary",
  plain: "text.primary",
};

const tokenize = (line: string): Array<{ kind: TokenKind; value: string }> => {
  const tokens: Array<{ kind: TokenKind; value: string }> = [];
  let lastIndex = 0;

  TOKEN_PATTERN.lastIndex = 0;

  let match = TOKEN_PATTERN.exec(line);

  while (match) {
    const current = match;

    if (current.index > lastIndex) {
      tokens.push({
        kind: "plain",
        value: line.slice(lastIndex, current.index),
      });
    }

    const groupIndex = GROUP_KINDS.findIndex(
      (_, index) => current[index + 1] !== undefined
    );

    tokens.push({
      kind: groupIndex === -1 ? "plain" : GROUP_KINDS[groupIndex],
      value: current[0],
    });

    lastIndex = current.index + current[0].length;
    match = TOKEN_PATTERN.exec(line);
  }

  if (lastIndex < line.length) {
    tokens.push({ kind: "plain", value: line.slice(lastIndex) });
  }

  return tokens;
};

const PseudocodeViewer = ({ code }: { code: string }) => {
  const [copied, setCopied] = useState(false);
  const lines = code.replace(/\s+$/, "").split("\n");
  const gutterWidth = `${String(lines.length).length + 1}ch`;

  useEffect(() => {
    if (!copied) return;

    const timer = setTimeout(() => setCopied(false), 1500);

    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard?.writeText(code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        bgcolor: "background.default",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          pl: 1.5,
          pr: 0.5,
          py: 0.5,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ letterSpacing: "0.08em" }}
        >
          SENT TO THE AGENT
        </Typography>
        <Tooltip title={copied ? "Copied" : "Copy"} placement="left">
          <IconButton
            size="small"
            onClick={handleCopy}
            aria-label="Copy pseudocode"
          >
            <Iconify
              icon={copied ? "mdi:check" : "mdi:content-copy"}
              width={15}
              height={15}
            />
          </IconButton>
        </Tooltip>
      </Box>

      <Box
        sx={{
          overflowX: "auto",
          fontFamily: "monospace",
          fontSize: 12,
          lineHeight: 1.6,
          py: 1,
        }}
      >
        <Box sx={{ display: "inline-block", minWidth: "100%" }}>
          {lines.map((line, index) => (
            <Box key={index} sx={{ display: "flex" }}>
              <Box
                component="span"
                sx={{
                  position: "sticky",
                  left: 0,
                  flexShrink: 0,
                  boxSizing: "content-box",
                  width: gutterWidth,
                  pl: 1.5,
                  pr: 1.5,
                  textAlign: "right",
                  color: "text.disabled",
                  userSelect: "none",
                  bgcolor: "background.default",
                }}
              >
                {index + 1}
              </Box>
              <Box
                component="span"
                sx={{ whiteSpace: "pre", flexShrink: 0, pr: 1.5 }}
              >
                {tokenize(line).map((token, tokenIndex) => (
                  <Fragment key={tokenIndex}>
                    {token.kind === "plain" ? (
                      token.value
                    ) : (
                      <Box
                        component="span"
                        sx={{
                          color: KIND_COLORS[token.kind],
                          fontWeight:
                            token.kind === "block" || token.kind === "keyword"
                              ? 600
                              : 400,
                        }}
                      >
                        {token.value}
                      </Box>
                    )}
                  </Fragment>
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default PseudocodeViewer;
