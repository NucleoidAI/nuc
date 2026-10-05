import NodeInputOverride from "./NodeInputOverride";
import { styled } from "@mui/material/styles";

import {
  ConnectionsPanel,
  Iconify,
  InfoNode,
  handleDataAttrs,
} from "@canmingir/link/platform/components";
import {
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material";
import React, { useState } from "react";

const FORCE_COLOR = "#b8860b";
const SWITCH_BORDER_COLOR = "linear-gradient(135deg, #7c5cff66, #00c2ff59)";
const SWITCH_BG_FROM = "rgba(124, 92, 255, 0.20)";
const SWITCH_BG_TO = "rgba(0, 194, 255, 0.26)";
export const APPROVAL_BORDER_COLOR =
  "linear-gradient(135deg, #fde04766, #ca8a0459)";
export const APPROVAL_BORDER_SOLID = "#ca8a04";
export const APPROVAL_BG_FROM = "rgba(199, 176, 59, 0.4)";
export const APPROVAL_BG_TO = "rgba(202, 138, 4, 0.50)";

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

const ForceIndicatorWrapper = styled("div", {
  shouldForwardProp: (prop) => prop !== "readonly",
})<{ readonly?: boolean }>(({ theme, readonly }) => ({
  position: "absolute",
  top: "8px",
  right: readonly ? "8px" : "72px",
  width: "24px",
  height: "24px",
  borderRadius: "50%",
  backgroundColor: theme.palette?.background?.paper || "#fff",
  color: FORCE_COLOR,
  border: `1px solid ${FORCE_COLOR}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
  zIndex: 10,
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
  shouldForwardProp: (prop) => prop !== "isApproval",
})<{ isApproval?: boolean }>(({ isApproval }) => {
  const stepColor = isApproval ? "#6b5709" : "#174f77";
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

  style: ({ node, style }) => {
    const styleTokens = style || {};
    const isApproval =
      node?.nodeType === "APPROVAL" || node?.action === "PLATFORM:two_factor";
    const isSwitch = node?.nodeType === "SWITCH";

    const bgFrom = isApproval
      ? APPROVAL_BG_FROM
      : isSwitch
      ? SWITCH_BG_FROM
      : undefined;
    const bgTo = isApproval
      ? APPROVAL_BG_TO
      : isSwitch
      ? SWITCH_BG_TO
      : undefined;
    const borderColor = isApproval
      ? APPROVAL_BORDER_COLOR
      : isSwitch
      ? SWITCH_BORDER_COLOR
      : "linear-gradient(135deg, #c684ff33, #078dee4d)";
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
      nodeHeight: maxHeight,
      layoutExtraSpacing: styleTokens.showConnections
        ? maxConnectionsPanelPixelHeight(
            styleTokens.nodeFields as Record<string, NodeFields> | undefined
          )
        : 0,
    };
  },

  edge: ({ node, child }) => {
    if (node?.nodeType === "SWITCH" && child) {
      const label = (node?.cases || []).find(
        (switchCase) => switchCase.nodeId === child.id
      )?.label;

      if (label) {
        return {
          label,
          labelStyle: {
            fontSize: "12px",
            fontWeight: 600,
            color: "#4b4e4c",
            textColor: "#5b3fd9",
          },
          labelPosition: 0.4,
          labelOffsetX: 10,
          labelOffsetY: -14,
        };
      }

      return {};
    }

    if (node?.connectorType === "decision" && child) {
      const trueNext = node?.trueNext || [];
      const falseNext = node?.falseNext || [];
      const isApproval = node?.nodeType === "APPROVAL";

      if (trueNext.includes(child.id)) {
        return {
          label: isApproval ? "approved" : "true",
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
          label: isApproval ? "rejected" : "false",
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

export type NodeFields = {
  inputs: string[];
  outputs: string[];
  inputProperties?: Record<
    string,
    { type: string; description?: string; nullable?: boolean }
  >;
};

const FIELDS_PANEL_ROW_HEIGHT = 21;
const FIELDS_PANEL_ROW_GAP = 2;
const FIELDS_PANEL_CHROME = 20 + 16 + 2;

function connectionsPanelPixelHeight(fields?: NodeFields) {
  if (!fields) return 0;
  const rows = Math.max(fields.inputs.length, fields.outputs.length);
  if (rows === 0) return 0;
  return (
    rows * FIELDS_PANEL_ROW_HEIGHT +
    (rows - 1) * FIELDS_PANEL_ROW_GAP +
    FIELDS_PANEL_CHROME
  );
}

function maxConnectionsPanelPixelHeight(
  nodeFields?: Record<string, NodeFields>
) {
  return Math.max(
    0,
    ...Object.values(nodeFields ?? {}).map(connectionsPanelPixelHeight)
  );
}

function NodeHandles({
  node,
  fields,
  boundFields,
  hasForceNode,
  onHandleDragStart,
  onOverrideParameter,
}: {
  node: FlowGraphNode;
  fields: NodeFields;
  boundFields?: Set<string>;
  hasForceNode?: boolean;
  onOverrideParameter?: (nodeId: string, field: string, value: unknown) => void;
  onHandleDragStart?: (
    nodeId: string,
    field: string,
    e: React.MouseEvent
  ) => void;
}) {
  const isForceTarget = Boolean(
    (node.raw?.properties as { force?: boolean } | undefined)?.force
  );

  const inputs = fields.inputs.map((field) => ({
    name: field,
    bound: boundFields?.has(field) ?? false,
    interactive: isForceTarget,
    title: isForceTarget ? `Input: ${field}` : undefined,
    dataAttrs: {
      ...handleDataAttrs("in", node.id, field),
      "data-in-handle": "",
      ...(isForceTarget ? { "data-in-bindable": "" } : {}),
    },
  }));

  const outputs = fields.outputs.map((field) => ({
    name: field,
    interactive: Boolean(hasForceNode),
    title: hasForceNode
      ? `Output: ${field === "result" ? "result (raw)" : field}`
      : undefined,
    dataAttrs: handleDataAttrs("out", node.id, field),
    onHandleMouseDown: hasForceNode
      ? (e: React.MouseEvent) => {
          e.stopPropagation();
          e.preventDefault();
          onHandleDragStart?.(node.id, field, e);
        }
      : undefined,
  }));

  const renderLabel = (name: string, side: "in" | "out") => {
    if (side !== "in" || !onOverrideParameter) return name;

    const schema = fields.inputProperties?.[name];
    if (!schema) return name;

    return (
      <NodeInputOverride
        field={name}
        schema={schema}
        parameters={node.raw?.properties?.parameters ?? {}}
        onChange={(value) => onOverrideParameter(node.id, name, value)}
      />
    );
  };

  return (
    <ConnectionsPanel
      inputs={inputs}
      outputs={outputs}
      renderLabel={renderLabel}
      sx={{ mt: -1, ml: 0.6 }}
    />
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
    onOverrideParameter?: (
      nodeId: string,
      field: string,
      value: unknown
    ) => void;
    liteMode?: boolean;
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
    onOverrideParameter,
    liteMode,
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
      isApproval={node.nodeType === "APPROVAL"}
      title={isForceNode ? "Force node: action is guaranteed" : undefined}
      onContextMenu={handleContextMenu}
      onMouseDownCapture={handleMouseDownCapture}
    >
      {isForceNode && isReadOnly && (
        <ForceIndicatorWrapper
          readonly
          title="Force node: action is guaranteed"
        >
          <Iconify icon="mdi:lightning-bolt" width={16} height={16} />
        </ForceIndicatorWrapper>
      )}
      {isForceNode && !liteMode && changeType && changeType !== "unchanged" && (
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
            onOverrideParameter={isReadOnly ? undefined : onOverrideParameter}
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
            {isForceNode && (
              <ForceIndicatorWrapper title="Force node: action is guaranteed">
                <Iconify icon="mdi:lightning-bolt" width={16} height={16} />
              </ForceIndicatorWrapper>
            )}
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
