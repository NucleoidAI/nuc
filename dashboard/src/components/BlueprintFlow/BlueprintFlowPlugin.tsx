import {
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material";
import { Iconify, InfoNode } from "@canmingir/link/platform/components";
import React, { useState } from "react";
import { alpha, styled } from "@mui/material/styles";

const AddButtonWrapper = styled("div")(({ theme }) => ({
  position: "absolute",
  top: "8px",
  right: "0px",
  transform: "translateX(-50%) scale(1)",
  width: "24px",
  height: "24px",
  borderRadius: "50%",
  backgroundColor: theme.palette?.background.paper,
  color: "#555",
  border: "1px solid rgba(0, 0, 0, 0.1)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
  zIndex: 10,
  "&:hover": {
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
    color: theme.palette?.primary.main,
  },
}));

const DeleteButtonWrapper = styled("div")(({ theme }) => ({
  position: "absolute",
  bottom: "8px",
  right: "8px",
  width: "24px",
  height: "24px",
  borderRadius: "50%",
  backgroundColor: theme.palette?.background.paper,
  color: "#555",
  border: "1px solid rgba(0, 0, 0, 0.1)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
  zIndex: 10,
  "&:hover": {
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
    color: theme.palette?.error.main,
  },
}));

const EditButtonWrapper = styled("div")(({ theme }) => ({
  position: "absolute",
  top: "8px",
  right: "40px",
  width: "24px",
  height: "24px",
  borderRadius: "50%",
  backgroundColor: theme.palette?.background.paper,
  color: "#555",
  border: "1px solid rgba(0, 0, 0, 0.1)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
  zIndex: 10,
  "&:hover": {
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
    color: theme.palette?.primary.main,
  },
}));

const HighlightOverlay = styled("div")<{
  changetype?: string;
  haserror?: string;
  isused?: string;
  islastused?: string;
  isfailed?: string;
}>(({ changetype, haserror, isused, islastused, isfailed, theme }) => {
  const isDark = theme.palette.mode === "dark";

  if (isfailed === "true") {
    const failedColor = {
      border: isDark ? "#ef5350" : "#f44336",
      glow: "244, 67, 54",
      bg: "244, 67, 54",
    };

    return {
      position: "absolute",
      top: "-2px",
      left: "-2px",
      right: "-2px",
      bottom: "-2px",
      border: `3px solid ${failedColor.border}`,
      borderRadius: "18px",
      pointerEvents: "none",
      zIndex: 5,
      background: `linear-gradient(135deg, rgba(${failedColor.bg}, 0.12) 0%, rgba(${failedColor.bg}, 0.04) 100%)`,
      boxShadow: `
          0 0 0 1px rgba(${failedColor.glow}, 0.15),
          0 0 20px rgba(${failedColor.glow}, 0.35),
          0 0 40px rgba(${failedColor.glow}, 0.2),
          inset 0 0 30px rgba(${failedColor.glow}, 0.1)
        `,
    };
  }

  if (islastused === "true") {
    const warningColor = {
      border: isDark ? "#ffa726" : "#ff9800",
      glow: "255, 152, 0",
      bg: "255, 152, 0",
    };

    return {
      position: "absolute",
      top: "-2px",
      left: "-2px",
      right: "-2px",
      bottom: "-2px",
      border: `3px solid ${warningColor.border}`,
      borderRadius: "18px",
      pointerEvents: "none",
      zIndex: 5,
      background: `linear-gradient(135deg, rgba(${warningColor.bg}, 0.12) 0%, rgba(${warningColor.bg}, 0.04) 100%)`,
      boxShadow: `
          0 0 0 1px rgba(${warningColor.glow}, 0.15),
          0 0 20px rgba(${warningColor.glow}, 0.35),
          0 0 40px rgba(${warningColor.glow}, 0.2),
          inset 0 0 30px rgba(${warningColor.glow}, 0.1)
        `,
    };
  }

  if (isused === "true") {
    const usedColor = {
      border: isDark ? "#66bb6a" : "#4caf50",
      glow: "76, 175, 80",
      bg: "76, 175, 80",
    };

    return {
      position: "absolute",
      top: "-2px",
      left: "-2px",
      right: "-2px",
      bottom: "-2px",
      border: `2px solid ${usedColor.border}`,
      borderRadius: "18px",
      pointerEvents: "none",
      zIndex: 5,
      background: `linear-gradient(135deg, rgba(${usedColor.bg}, 0.08) 0%, rgba(${usedColor.bg}, 0.04) 100%)`,
      boxShadow: `
          0 0 0 1px rgba(${usedColor.glow}, 0.1),
          0 0 15px rgba(${usedColor.glow}, 0.2),
          inset 0 0 20px rgba(${usedColor.glow}, 0.06)
        `,
    };
  }

  if (haserror === "true") {
    const errorColor = {
      border: isDark ? "#ef5350" : "#f44336",
      glow: "244, 67, 54",
      bg: "244, 67, 54",
    };

    return {
      position: "absolute",
      top: "-2px",
      left: "-2px",
      right: "-2px",
      bottom: "-2px",
      border: `3px solid ${errorColor.border}`,
      borderRadius: "18px",
      pointerEvents: "none",
      zIndex: 5,
      background: `linear-gradient(135deg, rgba(${errorColor.bg}, 0.12) 0%, rgba(${errorColor.bg}, 0.04) 100%)`,
      boxShadow: `
          0 0 0 1px rgba(${errorColor.glow}, 0.15),
          0 0 20px rgba(${errorColor.glow}, 0.35),
          0 0 40px rgba(${errorColor.glow}, 0.2),
          inset 0 0 30px rgba(${errorColor.glow}, 0.1)
        `,
    };
  }

  const colors = {
    added: {
      border: isDark ? "#66bb6a" : "#4caf50",
      glow: isDark ? "76, 175, 80" : "76, 175, 80",
      bg: isDark ? "76, 175, 80" : "76, 175, 80",
    },
    modified: {
      border: isDark ? "#ffa726" : "#ff9800",
      glow: isDark ? "255, 167, 38" : "255, 152, 0",
      bg: isDark ? "255, 167, 38" : "255, 152, 0",
    },
    removed: {
      border: isDark ? "#ef5350" : "#f44336",
      glow: isDark ? "239, 83, 80" : "244, 67, 54",
      bg: isDark ? "239, 83, 80" : "244, 67, 54",
    },
  };

  const config = colors[changetype];
  if (!config) return { display: "none" };

  return {
    position: "absolute",
    top: "-2px",
    left: "-2px",
    right: "-2px",
    bottom: "-2px",
    border: `3px solid ${config.border}`,
    borderRadius: "18px",
    pointerEvents: "none",
    zIndex: 5,
    background: `linear-gradient(135deg, rgba(${config.bg}, 0.08) 0%, rgba(${config.bg}, 0.02) 100%)`,
    boxShadow: `
        0 0 0 1px rgba(${config.glow}, 0.1),
        0 0 20px rgba(${config.glow}, 0.25),
        0 0 40px rgba(${config.glow}, 0.15),
        inset 0 0 30px rgba(${config.glow}, 0.08)
      `,
  };
});

const ChangeBadge = styled("div")<{ changetype?: string }>(
  ({ changetype, theme }) => {
    const isDark = theme.palette.mode === "dark";

    const colors = {
      added: {
        bg: isDark ? "#66bb6a" : "#4caf50",
        text: "#ffffff",
        icon: "+",
      },
      modified: {
        bg: isDark ? "#ffa726" : "#ff9800",
        text: "#ffffff",
        icon: "~",
      },
      removed: {
        bg: isDark ? "#ef5350" : "#f44336",
        text: "#ffffff",
        icon: "×",
      },
    };

    const config = colors[changetype];
    if (!config) return { display: "none" };

    return {
      position: "absolute",
      top: "-10px",
      right: "-10px",
      width: "28px",
      height: "28px",
      borderRadius: "50%",
      backgroundColor: config.bg,
      color: config.text,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "16px",
      fontWeight: "bold",
      boxShadow: `
        0 2px 8px rgba(0, 0, 0, 0.2),
        0 0 0 3px ${theme.palette.background.paper}
      `,
      zIndex: 15,
      "&::before": {
        content: `"${config.icon}"`,
      },
    };
  }
);

const ChangeLabel = styled("div")<{ changetype?: string }>(
  ({ changetype, theme }) => {
    const isDark = theme.palette.mode === "dark";

    const colors = {
      added: {
        bg: isDark ? "#66bb6a" : "#4caf50",
        text: "#ffffff",
        label: "Added",
      },
      modified: {
        bg: isDark ? "#ffa726" : "#ff9800",
        text: "#ffffff",
        label: "Modified",
      },
      removed: {
        bg: isDark ? "#ef5350" : "#f44336",
        text: "#ffffff",
        label: "Removed",
      },
    };

    const config = colors[changetype];
    if (!config) return { display: "none" };

    return {
      position: "absolute",
      top: "-10px",
      left: "-10px",
      padding: "4px 10px",
      borderRadius: "12px",
      backgroundColor: config.bg,
      color: config.text,
      fontSize: "11px",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      boxShadow: `
        0 2px 6px rgba(0, 0, 0, 0.15),
        0 0 0 2px ${theme.palette.background.paper}
      `,
      zIndex: 15,
      whiteSpace: "nowrap",
      "&::before": {
        content: `"${config.label}"`,
      },
    };
  }
);

const ErrorBadge = styled("div")(({ theme }) => {
  const isDark = theme.palette.mode === "dark";

  return {
    position: "absolute",
    top: "-10px",
    right: "-10px",
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    backgroundColor: isDark ? "#ef5350" : "#f44336",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    fontWeight: "bold",
    boxShadow: `
      0 2px 8px rgba(0, 0, 0, 0.2),
      0 0 0 3px ${theme.palette.background.paper}
    `,
    zIndex: 15,
    "&::before": {
      content: '"!"',
    },
  };
});

const UsedBadge = styled("div")(({ theme }) => {
  const isDark = theme.palette.mode === "dark";

  return {
    position: "absolute",
    top: "-10px",
    right: "-10px",
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    backgroundColor: isDark ? "#66bb6a" : "#4caf50",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    fontWeight: "bold",
    boxShadow: `
      0 2px 8px rgba(0, 0, 0, 0.2),
      0 0 0 3px ${theme.palette.background.paper}
    `,
    zIndex: 15,
    "&::before": {
      content: '"✓"',
    },
  };
});

const UsedLabel = styled("div")(({ theme }) => {
  const isDark = theme.palette.mode === "dark";

  return {
    position: "absolute",
    top: "-10px",
    left: "-10px",
    padding: "4px 10px",
    borderRadius: "12px",
    backgroundColor: isDark ? "#66bb6a" : "#4caf50",
    color: "#ffffff",
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    boxShadow: `
      0 2px 6px rgba(0, 0, 0, 0.15),
      0 0 0 2px ${theme.palette.background.paper}
    `,
    zIndex: 15,
    whiteSpace: "nowrap",
    "&::before": {
      content: '"Completed"',
    },
  };
});

const ErrorLabel = styled("div")(({ theme }) => {
  const isDark = theme.palette.mode === "dark";

  return {
    position: "absolute",
    top: "-10px",
    left: "-10px",
    padding: "4px 10px",
    borderRadius: "12px",
    backgroundColor: isDark ? "#ef5350" : "#f44336",
    color: "#ffffff",
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    boxShadow: `
      0 2px 6px rgba(0, 0, 0, 0.15),
      0 0 0 2px ${theme.palette.background.paper}
    `,
    zIndex: 15,
    whiteSpace: "nowrap",
    "&::before": {
      content: '"Error"',
    },
  };
});

const FailedLabel = styled("div")(({ theme }) => {
  const isDark = theme.palette.mode === "dark";

  return {
    position: "absolute",
    top: "-10px",
    left: "-10px",
    padding: "4px 10px",
    borderRadius: "12px",
    backgroundColor: isDark ? "#ef5350" : "#f44336",
    color: "#ffffff",
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    boxShadow: `
      0 2px 6px rgba(0, 0, 0, 0.15),
      0 0 0 2px ${theme.palette.background.paper}
    `,
    zIndex: 15,
    whiteSpace: "nowrap",
    "&::before": {
      content: '"Failed"',
    },
  };
});

const FailedBadge = styled("div")(({ theme }) => {
  const isDark = theme.palette.mode === "dark";

  return {
    position: "absolute",
    top: "-10px",
    right: "-10px",
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    backgroundColor: isDark ? "#ef5350" : "#f44336",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    fontWeight: "bold",
    boxShadow: `
      0 2px 8px rgba(0, 0, 0, 0.2),
      0 0 0 3px ${theme.palette.background.paper}
    `,
    zIndex: 15,
    "&::before": {
      content: '"✕"',
    },
  };
});

const SuperviseNeededLabel = styled("div")(({ theme }) => {
  const isDark = theme.palette.mode === "dark";

  return {
    position: "absolute",
    top: "-10px",
    left: "-10px",
    padding: "4px 10px",
    borderRadius: "12px",
    backgroundColor: isDark ? "#ffa726" : "#ff9800",
    color: "#ffffff",
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    boxShadow: `
      0 2px 6px rgba(0, 0, 0, 0.15),
      0 0 0 2px ${theme.palette.background.paper}
    `,
    zIndex: 15,
    whiteSpace: "nowrap",
    "&::before": {
      content: '"Supervise Needed"',
    },
  };
});

const SuperviseNeededBadge = styled("div")(({ theme }) => {
  const isDark = theme.palette.mode === "dark";

  return {
    position: "absolute",
    top: "-10px",
    right: "-10px",
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    backgroundColor: isDark ? "#ffa726" : "#ff9800",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    fontWeight: "bold",
    boxShadow: `
      0 2px 8px rgba(0, 0, 0, 0.2),
      0 0 0 3px ${theme.palette.background.paper}
    `,
    zIndex: 15,
    "&::before": {
      content: '"⚠"',
    },
  };
});

const FORCE_COLOR = "#b8860b";

const ForceBadge = styled("div")(({ theme }) => ({
  position: "absolute",
  top: "-13px",
  left: "50%",
  transform: "translateX(-50%)",
  display: "inline-flex",
  alignItems: "center",
  gap: 3,
  padding: "2px 8px 2px 6px",
  borderRadius: 999,
  fontSize: 10,
  fontWeight: 700,
  lineHeight: 1.6,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
  color: FORCE_COLOR,
  background: theme.palette.background.paper,
  border: `1px solid ${FORCE_COLOR}`,
  boxShadow: "0 1px 4px rgba(0, 0, 0, 0.18)",
  pointerEvents: "none",
  zIndex: 6,
}));

const NodeWrapper = styled("div", {
  shouldForwardProp: (prop) => prop !== "isforce",
})<{ isforce?: boolean }>(({ isforce }) => {
  const stepColor = isforce ? FORCE_COLOR : "#174f77";
  const steppedShadow = `
    1px 1px 0 ${stepColor},
    2px 2px 0 ${stepColor},
    3px 3px 0 ${stepColor},
    4px 4px 0 ${stepColor},
    5px 5px 0 ${stepColor},
    6px 6px 0 ${stepColor},
    7px 7px 0 ${stepColor},
    10px 10px 20px rgba(0, 0, 0, 0.4),
    20px 20px 40px rgba(0, 0, 0, 0.5)
  `;

  return {
    position: "relative",
    width: "100%",
    height: "100%",
    borderRadius: "16px",
    transformStyle: "preserve-3d",
    transform: "perspective(1500px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)",
    boxShadow: steppedShadow,
    transition:
      "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease, filter 0.25s ease",
    "&:hover": {
      transform:
        "perspective(1500px) rotateX(0deg) rotateY(-10deg) rotateZ(0deg)",
      filter: "brightness(1.070)",
      boxShadow: steppedShadow,
    },
  };
});

export const blueprintFlowPlugin = {
  id: "blueprintChart",

  style: ({ style }) => {
    const styleTokens = style || {};

    const bgFrom = undefined;
    const bgTo = undefined;
    const borderColor = "linear-gradient(135deg, #c684ff33, #078dee4d)";
    const borderRadius = 16;
    const shadowLevel = 1;
    const minWidth = 420;
    const maxWidth = 420;
    const minHeight = 210;
    const maxHeight = 210;
    const shape = 16;
    const endGap = -5;
    const startGap = 3;

    return {
      ...styleTokens,
      bgFrom,
      bgTo,
      borderColor,
      shadowLevel,
      minWidth,
      maxWidth,
      minHeight,
      maxHeight,
      shape,
      borderRadius,
      gap: styleTokens.gap ?? 6,
      levelGap: styleTokens.levelGap ?? 15,
      startGap,
      endGap,
    };
  },

  edge: ({ node, child }) => {
    if (node?.connectorType === "decision" && child) {
      const trueNext = node?.trueNext || [];
      const falseNext = node?.falseNext || [];

      if (trueNext.includes(child.id)) {
        return {
          label: "true",
          labelStyle: {
            fontSize: "12px",
            fontWeight: 600,
            color: "#4b4e4c",
            textColor: "#2e914f",
          },
          labelPosition: 0.4,
          labelOffsetX: 10,
          labelOffsetY: -20,
        };
      }

      if (falseNext.includes(child.id)) {
        return {
          label: "false",
          labelStyle: {
            fontSize: "12px",
            fontWeight: 600,
            color: "#4b4e4c",
            textColor: "#d32f2f",
          },
          labelPosition: 0.4,
          labelOffsetX: 10,
          labelOffsetY: 20,
        };
      }
    }

    return {};
  },

  node: (props) => <FlowNodeRenderer {...props} />,
};

type FlowGraphNode = import("./helper").DefinitionGraphNode & {
  changeType?: string;
  hasError?: boolean;
  isUsed?: boolean;
  isLastUsed?: boolean;
  isFailed?: boolean;
  [key: string]: unknown;
};

export type NodeFields = { inputs: string[]; outputs: string[] };

const FieldsPanel = styled("div")(({ theme }) => ({
  position: "absolute",
  top: "calc(100% + 10px)",
  left: 0,
  width: "100%",
  minWidth: 260,
  display: "flex",
  gap: 10,
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

const FieldColumn = styled("div")<{ align: "left" | "right" }>(
  ({ align, theme }) => ({
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 2,
    ...(align === "right" && {
      paddingLeft: 10,
      borderLeft: `1px solid ${theme.palette.divider}`,
    }),
  })
);

const ColumnLabel = styled("div")<{ align: "left" | "right" }>(
  ({ align, theme }) => ({
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
  })
);

const FieldRow = styled("div")<{ align: "left" | "right" }>(
  ({ align, theme }) => ({
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "3px 4px",
    borderRadius: 6,
    flexDirection: align === "right" ? "row-reverse" : "row",
    transition: "background-color 0.15s ease",
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
  })
);

const Dot = styled("div")<{
  variant: "in" | "out";
  bound?: string;
  interactive?: string;
}>(({ variant, bound, interactive, theme }) => {
  const isBound = bound === "true";
  const disabled = interactive === "false";
  const accent =
    variant === "out"
      ? theme.palette.secondary.main
      : theme.palette.primary.main;

  return {
    position: "relative",
    flexShrink: 0,
    boxSizing: "content-box",
    width: 9,
    height: 9,
    borderRadius: "50%",
    background: isBound ? accent : theme.palette.background.paper,
    border: `2px solid ${isBound ? accent : theme.palette.grey[400]}`,
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    cursor: disabled ? "default" : "crosshair",
    opacity: disabled ? 0.35 : 1,
    pointerEvents: "auto",
    transition:
      "transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease",
    ...(!disabled && {
      "&:hover": {
        transform: "scale(1.35)",
        borderColor: accent,
        boxShadow: `0 0 0 2px ${
          theme.palette.background.paper
        }, 0 0 0 5px ${alpha(accent, 0.22)}`,
      },
    }),
  };
});

const FieldLabel = styled("div")<{ align: "left" | "right"; bound?: string }>(
  ({ align, bound, theme }) => ({
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    fontWeight: bound === "true" ? 600 : 400,
    color:
      bound === "true"
        ? theme.palette.text.primary
        : theme.palette.text.secondary,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    textAlign: align,
  })
);

function NodeHandles({
  node,
  fields,
  boundFields,
  hasForceNode,
  onHandleDragStart,
}: {
  node: FlowGraphNode;
  fields: NodeFields;
  boundFields?: Set<string>;
  hasForceNode?: boolean;
  onHandleDragStart?: (
    nodeId: string,
    field: string,
    e: React.MouseEvent
  ) => void;
}) {
  const isForceTarget = Boolean(
    (node.raw?.properties as { force?: boolean } | undefined)?.force
  );

  return (
    <FieldsPanel
      sx={{ mt: -1, ml: 0.6 }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <FieldColumn align="left">
        <ColumnLabel align="left">
          <Iconify icon="mdi:arrow-down-left" width={10} height={10} />
          Inputs
        </ColumnLabel>
        {fields.inputs.length === 0 && (
          <FieldLabel align="left" style={{ opacity: 0.5, padding: "3px 4px" }}>
            —
          </FieldLabel>
        )}
        {fields.inputs.map((field) => {
          const bound = boundFields?.has(field) ? "true" : "false";
          return (
            <FieldRow key={`in-${field}`} align="left">
              <Dot
                variant="in"
                bound={bound}
                interactive={isForceTarget ? "true" : "false"}
                {...(isForceTarget && { "data-handle-type": "in" })}
                data-in-handle=""
                data-node-id={node.id}
                data-field={field}
                {...(isForceTarget && { title: `Input: ${field}` })}
              />
              <FieldLabel align="left" bound={bound} title={field}>
                {field}
              </FieldLabel>
            </FieldRow>
          );
        })}
      </FieldColumn>

      <FieldColumn align="right">
        <ColumnLabel align="right">
          Outputs
          <Iconify icon="mdi:arrow-up-right" width={10} height={10} />
        </ColumnLabel>
        {fields.outputs.map((field) => (
          <FieldRow key={`out-${field}`} align="right">
            <Dot
              variant="out"
              interactive={hasForceNode ? "true" : "false"}
              data-handle-type="out"
              data-node-id={node.id}
              data-field={field}
              {...(hasForceNode && {
                title: `Output: ${field === "result" ? "result (raw)" : field}`,
              })}
              onMouseDown={
                hasForceNode
                  ? (e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onHandleDragStart?.(node.id, field, e);
                    }
                  : undefined
              }
            />
            <FieldLabel align="right" title={field}>
              {field === "result" ? "result" : field}
            </FieldLabel>
          </FieldRow>
        ))}
      </FieldColumn>
    </FieldsPanel>
  );
}

function FlowNodeRenderer({
  node,
  nodeStyle,
}: {
  node: FlowGraphNode;
  nodeStyle?: {
    onAdd?: (node: FlowGraphNode) => void;
    onEdit?: (node: FlowGraphNode) => void;
    onSwapBranch?: (node: FlowGraphNode) => void;
    onDelete?: (node: FlowGraphNode) => void;
    showConnections?: boolean;
    nodeFields?: Record<string, NodeFields>;
    boundFieldsByNode?: Record<string, Set<string>>;
    hasForceNode?: boolean;
    onHandleDragStart?: (
      nodeId: string,
      field: string,
      e: React.MouseEvent
    ) => void;
    onToggleForce?: (node: FlowGraphNode) => void;
    [key: string]: unknown;
  };
}) {
  const {
    onAdd,
    onEdit,
    onSwapBranch,
    onDelete,
    showConnections,
    nodeFields,
    boundFieldsByNode,
    hasForceNode,
    onHandleDragStart,
    onToggleForce,
  } = nodeStyle || {};
  const fields = node.nodeType === "NORMAL" ? nodeFields?.[node.id] : undefined;
  const isForceNode = Boolean(
    (node.raw?.properties as { force?: boolean } | undefined)?.force
  );
  const isReadOnly = !onAdd && !onEdit && !onSwapBranch && !onDelete;
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
  } | null>(null);

  const changeType = node.changeType;
  const hasError = node.hasError;
  const isUsed = node.isUsed;
  const isLastUsed = node.isLastUsed;
  const isFailed = node.isFailed;

  const handleContextMenu = (e: React.MouseEvent) => {
    if (isReadOnly) return;
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ mouseX: e.clientX, mouseY: e.clientY });
  };

  const handleMouseDownCapture = (e: React.MouseEvent) => {
    if (e.button === 2) {
      e.stopPropagation();
    }
  };

  const handleClose = () => setContextMenu(null);

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAdd?.(node);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(node);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(node);
  };

  const handleToggleForceClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleForce?.(node);
  };

  return (
    <NodeWrapper
      isforce={isForceNode}
      title={isForceNode ? "Force node: action is guaranteed" : undefined}
      onContextMenu={handleContextMenu}
      onMouseDownCapture={handleMouseDownCapture}
    >
      {isForceNode && (
        <ForceBadge>
          <Iconify icon="mdi:lightning-bolt" width={11} height={11} />
          force
        </ForceBadge>
      )}
      {showConnections &&
        fields &&
        (fields.inputs.length > 0 || fields.outputs.length > 0) && (
          <NodeHandles
            node={node}
            fields={fields}
            boundFields={boundFieldsByNode?.[node.id]}
            hasForceNode={hasForceNode}
            onHandleDragStart={onHandleDragStart}
          />
        )}
      <HighlightOverlay
        changetype={changeType}
        haserror={hasError ? "true" : "false"}
        isused={isUsed ? "true" : "false"}
        islastused={isLastUsed ? "true" : "false"}
        isfailed={isFailed ? "true" : "false"}
      />
      {hasError ? (
        <>
          <ErrorLabel />
          <ErrorBadge />
        </>
      ) : isFailed ? (
        <>
          <FailedLabel />
          <FailedBadge />
        </>
      ) : isLastUsed ? (
        <>
          <SuperviseNeededLabel />
          <SuperviseNeededBadge />
        </>
      ) : isUsed ? (
        <>
          <UsedLabel />
          <UsedBadge />
        </>
      ) : (
        changeType &&
        changeType !== "unchanged" && (
          <>
            <ChangeLabel changetype={changeType} />
            <ChangeBadge changetype={changeType} />
          </>
        )
      )}
      <InfoNode node={node} nodeStyle={nodeStyle}>
        {!isReadOnly && (
          <>
            <DeleteButtonWrapper
              onClick={handleDeleteClick}
              title="Delete node"
            >
              <Iconify icon="mdi:delete-outline" width={16} height={16} />
            </DeleteButtonWrapper>
            <EditButtonWrapper onClick={handleEditClick} title="Edit node">
              <Iconify icon="mdi:pencil" width={16} height={16} />
            </EditButtonWrapper>
            <AddButtonWrapper onClick={handleAddClick} title="Add child node">
              <Iconify icon="mdi:plus" width={16} height={16} />
            </AddButtonWrapper>
          </>
        )}
      </InfoNode>

      {!isReadOnly && (
        <Menu
          open={contextMenu !== null}
          onClose={handleClose}
          anchorReference="anchorPosition"
          anchorPosition={
            contextMenu !== null
              ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
              : undefined
          }
          sx={{ zIndex: (theme) => theme.zIndex.modal + 3 }}
          slotProps={{ paper: { sx: { minWidth: 180 } } }}
        >
          <MenuItem
            onClick={(e) => {
              handleAddClick(e);
              handleClose();
            }}
          >
            <ListItemIcon>
              <Iconify icon="mdi:plus" width={18} height={18} />
            </ListItemIcon>
            <ListItemText>Add child node</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={(e) => {
              handleEditClick(e);
              handleClose();
            }}
          >
            <ListItemIcon>
              <Iconify icon="mdi:pencil" width={18} height={18} />
            </ListItemIcon>
            <ListItemText>Edit node</ListItemText>
          </MenuItem>
          {onToggleForce && (
            <MenuItem
              onClick={(e) => {
                handleToggleForceClick(e);
                handleClose();
              }}
            >
              <ListItemIcon>
                <Iconify
                  icon={
                    isForceNode
                      ? "mdi:lightning-bolt"
                      : "mdi:lightning-bolt-outline"
                  }
                  width={18}
                  height={18}
                />
              </ListItemIcon>
              <ListItemText>
                {isForceNode ? "Unmark force node" : "Mark as force node"}
              </ListItemText>
            </MenuItem>
          )}
          <Divider />
          <MenuItem
            onClick={(e) => {
              handleDeleteClick(e);
              handleClose();
            }}
            sx={{ color: "error.main" }}
          >
            <ListItemIcon sx={{ color: "error.main" }}>
              <Iconify icon="mdi:delete-outline" width={18} height={18} />
            </ListItemIcon>
            <ListItemText>Delete node</ListItemText>
          </MenuItem>
        </Menu>
      )}
    </NodeWrapper>
  );
}
