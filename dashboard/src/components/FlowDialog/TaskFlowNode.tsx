import React from "react";
import { Tooltip } from "@mui/material";
import { styled } from "@mui/material/styles";

import {
  ConnectionsPanel,
  InfoNode,
  handleDataAttrs,
} from "@canmingir/link/platform/components";
import { StepField, getStatusConfig } from "./util";

type StatusColor = ReturnType<typeof getStatusConfig>["color"];

const NodeWrapper = styled("div")(() => {
  const stepColor = "rgb(54, 54, 54)";
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
    display: "inline-flex",
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

const StatusBadge = styled("div", {
  shouldForwardProp: (prop) => prop !== "$color",
})<{ $color: StatusColor }>(({ theme, $color }) => ({
  position: "absolute",
  top: -10,
  right: 0,
  padding: "4px 10px",
  borderRadius: 12,
  backgroundColor: theme.palette[$color].main,
  color: theme.palette.common.white,
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  whiteSpace: "nowrap",
  zIndex: 15,
}));

const TaskFlowNode = ({
  nodeId,
  action,
  rawAction,
  description,
  status,
  tooltip,
  icon,
  inputs = [],
  outputs = [],
  boundInputs = new Set<string>(),
  hiddenFields = new Set<string>(),
  showConnections = false,
  onFieldHover,
  onClick,
}: {
  nodeId: string;
  action: string;
  rawAction?: string;
  description?: string;
  status?: string;
  tooltip?: string;
  icon: string;
  inputs?: StepField[];
  outputs?: StepField[];
  boundInputs?: Set<string>;
  hiddenFields?: Set<string>;
  showConnections?: boolean;
  onFieldHover?: (field: string | null) => void;
  onClick?: () => void;
}) => {
  const { label: statusLabel, color } = getStatusConfig(status);

  const hasFields = inputs.length > 0 || outputs.length > 0;

  const card = (
    <NodeWrapper
      className="anim-hover-tilt"
      onClick={onClick}
      sx={onClick ? { cursor: "pointer" } : undefined}
    >
      <StatusBadge $color={color}>{statusLabel}</StatusBadge>

      {showConnections && hasFields && (
        <ConnectionsPanel
          inputs={inputs.map((field) => ({
            name: field.name,
            bound: boundInputs.has(field.name),
            interactive: hiddenFields.has(field.name),
            dataAttrs: {
              ...handleDataAttrs("in", nodeId, field.name),
              ...(hiddenFields.has(field.name)
                ? {
                    onMouseEnter: () => onFieldHover?.(field.name),
                    onMouseLeave: () => onFieldHover?.(null),
                  }
                : {}),
            } as Record<string, string>,
          }))}
          outputs={outputs.map((field) => ({
            name: field.name,
            interactive: hiddenFields.has(field.name),
            dataAttrs: {
              ...handleDataAttrs("out", nodeId, field.name),
              ...(hiddenFields.has(field.name)
                ? {
                    onMouseEnter: () => onFieldHover?.(field.name),
                    onMouseLeave: () => onFieldHover?.(null),
                  }
                : {}),
            } as Record<string, string>,
          }))}
          sx={{
            top: 203,
            left: 5,
          }}
        />
      )}

      <InfoNode
        node={{
          id: nodeId,
          label: action,
          action: rawAction || action,
          description: description || "No details recorded for this step.",
          icon,
        }}
        nodeStyle={{
          minWidth: 420,
          maxWidth: 420,
          minHeight: 200,
          maxHeight: 200,
          borderColor: "rgba(145, 142, 142, 0.2)",
          bgFrom: "rgba(163, 160, 160, 0.2)",
          bgTo: "rgba(163, 160, 160, 0.3)",
        }}
      />
    </NodeWrapper>
  );

  if (!tooltip) return card;

  return (
    <Tooltip title={tooltip} placement="right">
      {card}
    </Tooltip>
  );
};

export default TaskFlowNode;
