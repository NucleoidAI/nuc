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
  temp?: boolean;
  implied?: boolean;
  title?: string;
}

interface ImpliedBinding {
  sourceNodeId: string;
  targetNodeId: string;
  field: string;
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

function bezierPath(x1: number, y1: number, x2: number, y2: number) {
  const dx = Math.max(40, Math.abs(x2 - x1) / 2);
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

export default function NodeConnectionOverlay({
  containerRef,
  graphData,
  nodeFields,
  dragging,
  onDragEnd,
  onConnect,
  onDisconnect,
}: {
  containerRef: React.RefObject<HTMLDivElement>;
  graphData: DefinitionGraph;
  nodeFields?: Record<string, { inputs: string[]; outputs: string[] }>;
  dragging: DragState | null;
  onDragEnd: () => void;
  onConnect: (binding: ParameterBinding) => void;
  onDisconnect: (targetNodeId: string, targetField: string) => void;
}) {
  const theme = useTheme();
  const rafRef = useRef<number>(0);
  const mousePosRef = useRef<{ x: number; y: number } | null>(null);
  const [paths, setPaths] = useState<PathInfo[]>([]);

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

  const impliedBindings: ImpliedBinding[] = useMemo(() => {
    if (!nodeFields) return [];

    const parentsById = new Map<string, Set<string>>();
    for (const node of Object.values(graphData.nodes)) {
      const childIds: string[] = [];
      if (Array.isArray(node.next)) childIds.push(...node.next);
      else if (typeof node.next === "string") childIds.push(node.next);
      if (node.trueNext) childIds.push(...node.trueNext);
      if (node.falseNext) childIds.push(...node.falseNext);

      for (const childId of childIds) {
        if (!parentsById.has(childId)) parentsById.set(childId, new Set());
        parentsById.get(childId)!.add(node.id);
      }
    }

    const ancestorsOf = (nodeId: string) => {
      const visited = new Set<string>();
      const queue = [...(parentsById.get(nodeId) ?? [])];
      while (queue.length) {
        const id = queue.shift()!;
        if (visited.has(id) || id === nodeId) continue;
        visited.add(id);
        queue.push(...(parentsById.get(id) ?? []));
      }
      return visited;
    };

    const explicit = new Set(
      bindings.map((b) => `${b.targetNodeId}:${b.targetField}`)
    );
    const result: ImpliedBinding[] = [];

    for (const node of Object.values(graphData.nodes)) {
      if (node.nodeType !== "NORMAL") continue;
      const isForce = Boolean(
        (node.raw?.properties as { force?: boolean } | undefined)?.force
      );
      if (isForce) continue;

      const targetFields = nodeFields[node.id];
      if (!targetFields?.inputs.length) continue;

      const ancestors = ancestorsOf(node.id);
      if (!ancestors.size) continue;

      for (const field of targetFields.inputs) {
        if (explicit.has(`${node.id}:${field}`)) continue;

        for (const ancestorId of ancestors) {
          if (nodeFields[ancestorId]?.outputs.includes(field)) {
            result.push({
              sourceNodeId: ancestorId,
              targetNodeId: node.id,
              field,
            });
          }
        }
      }
    }

    return result;
  }, [graphData, nodeFields, bindings]);

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
        const sr = sourceEl.getBoundingClientRect();
        const tr = targetEl.getBoundingClientRect();
        nextPaths.push({
          id: `${b.targetNodeId}:${b.targetField}`,
          d: bezierPath(
            sr.left + sr.width / 2 - containerRect.left,
            sr.top + sr.height / 2 - containerRect.top,
            tr.left + tr.width / 2 - containerRect.left,
            tr.top + tr.height / 2 - containerRect.top
          ),
          targetNodeId: b.targetNodeId,
          targetField: b.targetField,
        });
      }

      for (const ib of impliedBindings) {
        const sourceEl = handles.get(`out:${ib.sourceNodeId}:${ib.field}`);
        const targetEl = handles.get(`in:${ib.targetNodeId}:${ib.field}`);
        if (!sourceEl || !targetEl) continue;
        const sr = sourceEl.getBoundingClientRect();
        const tr = targetEl.getBoundingClientRect();
        nextPaths.push({
          id: `implied:${ib.sourceNodeId}:${ib.targetNodeId}:${ib.field}`,
          d: bezierPath(
            sr.left + sr.width / 2 - containerRect.left,
            sr.top + sr.height / 2 - containerRect.top,
            tr.left + tr.width / 2 - containerRect.left,
            tr.top + tr.height / 2 - containerRect.top
          ),
          targetNodeId: ib.targetNodeId,
          targetField: ib.field,
          implied: true,
          title: `"${ib.field}" is passed implicitly from ${
            graphData.nodes[ib.sourceNodeId]?.label ?? ib.sourceNodeId
          } by matching name — mark this node as a force node to bind it explicitly.`,
        });
      }

      if (dragging && mousePosRef.current) {
        const sourceEl = handles.get(
          `out:${dragging.sourceNodeId}:${dragging.sourceField}`
        );
        if (sourceEl) {
          const sr = sourceEl.getBoundingClientRect();
          nextPaths.push({
            id: "__dragging__",
            d: bezierPath(
              sr.left + sr.width / 2 - containerRect.left,
              sr.top + sr.height / 2 - containerRect.top,
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
  }, [containerRef, graphData, bindings, impliedBindings, dragging]);

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = (e: MouseEvent) => {
      const dropped = (
        document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
      )?.closest('[data-handle-type="in"]') as HTMLElement | null;

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
        <defs>
          <marker
            id="binding-arrow"
            markerWidth="5"
            markerHeight="5"
            refX="4"
            refY="2.5"
            orient="auto"
          >
            <path d="M0,0 L5,2.5 L0,5 Z" fill={theme.palette.primary.main} />
          </marker>
          <marker
            id="binding-arrow-implied"
            markerWidth="4.5"
            markerHeight="4.5"
            refX="4"
            refY="2.25"
            orient="auto"
          >
            <path
              d="M0,0 L4.5,2.25 L0,4.5 Z"
              fill={theme.palette.action.disabled}
            />
          </marker>
        </defs>
        {paths.map((p) => {
          if (p.implied) {
            return (
              <g key={p.id}>
                <path
                  d={p.d}
                  fill="none"
                  stroke={theme.palette.action.disabled}
                  strokeWidth={1.5}
                  strokeDasharray="2 4"
                  strokeLinecap="round"
                  markerEnd="url(#binding-arrow-implied)"
                />
                <path
                  d={p.d}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={12}
                  style={{ pointerEvents: "auto", cursor: "help" }}
                >
                  <title>{p.title}</title>
                </path>
              </g>
            );
          }

          return (
            <g key={p.id}>
              <path
                d={p.d}
                fill="none"
                stroke={
                  p.temp
                    ? theme.palette.primary.light
                    : theme.palette.primary.main
                }
                strokeWidth={p.temp ? 1.5 : 2}
                strokeDasharray={p.temp ? "4 4" : undefined}
                markerEnd={p.temp ? undefined : "url(#binding-arrow)"}
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
          );
        })}
      </svg>
    </Box>
  );
}
