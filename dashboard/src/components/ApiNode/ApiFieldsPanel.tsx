import { Iconify } from "@canmingir/link/platform/components";
import type { ReactNode } from "react";

import type { ApiField, ApiType } from "./apiNodes";
import { alpha, styled } from "@mui/material/styles";

type Handle = {
  name: string;
  bound?: boolean;
  interactive?: boolean;
  title?: string;
  dataAttrs?: Record<string, string>;
  onHandleMouseDown?: (event: React.MouseEvent) => void;
};

const Panel = styled("div")(({ theme }) => ({
  position: "absolute",
  top: "calc(100% + 10px)",
  left: 0,
  width: "100%",
  minWidth: 260,
  display: "flex",
  flexDirection: "column",
  gap: 2,
  padding: 10,
  borderRadius: 12,
  background: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow:
    theme.palette.mode === "dark"
      ? "0 6px 18px rgba(0,0,0,0.5)"
      : "0 6px 18px rgba(0,0,0,0.12)",
  zIndex: 25,
  cursor: "default",
}));

const Title = styled("div", {
  shouldForwardProp: (prop) => prop !== "align",
})<{ align: "left" | "right" }>(({ align, theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: 4,
  justifyContent: align === "right" ? "flex-end" : "flex-start",
  marginBottom: 4,
  fontSize: 9,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: theme.palette.text.disabled,
}));

const Row = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "3px 4px",
  borderRadius: 6,
  transition: "background-color 0.15s ease",
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
}));

const Dot = styled("div", {
  shouldForwardProp: (prop) =>
    prop !== "variant" && prop !== "bound" && prop !== "interactive",
})<{ variant: "in" | "out"; bound: boolean; interactive: boolean }>(
  ({ variant, bound, interactive, theme }) => {
    const accent =
      variant === "out"
        ? theme.palette.secondary.main
        : theme.palette.grey[600];

    return {
      flexShrink: 0,
      boxSizing: "content-box",
      width: 9,
      height: 9,
      borderRadius: "50%",
      background: bound ? accent : theme.palette.background.paper,
      border: `2px solid ${bound ? accent : theme.palette.grey[400]}`,
      boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
      cursor: interactive ? "crosshair" : "default",
      opacity: interactive ? 1 : 0.35,
      pointerEvents: "auto",
      transition: "transform 0.15s ease, box-shadow 0.15s ease",
      ...(interactive && {
        "&:hover": {
          transform: "scale(1.35)",
          borderColor: accent,
          boxShadow: `0 0 0 2px ${
            theme.palette.background.paper
          }, 0 0 0 5px ${alpha(accent, 0.22)}`,
        },
      }),
    };
  }
);

const Name = styled("div", {
  shouldForwardProp: (prop) => prop !== "bound",
})<{ bound: boolean }>(({ bound, theme }) => ({
  flex: 1,
  minWidth: 0,
  fontSize: 11,
  fontWeight: bound ? 600 : 400,
  color: bound ? theme.palette.text.primary : theme.palette.text.secondary,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
}));

const Required = styled("div")(({ theme }) => ({
  flexShrink: 0,
  width: 6,
  fontSize: 11,
  color: theme.palette.error.main,
}));

const Type = styled("div")(({ theme }) => ({
  flexShrink: 0,
  fontSize: 10,
  fontFamily: "monospace",
  color: theme.palette.text.disabled,
}));

function typeLabel(type: ApiType): string {
  if (type.type === "array")
    return `${typeLabel(type.items ?? { type: "string" })}[]`;
  if (type.type === "number" && type.integer) return "integer";
  return type.type;
}

export default function ApiFieldsPanel({
  side,
  title,
  fields,
  handles,
  renderLabel,
  sx,
}: {
  side: "in" | "out";
  title: string;
  fields: ApiField[];
  handles: Handle[];
  renderLabel: (name: string) => ReactNode;
  sx?: object;
}) {
  const align = side === "out" ? "right" : "left";
  const byName = new Map(fields.map((field) => [field.name, field]));

  return (
    <Panel sx={sx} onMouseDown={(event) => event.stopPropagation()}>
      <Title align={align}>
        {side === "in" && (
          <Iconify icon="mdi:arrow-down-left" width={10} height={10} />
        )}
        {title}
        {side === "out" && (
          <Iconify icon="mdi:arrow-up-right" width={10} height={10} />
        )}
      </Title>
      {handles.map((handle) => {
        const field = byName.get(handle.name);
        const required = field?.required !== false;
        const dot = (
          <Dot
            variant={side}
            bound={Boolean(handle.bound)}
            interactive={handle.interactive !== false}
            title={handle.title}
            onMouseDown={handle.onHandleMouseDown}
            {...handle.dataAttrs}
          />
        );

        return (
          <Row key={handle.name}>
            {side === "in" && dot}
            <Name
              bound={Boolean(handle.bound)}
              title={field?.description ?? handle.name}
            >
              {renderLabel(handle.name)}
            </Name>
            <Required>{required ? "*" : ""}</Required>
            {field && <Type>{typeLabel(field)}</Type>}
            {side === "out" && dot}
          </Row>
        );
      })}
    </Panel>
  );
}
