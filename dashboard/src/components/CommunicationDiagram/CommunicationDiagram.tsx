import DiagramNodeCard from "./DiagramNodeCard";

import { Box, Container, Typography, useTheme } from "@mui/material";
import React, { useMemo } from "react";

const DEFAULT_BLUEPRINT_ICON =
  "healthicons:crisis-response-center-person-outline";

function CommunicationDiagram(props: {
  channels?: {
    id: string;
    type?: string;
    name?: string;
    label?: string;
    code?: string;
    icon?: string;
  }[];
  Blueprints?: { id: string; title?: string; icon?: string }[];
  connections?: { left: string; right: string }[];
  colorMap: Record<string, string>;
  nodeWidth?: number;
  nodeHeight?: number;
  leftX?: number;
  horizontalGap?: number;
  initialTop?: number;
  verticalGap?: number;
  containerProps?: React.ComponentProps<typeof Container>;
  showRightIcons?: boolean;
  showLeftIcons?: boolean;
  blueprintIcon?: string;
  renderChannelNode?: (node: Record<string, unknown>) => React.ReactNode;
  renderBlueprintNode?: (node: Record<string, unknown>) => React.ReactNode;
}) {
  const {
    channels,
    Blueprints,
    connections,
    nodeWidth = 300,
    nodeHeight = 120,
    leftX = 0,
    horizontalGap = 500,
    initialTop = 20,
    verticalGap = 20,
    colorMap,
    containerProps,
    showRightIcons = true,
    showLeftIcons = true,
    blueprintIcon = DEFAULT_BLUEPRINT_ICON,
    renderChannelNode,
    renderBlueprintNode,
  } = props;

  const theme = useTheme();

  const positionsLeft = useMemo(
    () =>
      (channels || [])
        .filter((node) => (connections || []).some((c) => c.left === node.id))
        .map((node, idx) => ({
          ...node,
          x: leftX,
          y: initialTop + idx * (nodeHeight + verticalGap),
        })),
    [channels, connections, leftX, initialTop, nodeHeight, verticalGap]
  );

  const rightNodes = useMemo(
    () =>
      (Blueprints || [])
        .filter((resp) => (connections || []).some((c) => c.right === resp.id))
        .map((resp, idx) => ({
          ...resp,
          id: resp.id,
          icon: resp.icon || blueprintIcon,
          x: leftX + horizontalGap,
          y: initialTop + idx * (nodeHeight + verticalGap),
        })),
    [
      Blueprints,
      connections,
      leftX,
      horizontalGap,
      initialTop,
      nodeHeight,
      verticalGap,
      blueprintIcon,
    ]
  );

  const isEmpty = !connections || connections.length === 0;
  const maxCount = Math.max(positionsLeft.length, rightNodes.length);
  const containerHeight = initialTop + maxCount * (nodeHeight + verticalGap);

  const renderEdges = () =>
    (connections || []).map(({ left, right }) => {
      const leftNode = positionsLeft.find((n) => n.id === left);
      const rightNode = rightNodes.find((n) => n.id === right);
      if (!leftNode || !rightNode) return null;

      const group = (connections || []).filter((c) => c.right === right);
      const index = group.findIndex(
        (c) => c.left === left && c.right === right
      );
      const offsetSpacing = verticalGap;
      const x1 = leftNode.x + nodeWidth;
      const y1 = leftNode.y + nodeHeight / 2;
      const baseY2 = rightNode.y + nodeHeight / 2;
      const y2 = baseY2 + (index - (group.length - 1) / 2) * offsetSpacing;
      const x2 = rightNode.x;
      const dx = (x2 - x1) / 2;
      const path = `M${x1},${y1} C${x1 + dx},${y1} ${
        x2 - dx
      },${y2} ${x2},${y2}`;
      const strokeColor =
        colorMap[leftNode.type] || theme.palette.text.secondary;
      return (
        <path
          key={`${left}-${right}`}
          d={path}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          markerEnd={`url(#arrow-${left})`}
        />
      );
    });

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }} {...containerProps}>
      <Box
        position="relative"
        width={isEmpty ? "100%" : leftX + horizontalGap + nodeWidth}
        height={isEmpty ? "60vh" : containerHeight}
        mx="auto"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        {isEmpty ? (
          <Typography variant="h6" color="textSecondary" textAlign="center">
            No communication connections available
          </Typography>
        ) : (
          <>
            {positionsLeft.map((node) => {
              if (renderChannelNode) return renderChannelNode(node);

              return (
                <DiagramNodeCard
                  key={node.id}
                  node={node}
                  width={nodeWidth}
                  height={nodeHeight}
                  title={node.name || node.label}
                  subtitle={node.code || node.type}
                  showIcon={showLeftIcons}
                />
              );
            })}

            {rightNodes.map((node) => {
              if (renderBlueprintNode) return renderBlueprintNode(node);

              return (
                <DiagramNodeCard
                  key={node.id}
                  node={node}
                  width={nodeWidth}
                  height={nodeHeight}
                  title={node.title}
                  subtitle="Blueprint"
                  showIcon={showRightIcons}
                />
              );
            })}

            <svg
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
              }}
            >
              <defs>
                {positionsLeft.map((node) => (
                  <marker
                    key={node.id}
                    id={`arrow-${node.id}`}
                    markerWidth="6"
                    markerHeight="6"
                    refX="4.5"
                    refY="3"
                    orient="auto"
                  >
                    <path
                      d="M0,0 L0,6 L6,3 Z"
                      fill={colorMap[node.type] || theme.palette.text.secondary}
                    />
                  </marker>
                ))}
              </defs>
              {renderEdges()}
            </svg>
          </>
        )}
      </Box>
    </Container>
  );
}

export default CommunicationDiagram;
