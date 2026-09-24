import type { RawNode } from "../BlueprintFlow/miniTypes";
import useBlueprint from "../../hooks/useBlueprint";
import { useMemo } from "react";

import {
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

export function BlueprintFlowMiniPreview({
  blueprintId,
}: {
  blueprintId: string;
}) {
  const theme = useTheme();
  const { getBlueprintWithNode } = useBlueprint();
  const { blueprintNodes, loading } = getBlueprintWithNode(blueprintId);

  const { positions, edgeList, svgW, svgH } = useMemo(() => {
    const nodes = blueprintNodes?.nodes;
    if (!nodes?.length)
      return { positions: {}, edgeList: [], svgW: 0, svgH: 0 };
    return layoutFlow(nodes);
  }, [blueprintNodes]);

  if (loading) {
    return (
      <Skeleton
        variant="rectangular"
        height={240}
        sx={{ borderRadius: "8px" }}
      />
    );
  }

  const nodes: RawNode[] = blueprintNodes?.nodes || [];
  const dotColor = alpha(theme.palette.divider, 0.08);

  const miniMapStyle = (node: { type?: string }) => {
    const isApproval = node?.type === "APPROVAL";
    if (!isApproval) return {};
    return {
      bg: APPROVAL_BG_TO,
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
