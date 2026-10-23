import React from "react";

import { Box, Tooltip, Typography } from "@mui/material";

const REF_PATTERN =
  "(?:inherited_steps|steps|session_variables|byNode)(?:\\[\\d+\\]|\\.[\\w-]+)+";

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const refOf = (value: unknown) => (value as { $ref?: string } | null)?.$ref;

const formatValue = (value: unknown) => {
  const ref = refOf(value);
  if (ref) return `← ${ref}`;
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
};

const chipSx = (accent: string) => ({
  px: 0.5,
  py: 0.125,
  mx: 0.125,
  borderRadius: 0.75,
  fontFamily: "monospace",
  fontSize: "0.85em",
  fontWeight: 700,
  color: accent,
  bgcolor: (theme: { palette: { mode: string } }) =>
    theme.palette.mode === "dark"
      ? "rgba(255,255,255,0.08)"
      : "rgba(0,0,0,0.05)",
  border: "1px solid",
  borderColor: "divider",
  cursor: "help",
  transition: "all 0.15s ease",
  "&:hover": {
    color: "primary.contrastText",
    bgcolor: "primary.main",
    borderColor: "primary.main",
  },
});

const TooltipBody = ({ title, body }: { title: string; body: string }) => (
  <Box>
    <Typography
      variant="caption"
      sx={{ fontWeight: 800, fontFamily: "monospace" }}
    >
      {title}
    </Typography>
    <Typography
      component="pre"
      variant="caption"
      sx={{
        m: 0,
        fontFamily: "monospace",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        maxHeight: 240,
        overflow: "auto",
      }}
    >
      {body}
    </Typography>
  </Box>
);

const StepComment = ({
  comment,
  parameters,
}: {
  comment: string;
  parameters?: unknown;
}) => {
  if (!comment) return <>{comment}</>;

  const params =
    parameters && typeof parameters === "object" && !Array.isArray(parameters)
      ? (parameters as Record<string, unknown>)
      : {};

  const names = Object.keys(params)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  const alternatives = [`(${REF_PATTERN})`];
  if (names.length) {
    alternatives.push(
      `(?<![\\w$.\\]])(${names.map(escapeRegExp).join("|")})(?![\\w$])`
    );
  }
  const pattern = new RegExp(alternatives.join("|"), "g");

  const nodes: React.ReactNode[] = [];
  let cursor = 0;

  for (const match of comment.matchAll(pattern)) {
    const [text, ref, name] = match;
    const start = match.index ?? 0;
    if (start > cursor) {
      nodes.push(
        <React.Fragment key={`t${cursor}`}>
          {comment.slice(cursor, start)}
        </React.Fragment>
      );
    }

    if (ref) {
      const usedBy = names.filter((key) => refOf(params[key]) === ref);
      nodes.push(
        <Tooltip
          key={`r${start}`}
          arrow
          title={
            <TooltipBody
              title={ref}
              body={usedBy.length ? `→ ${usedBy.join(", ")}` : "reference"}
            />
          }
        >
          <Box component="span" sx={chipSx("text.secondary")}>
            {text}
          </Box>
        </Tooltip>
      );
    } else {
      nodes.push(
        <Tooltip
          key={`p${start}`}
          arrow
          title={<TooltipBody title={name} body={formatValue(params[name])} />}
        >
          <Box component="span" sx={chipSx("primary.main")}>
            {text}
          </Box>
        </Tooltip>
      );
    }

    cursor = start + text.length;
  }

  if (cursor < comment.length) {
    nodes.push(
      <React.Fragment key={`t${cursor}`}>
        {comment.slice(cursor)}
      </React.Fragment>
    );
  }

  return <>{nodes}</>;
};

export default StepComment;
