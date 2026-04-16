import { Iconify } from "@canmingir/link/platform/components";
import useBlueprint from "../../hooks/useBlueprint";
import { useMemo } from "react";
import { Box, Skeleton, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

// Proportional to real node: 300×180 → 110×66
const NODE_W = 110;
const NODE_H = 66;
const H_GAP = 72;
const V_GAP = 32;
const PAD = 16;

export interface RawNode {
  id: string;
  type: string;
  properties?: {
    label?: string;
    action?: string;
    description?: string;
    icon?: string;
  };
  next?: string[];
  true?: string[];
  false?: string[];
}

export function layoutFlow(nodes: RawNode[]) {
  if (!nodes.length) return { positions: {}, edgeList: [], svgW: 0, svgH: 0 };

  const nodeMap: Record<string, RawNode> = {};
  nodes.forEach((n) => {
    nodeMap[n.id] = n;
  });

  const referenced = new Set<string>();
  nodes.forEach((n) => {
    (n.next || []).forEach((id) => referenced.add(id));
    ((n as RawNode).true || []).forEach((id: string) => referenced.add(id));
    ((n as RawNode).false || []).forEach((id: string) => referenced.add(id));
  });

  let roots = nodes.filter((n) => !referenced.has(n.id)).map((n) => n.id);
  if (!roots.length) roots = [nodes[0].id];

  const layerOf: Record<string, number> = {};
  const posInLayer: Record<string, number> = {};
  const layerCount: number[] = [];
  const queue: { id: string; layer: number }[] = roots.map((id) => ({
    id,
    layer: 0,
  }));
  const visited = new Set<string>();

  while (queue.length) {
    const { id, layer } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    layerOf[id] = layer;
    if (layerCount[layer] === undefined) layerCount[layer] = 0;
    posInLayer[id] = layerCount[layer]++;

    const n = nodeMap[id];
    if (!n) continue;
    [
      ...(n.next || []),
      ...((n as RawNode).true || []),
      ...((n as RawNode).false || []),
    ].forEach((cid: string) => {
      if (!visited.has(cid)) queue.push({ id: cid, layer: layer + 1 });
    });
  }

  const maxLayer = Math.max(0, ...Object.values(layerOf));
  const maxInLayer = Math.max(1, ...layerCount);
  const positions: Record<string, { x: number; y: number }> = {};

  Object.keys(layerOf).forEach((id) => {
    const l = layerOf[id];
    const p = posInLayer[id];
    const count = layerCount[l];
    const totalH = count * NODE_H + (count - 1) * V_GAP;
    const centerOffset = (maxInLayer * (NODE_H + V_GAP) - totalH) / 2;
    positions[id] = {
      x: l * (NODE_W + H_GAP) + PAD,
      y: p * (NODE_H + V_GAP) + PAD + centerOffset,
    };
  });

  const edgeList: {
    from: string;
    to: string;
    kind: "default" | "true" | "false";
  }[] = [];
  nodes.forEach((n) => {
    (n.next || []).forEach((to) =>
      edgeList.push({ from: n.id, to, kind: "default" })
    );
    ((n as RawNode).true || []).forEach((to: string) =>
      edgeList.push({ from: n.id, to, kind: "true" })
    );
    ((n as RawNode).false || []).forEach((to: string) =>
      edgeList.push({ from: n.id, to, kind: "false" })
    );
  });

  const svgW = (maxLayer + 1) * (NODE_W + H_GAP) - H_GAP + PAD * 2;
  const svgH = maxInLayer * (NODE_H + V_GAP) - V_GAP + PAD * 2;

  return { positions, edgeList, svgW, svgH };
}

export function FlowSvgContent({
  nodes,
  positions,
  edgeList,
  svgW,
  svgH,
  uid,
  viewportRect,
  onViewportMouseDown,
  isDragging,
}: {
  nodes: RawNode[];
  positions: Record<string, { x: number; y: number }>;
  edgeList: { from: string; to: string; kind: "default" | "true" | "false" }[];
  svgW: number;
  svgH: number;
  uid: string;
  viewportRect?: { x: number; y: number; w: number; h: number } | null;
  onViewportMouseDown?: (e: React.MouseEvent) => void;
  isDragging?: boolean;
}) {
  const theme = useTheme();
  const dotColor = alpha(theme.palette.divider, 0.08);
  const gradFrom = alpha(theme.palette.secondary.light, 0.2);
  const gradTo = alpha(theme.palette.primary.main, 0.3);
  const condGradFrom = alpha("#f59e0b", 0.15);
  const condGradTo = alpha("#f59e0b", 0.3);

  const patternId = `dots-${uid}`;
  const nodeGradId = `ng-${uid}`;
  const condGradId = `cg-${uid}`;
  const shadowId = `sh-${uid}`;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${svgW} ${svgH}`}
      preserveAspectRatio="xMidYMid meet"
      style={{
        display: "block",
        height: "100%",
        pointerEvents: onViewportMouseDown ? "auto" : "none",
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id={patternId}
          x="0"
          y="0"
          width="16"
          height="16"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="0.5" cy="0.5" r="0.5" fill={dotColor} />
        </pattern>
        <linearGradient id={nodeGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={gradFrom} />
          <stop offset="100%" stopColor={gradTo} />
        </linearGradient>
        <linearGradient id={condGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={condGradFrom} />
          <stop offset="100%" stopColor={condGradTo} />
        </linearGradient>
        <filter id={shadowId} x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow
            dx="0"
            dy="2"
            stdDeviation="3"
            floodColor="rgba(0,0,0,0.2)"
          />
        </filter>
      </defs>

      {edgeList.map((edge, i) => {
        const from = positions[edge.from];
        const to = positions[edge.to];
        if (!from || !to) return null;
        const x1 = from.x + NODE_W;
        const y1 = from.y + NODE_H / 2;
        const x2 = to.x;
        const y2 = to.y + NODE_H / 2;
        const mx = (x1 + x2) / 2;
        const edgeColor =
          edge.kind === "true"
            ? "#2e914f"
            : edge.kind === "false"
            ? "#d32f2f"
            : alpha(theme.palette.text.secondary, 0.45);
        const labelText = edge.kind !== "default" ? edge.kind : null;
        const labelY =
          edge.kind === "false" ? (y1 + y2) / 2 + 9 : (y1 + y2) / 2 - 4;
        return (
          <g key={i}>
            <path
              d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
              fill="none"
              stroke={edgeColor}
              strokeWidth={1.5}
              strokeOpacity={0.85}
            />
            <polygon
              points={`${x2},${y2} ${x2 - 6},${y2 - 3.5} ${x2 - 6},${y2 + 3.5}`}
              fill={edgeColor}
              opacity={0.85}
            />
            {labelText && (
              <text
                x={(x1 + x2) / 2}
                y={labelY}
                textAnchor="middle"
                fontSize={8}
                fontWeight={600}
                fill={edgeColor}
                fontFamily="sans-serif"
              >
                {labelText}
              </text>
            )}
          </g>
        );
      })}

      {nodes.map((node) => {
        const pos = positions[node.id];
        if (!pos) return null;
        const isCondition = node.type === "CONDITION";
        const gradId = isCondition ? condGradId : nodeGradId;
        const rawLabel = node.properties?.label || node.id;
        const label =
          rawLabel.length > 14 ? rawLabel.slice(0, 13) + "…" : rawLabel;
        const action = node.properties?.action || "";
        const shortAction = action
          .replace(/^PLATFORM:/i, "")
          .replace(/^SYSTEM:/i, "");
        const actionLabel =
          shortAction.length > 16
            ? shortAction.slice(0, 15) + "…"
            : shortAction;
        const iconBoxSize = 20;
        const iconBoxX = pos.x + (NODE_W - iconBoxSize) / 2;
        const iconBoxY = pos.y + 10;
        const iconName = node.properties?.icon
          ? node.properties.icon
          : isCondition
          ? "mdi:help-circle-outline"
          : "mdi:checkbox-blank-circle-outline";
        return (
          <g key={node.id} filter={`url(#${shadowId})`}>
            <rect
              x={pos.x}
              y={pos.y}
              width={NODE_W}
              height={NODE_H}
              rx={14}
              fill={`url(#${gradId})`}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={1}
            />
            <rect
              x={iconBoxX}
              y={iconBoxY}
              width={iconBoxSize}
              height={iconBoxSize}
              rx={6}
              fill="rgba(255,255,255,0.1)"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={0.75}
            />
            <foreignObject
              x={iconBoxX}
              y={iconBoxY}
              width={iconBoxSize}
              height={iconBoxSize}
            >
              <div
                style={{
                  width: iconBoxSize,
                  height: iconBoxSize,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Iconify
                  icon={iconName}
                  width={14}
                  height={14}
                  sx={{ color: "rgba(255,255,255,0.85)" }}
                />
              </div>
            </foreignObject>
            <text
              x={pos.x + NODE_W / 2}
              y={iconBoxY + iconBoxSize + 11}
              fontSize={8.5}
              fontWeight={700}
              fill="rgba(255,255,255,0.95)"
              fontFamily="sans-serif"
              textAnchor="middle"
              letterSpacing={0.2}
            >
              {label}
            </text>
            {actionLabel && (
              <text
                x={pos.x + NODE_W / 2}
                y={pos.y + NODE_H - 7}
                fontSize={6.5}
                fontWeight={700}
                fill="rgba(255,255,255,0.35)"
                fontFamily="monospace"
                textAnchor="middle"
                letterSpacing={0.8}
              >
                {actionLabel.toUpperCase()}
              </text>
            )}
          </g>
        );
      })}

      {viewportRect && (
        <rect
          x={viewportRect.x}
          y={viewportRect.y}
          width={viewportRect.w}
          height={viewportRect.h}
          fill="rgba(255,255,255,0.08)"
          stroke="rgba(255,255,255,0.75)"
          strokeWidth={2}
          strokeDasharray="4 2"
          rx={4}
          style={{
            cursor: isDragging ? "grabbing" : "grab",
            pointerEvents: onViewportMouseDown ? "all" : "none",
          }}
          onMouseDown={onViewportMouseDown}
        />
      )}
    </svg>
  );
}

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
      />
    </Box>
  );
}
