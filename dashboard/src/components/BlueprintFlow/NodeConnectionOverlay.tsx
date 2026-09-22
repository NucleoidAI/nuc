import { Box } from "@mui/material";
import type { DefinitionGraph } from "./helper";
import { parseByNodeRef } from "./helper";
import { useTheme } from "@mui/material/styles";

import React, { useEffect, useMemo, useRef, useState } from "react";

export interface ParameterBinding {
  targetNodeId: string;
  targetField: string;
  sourceNodeId: string;
  sourceField: string;
}

export interface DragState {
  sourceNodeId: string;
  sourceField: string;
}

interface PathInfo {
  id: string;
  d: string;
  targetNodeId: string;
  targetField: string;
  sourceNodeId?: string;
  sourceField?: string;
  temp?: boolean;
  isDirect?: boolean;
}

function childIdsOf(node: {
  next?: string | string[];
  trueNext?: string[];
  falseNext?: string[];
}): string[] {
  const ids: string[] = [];
  if (Array.isArray(node.next)) ids.push(...node.next);
  else if (typeof node.next === "string") ids.push(node.next);
  if (node.trueNext) ids.push(...node.trueNext);
  if (node.falseNext) ids.push(...node.falseNext);
  return ids;
}

function collectHandles(container: HTMLElement) {
  const map = new Map<string, HTMLElement>();
  container
    .querySelectorAll<HTMLElement>("[data-handle-type]")
    .forEach((el) => {
      const { handleType, nodeId, field } = el.dataset;
      if (!handleType || !nodeId || !field) return;
      map.set(`${handleType}:${nodeId}:${field}`, el);
    });

  container.querySelectorAll<HTMLElement>("[data-in-handle]").forEach((el) => {
    const { nodeId, field } = el.dataset;
    if (!nodeId || !field) return;
    const key = `in:${nodeId}:${field}`;
    if (!map.has(key)) map.set(key, el);
  });
  return map;
}

function sourceAnchor(rect: DOMRect, containerRect: DOMRect) {
  return {
    x: rect.right - containerRect.left,
    y: rect.top + rect.height / 2 - containerRect.top,
  };
}

function targetAnchor(rect: DOMRect, containerRect: DOMRect) {
  return {
    x: rect.left - containerRect.left,
    y: rect.top + rect.height / 2 - containerRect.top,
  };
}

function bezierPath(x1: number, y1: number, x2: number, y2: number) {
  const dx = Math.max(40, Math.abs(x2 - x1) / 2);
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

export default function NodeConnectionOverlay({
  containerRef,
  graphData,
  dragging,
  onDragEnd,
  onConnect,
  onDisconnect,
}: {
  containerRef: React.RefObject<HTMLDivElement>;
  graphData: DefinitionGraph;
  dragging: DragState | null;
  onDragEnd: () => void;
  onConnect: (binding: ParameterBinding) => void;
  onDisconnect: (targetNodeId: string, targetField: string) => void;
}) {
  const theme = useTheme();
  const rafRef = useRef<number>(0);
  const mousePosRef = useRef<{ x: number; y: number } | null>(null);
  const [paths, setPaths] = useState<PathInfo[]>([]);
  const [hoveredHandle, setHoveredHandle] = useState<string | null>(null);

  const directParents: Record<string, Set<string>> = useMemo(() => {
    const result: Record<string, Set<string>> = {};
    for (const node of Object.values(graphData.nodes)) {
      for (const childId of childIdsOf(node)) {
        if (!result[childId]) result[childId] = new Set();
        result[childId].add(node.id);
      }
    }
    return result;
  }, [graphData]);

  const bindings: ParameterBinding[] = useMemo(() => {
    const result: ParameterBinding[] = [];
    for (const node of Object.values(graphData.nodes)) {
      if (node.nodeType !== "NORMAL") continue;
      const params = (
        node.raw?.properties as
          | { parameters?: Record<string, unknown> }
          | undefined
      )?.parameters;
      if (!params) continue;
      for (const [field, value] of Object.entries(params)) {
        const ref = parseByNodeRef(value);
        if (!ref) continue;
        result.push({
          targetNodeId: node.id,
          targetField: field,
          sourceNodeId: ref.sourceNodeId,
          sourceField: ref.sourceField,
        });
      }
    }
    return result;
  }, [graphData]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const tick = () => {
      const containerRect = container.getBoundingClientRect();
      const handles = collectHandles(container);
      const nextPaths: PathInfo[] = [];

      for (const b of bindings) {
        const sourceEl = handles.get(`out:${b.sourceNodeId}:${b.sourceField}`);
        const targetEl = handles.get(`in:${b.targetNodeId}:${b.targetField}`);
        if (!sourceEl || !targetEl) continue;
        const s = sourceAnchor(sourceEl.getBoundingClientRect(), containerRect);
        const t = targetAnchor(targetEl.getBoundingClientRect(), containerRect);
        nextPaths.push({
          id: `${b.targetNodeId}:${b.targetField}`,
          d: bezierPath(s.x, s.y, t.x, t.y),
          targetNodeId: b.targetNodeId,
          targetField: b.targetField,
          sourceNodeId: b.sourceNodeId,
          sourceField: b.sourceField,
          isDirect: directParents[b.targetNodeId]?.has(b.sourceNodeId) ?? false,
        });
      }

      if (dragging && mousePosRef.current) {
        const sourceEl = handles.get(
          `out:${dragging.sourceNodeId}:${dragging.sourceField}`
        );
        if (sourceEl) {
          const s = sourceAnchor(
            sourceEl.getBoundingClientRect(),
            containerRect
          );
          nextPaths.push({
            id: "__dragging__",
            d: bezierPath(
              s.x,
              s.y,
              mousePosRef.current.x - containerRect.left,
              mousePosRef.current.y - containerRect.top
            ),
            targetNodeId: "",
            targetField: "",
            temp: true,
          });
        }
      }

      setPaths(nextPaths);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [containerRef, graphData, bindings, dragging, directParents]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleOver = (e: MouseEvent) => {
      const el = (e.target as HTMLElement)?.closest(
        "[data-handle-type][data-node-id][data-field]"
      ) as HTMLElement | null;
      if (!el) return;
      const { nodeId, field } = el.dataset;
      if (!nodeId || !field) return;
      setHoveredHandle(`${nodeId}:${field}`);
    };

    const handleOut = (e: MouseEvent) => {
      const el = (e.target as HTMLElement)?.closest(
        "[data-handle-type][data-node-id][data-field]"
      ) as HTMLElement | null;
      if (!el) return;
      setHoveredHandle((current) => {
        const { nodeId, field } = el.dataset;
        if (current === `${nodeId}:${field}`) return null;
        return current;
      });
    };

    container.addEventListener("mouseover", handleOver);
    container.addEventListener("mouseout", handleOut);
    return () => {
      container.removeEventListener("mouseover", handleOver);
      container.removeEventListener("mouseout", handleOut);
    };
  }, [containerRef]);

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = (e: MouseEvent) => {
      const dropped = (
        document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
      )?.closest("[data-in-bindable]") as HTMLElement | null;

      if (dropped) {
        const { nodeId, field } = dropped.dataset;
        if (nodeId && field && nodeId !== dragging.sourceNodeId) {
          onConnect({
            sourceNodeId: dragging.sourceNodeId,
            sourceField: dragging.sourceField,
            targetNodeId: nodeId,
            targetField: field,
          });
        }
      }

      mousePosRef.current = null;
      onDragEnd();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, onConnect, onDragEnd]);

  return (
    <Box
      sx={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 12 }}
    >
      <svg
        width="100%"
        height="100%"
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
      >
        {paths
          .filter((p) => {
            if (p.temp || p.isDirect) return true;
            if (!hoveredHandle) return false;
            return (
              hoveredHandle === `${p.targetNodeId}:${p.targetField}` ||
              hoveredHandle === `${p.sourceNodeId}:${p.sourceField}`
            );
          })
          .map((p) => (
            <g key={p.id}>
              <path
                d={p.d}
                fill="none"
                stroke={
                  p.temp ? theme.palette.grey[400] : theme.palette.grey[600]
                }
                strokeWidth={p.temp ? 1.5 : 2}
                strokeDasharray={p.temp ? "4 4" : undefined}
              />
              {!p.temp && (
                <path
                  d={p.d}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={14}
                  style={{ pointerEvents: "auto", cursor: "pointer" }}
                  onClick={() => onDisconnect(p.targetNodeId, p.targetField)}
                />
              )}
            </g>
          ))}
      </svg>
    </Box>
  );
}
