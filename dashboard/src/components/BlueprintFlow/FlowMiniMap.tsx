import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box } from "@mui/material";
import type { DefinitionGraph } from "./helper";

import { alpha, useTheme } from "@mui/material/styles";
import {
  FlowSvgContent,
  type RawNode,
  layoutFlow,
} from "../BlueprintCard/BlueprintFlowMiniPreview";

const MINIMAP_W = 300;

interface ViewportInfo {
  rect: { x: number; y: number; w: number; h: number };
  scaleX: number;
  scaleY: number;
}

function computeViewportInfo(
  containerEl: HTMLElement,
  positions: Record<string, { x: number; y: number }>
): ViewportInfo | null {
  const containerRect = containerEl.getBoundingClientRect();
  const nodeEls = containerEl.querySelectorAll("[data-node-id]");

  const pairs: Array<{
    screen: { x: number; y: number };
    mini: { x: number; y: number };
  }> = [];

  nodeEls.forEach((el) => {
    const id = el.getAttribute("data-node-id");
    if (!id || !positions[id]) return;
    const rect = el.getBoundingClientRect();
    pairs.push({
      screen: {
        x: rect.left - containerRect.left,
        y: rect.top - containerRect.top,
      },
      mini: positions[id],
    });
  });

  if (pairs.length < 2) return null;

  const p1 = pairs[0];
  const p2 = pairs[1];
  const dsx = p2.screen.x - p1.screen.x;
  const dsy = p2.screen.y - p1.screen.y;
  const dmx = p2.mini.x - p1.mini.x;
  const dmy = p2.mini.y - p1.mini.y;

  const scaleX =
    Math.abs(dsx) > 1 ? dmx / dsx : Math.abs(dsy) > 1 ? dmy / dsy : null;
  const scaleY =
    Math.abs(dsy) > 1 ? dmy / dsy : Math.abs(dsx) > 1 ? dmx / dsx : null;

  if (scaleX === null || scaleY === null) return null;

  const offsetX = p1.mini.x - p1.screen.x * scaleX;
  const offsetY = p1.mini.y - p1.screen.y * scaleY;

  return {
    rect: {
      x: offsetX,
      y: offsetY,
      w: containerRect.width * scaleX,
      h: containerRect.height * scaleY,
    },
    scaleX,
    scaleY,
  };
}

export function FlowMiniMap({
  graphData,
  flowContainerRef,
}: {
  graphData: DefinitionGraph;
  flowContainerRef: React.RefObject<HTMLDivElement>;
}) {
  const theme = useTheme();
  const rafRef = useRef<number>(0);
  const viewportInfoRef = useRef<ViewportInfo | null>(null);
  const [viewportRect, setViewportRect] = useState<ViewportInfo["rect"] | null>(
    null
  );
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  const rawNodes: RawNode[] = useMemo(
    () =>
      Object.values(graphData.nodes).map((n) => ({
        id: n.id,
        type: n.nodeType,
        properties: {
          label: n.label,
          action: n.action,
          icon: n.icon,
          description: n.description,
        },
        next: n.raw?.next
          ? Array.isArray(n.raw.next)
            ? n.raw.next
            : [n.raw.next]
          : [],
        true: n.raw?.true ?? [],
        false: n.raw?.false ?? [],
      })),
    [graphData]
  );

  const { positions, edgeList, svgW, svgH } = useMemo(
    () => layoutFlow(rawNodes),
    [rawNodes]
  );

  // Track viewport via RAF
  useEffect(() => {
    const container = flowContainerRef.current;
    if (!container) return;

    const tick = () => {
      const info = computeViewportInfo(container, positions);
      viewportInfoRef.current = info;
      setViewportRect(info?.rect ?? null);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [flowContainerRef, positions]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current || !viewportInfoRef.current) return;

      const dx_css = e.clientX - dragStartRef.current.x;
      const dy_css = e.clientY - dragStartRef.current.y;

      const svgScaleX = svgW / MINIMAP_W;
      const svgScaleY = svgW / MINIMAP_W;
      const dx_flow = (dx_css * svgScaleX) / viewportInfoRef.current.scaleX;
      const dy_flow = (dy_css * svgScaleY) / viewportInfoRef.current.scaleY;

      const container = flowContainerRef.current;
      if (container && (Math.abs(dx_flow) > 0.5 || Math.abs(dy_flow) > 0.5)) {
        const target =
          (container.querySelector("[data-node-id]") as HTMLElement) ??
          container;
        target.dispatchEvent(
          new WheelEvent("wheel", {
            bubbles: true,
            cancelable: true,
            deltaMode: 0,
            deltaX: dx_flow,
            deltaY: dy_flow,
          })
        );
      }

      dragStartRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (flowContainerRef.current) {
        flowContainerRef.current.style.pointerEvents = "";
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, svgW, flowContainerRef]);

  const handleViewportMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    if (flowContainerRef.current) {
      flowContainerRef.current.style.pointerEvents = "none";
    }
  };

  const dotColor = alpha(theme.palette.divider, 0.12);

  if (!rawNodes.length || svgW === 0) return null;

  return (
    <Box
      sx={{
        position: "absolute",
        bottom: 16,
        left: 16,
        width: MINIMAP_W,
        borderRadius: "10px",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: alpha(theme.palette.background.paper, 0.9),
        backgroundImage: `radial-gradient(${dotColor} 1px, transparent 1px)`,
        backgroundSize: "12px 12px",
        backdropFilter: "blur(6px)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
        overflow: "hidden",
        zIndex: 10,
        cursor: isDragging ? "grabbing" : "default",
        userSelect: "none",
      }}
    >
      <FlowSvgContent
        nodes={rawNodes}
        positions={positions}
        edgeList={edgeList}
        svgW={svgW}
        svgH={svgH}
        uid="minimap"
        viewportRect={viewportRect}
        onViewportMouseDown={handleViewportMouseDown}
        isDragging={isDragging}
      />
    </Box>
  );
}
