import type { RawNode } from "../BlueprintFlow/miniTypes";
import useBlueprint from "../../hooks/useBlueprint";
import { useMemo } from "react";

import {
  APPROVAL_BG_FROM,
  APPROVAL_BG_TO,
  APPROVAL_BORDER_SOLID,
} from "../BlueprintFlow/BlueprintFlowPlugin";
import { Box, Skeleton, Typography } from "@mui/material";
import {
  FlowSvgContent,
  layoutFlow,
} from "@canmingir/link/platform/components";
import { alpha, useTheme } from "@mui/material/styles";

export type { RawNode };

const START_NODE_ID = "__start__";

function withStartNode(nodes: RawNode[]): RawNode[] {
  const referenced = new Set<string>();
  nodes.forEach((n) => {
    (n.next || []).forEach((id) => referenced.add(id));
    (n.true || []).forEach((id) => referenced.add(id));
    (n.false || []).forEach((id) => referenced.add(id));
  });

  const rootIds = nodes.filter((n) => !referenced.has(n.id)).map((n) => n.id);
  if (!rootIds.length || rootIds.some((id) => id === START_NODE_ID))
    return nodes;

  const hasApiStartNode = rootIds.some((id) => {
    const root = nodes.find((n) => n.id === id);
    return root?.type === "START";
  });
  if (hasApiStartNode) return nodes;

  const startNode: RawNode = {
    id: START_NODE_ID,
    type: "START",
    properties: { label: "Start", icon: "mdi:play" },
    next: rootIds,
  };

  return [startNode, ...nodes];
}

export function BlueprintFlowMiniPreview({
  blueprintId,
}: {
  blueprintId: string;
}) {
  const theme = useTheme();
  const { getBlueprintWithNode } = useBlueprint();
  const { blueprintNodes, loading } = getBlueprintWithNode(blueprintId);

  const nodes: RawNode[] = useMemo(() => {
    const rawNodes = blueprintNodes?.nodes;
    if (!rawNodes?.length) return [];
    return withStartNode(rawNodes);
  }, [blueprintNodes]);

  const { positions, edgeList, svgW, svgH } = useMemo(() => {
    if (!nodes.length) return { positions: {}, edgeList: [], svgW: 0, svgH: 0 };
    return layoutFlow(nodes);
  }, [nodes]);

  if (loading) {
    return (
      <Skeleton
        variant="rectangular"
        height={240}
        sx={{ borderRadius: "8px" }}
      />
    );
  }

  const dotColor = alpha(theme.palette.divider, 0.08);

  const miniMapStyle = (node: {
    type?: string;
    properties?: { action?: string };
  }) => {
    const isDarkGradient =
      node?.type === "DECISION" ||
      node?.type === "SWITCH" ||
      node?.type === "START" ||
      node?.type === "END" ||
      node?.properties?.action === "PLATFORM:complete";
    if (!isDarkGradient) return {};
    return {
      gradient: { from: APPROVAL_BG_FROM, to: APPROVAL_BG_TO },
      borderColor: APPROVAL_BORDER_SOLID,
    };
  };

  if (!nodes.length) {
    return (
      <Box
        sx={{
          height: 240,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
          backgroundImage: `radial-gradient(${dotColor} 1px, transparent 1px)`,
          backgroundSize: "16px 16px",
          borderRadius: "8px",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="caption" color="text.disabled">
          No flow defined
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        pointerEvents: "none",
        borderRadius: "8px",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.default",
        backgroundImage: `radial-gradient(${dotColor} 1px, transparent 1px)`,
        backgroundSize: "16px 16px",
      }}
    >
      <FlowSvgContent
        nodes={nodes}
        positions={positions}
        edgeList={edgeList}
        svgW={svgW}
        svgH={svgH}
        uid={blueprintId}
        style={miniMapStyle}
      />
    </Box>
  );
}
