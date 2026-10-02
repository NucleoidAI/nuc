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
  verticalGap?: number;
  minHeight?: number | string;
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
    verticalGap = 20,
    minHeight = "55vh",
    colorMap,
    containerProps,
    showRightIcons = true,
    showLeftIcons = true,
    blueprintIcon = DEFAULT_BLUEPRINT_ICON,
    renderChannelNode,
    renderBlueprintNode,
  } = props;

  const theme = useTheme();

  const leftChannels = useMemo(
    () =>
      (channels || []).filter((node) =>
        (connections || []).some((c) => c.left === node.id)
      ),
    [channels, connections]
  );

  const rightBlueprints = useMemo(
    () =>
      (Blueprints || []).filter((resp) =>
        (connections || []).some((c) => c.right === resp.id)
      ),
    [Blueprints, connections]
  );

  const maxCount = Math.max(leftChannels.length, rightBlueprints.length);
  const containerHeight = Math.max(
    maxCount * nodeHeight + Math.max(maxCount - 1, 0) * verticalGap,
    0
  );

  const columnOffset = (count: number) =>
    ((maxCount - count) * (nodeHeight + verticalGap)) / 2;

  const positionsLeft = useMemo(
    () =>
      leftChannels.map((node, idx) => ({
        ...node,
        x: leftX,
        y: columnOffset(leftChannels.length) + idx * (nodeHeight + verticalGap),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [leftChannels, leftX, nodeHeight, verticalGap, maxCount]
  );

  const rightNodes = useMemo(
    () =>
      rightBlueprints.map((resp, idx) => ({
        ...resp,
        id: resp.id,
        icon: resp.icon || blueprintIcon,
        x: leftX + horizontalGap,
        y:
          columnOffset(rightBlueprints.length) +
          idx * (nodeHeight + verticalGap),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      rightBlueprints,
      leftX,
      horizontalGap,
      nodeHeight,
      verticalGap,
      maxCount,
      blueprintIcon,
    ]
  );

  const isEmpty = !connections || connections.length === 0;

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
    <Container maxWidth="md" sx={{ height: "100%" }} {...containerProps}>
      <Box
        minHeight={minHeight}
        height="100%"
        display="flex"
        alignItems="flex-start"
        justifyContent="center"
      >
        <Box
          position="relative"
          width={isEmpty ? "100%" : leftX + horizontalGap + nodeWidth}
          height={isEmpty ? "auto" : containerHeight}
          flexShrink={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
          sx={{ my: "auto" }}
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
                        fill={
                          colorMap[node.type] || theme.palette.text.secondary
                        }
                      />
                    </marker>
                  ))}
                </defs>
                {renderEdges()}
              </svg>
            </>
          )}
        </Box>
      </Box>
    </Container>
  );
}

export default CommunicationDiagram;
