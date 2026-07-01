/* eslint-disable */
import BlueprintChatContent from "../BlueprintChat/BlueprintChatContent";
import { Iconify } from "@canmingir/link/platform/components";
import InlineChatInput from "../../widgets/ChatInput/InlineChatInput";
import PopupChatWidget from "../../widgets/PopupChatWidget/PopupChatWidget";
import useBlueprint from "../../hooks/useBlueprint";
import useKnowledge from "../../hooks/useKnowledge";
import useSupervisings from "../../hooks/useSupervisings";
import { RawNode, layoutFlow } from "../BlueprintCard/BlueprintFlowMiniPreview";
import {
  calculateDiffStats,
  calculateNodeChanges,
} from "../BlueprintFlow/DiffPanel/diffHelper";

import {
  Backdrop,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Fab,
  IconButton,
  Slide,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import React, { memo, useCallback, useMemo } from "react";

/* ------------------------------------------------------------------ */
/* Mini diff SVG renderer                                               */
/* ------------------------------------------------------------------ */

const NODE_W = 110;
const NODE_H = 66;

function DiffFlowSvg({
  nodes,
  changeMap,
  uid,
}: {
  nodes: RawNode[];
  changeMap: Map<string, { changeType: string }>;
  uid: string;
}) {
  const theme = useTheme();

  const { positions, edgeList, svgW, svgH } = useMemo(
    () =>
      nodes.length
        ? layoutFlow(nodes)
        : { positions: {}, edgeList: [], svgW: 0, svgH: 0 },
    [nodes]
  );

  const dotColor = alpha(theme.palette.divider, 0.08);
  const patternId = `dp-${uid}`;
  const shadowId = `ds-${uid}`;
  const defaultGradId = `dg-${uid}`;
  const addedGradId = `ag-${uid}`;
  const modGradId = `mg-${uid}`;
  const removedGradId = `rg-${uid}`;

  if (!nodes.length) return null;

  const getNodeGrad = (id: string) => {
    const ct = changeMap.get(id)?.changeType;
    if (ct === "added") return `url(#${addedGradId})`;
    if (ct === "modified") return `url(#${modGradId})`;
    if (ct === "removed") return `url(#${removedGradId})`;
    return `url(#${defaultGradId})`;
  };

  const getNodeStroke = (id: string) => {
    const ct = changeMap.get(id)?.changeType;
    if (ct === "added") return "#2ea44f";
    if (ct === "modified") return "#f0883e";
    if (ct === "removed") return "#f85149";
    return "rgba(255,255,255,0.08)";
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        borderRadius: 1.5,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: "background.default",
        backgroundImage: `radial-gradient(${dotColor} 1px, transparent 1px)`,
        backgroundSize: "16px 16px",
        pointerEvents: "none",
      }}
    >
      <svg
        width="100%"
        viewBox={`0 0 ${svgW} ${svgH}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: "block", height: "100%" }}
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
          <linearGradient
            id={defaultGradId}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop
              offset="0%"
              stopColor={alpha(theme.palette.secondary.light, 0.2)}
            />
            <stop
              offset="100%"
              stopColor={alpha(theme.palette.primary.main, 0.3)}
            />
          </linearGradient>
          <linearGradient id={addedGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(46,164,79,0.25)" />
            <stop offset="100%" stopColor="rgba(46,164,79,0.5)" />
          </linearGradient>
          <linearGradient id={modGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(240,136,62,0.25)" />
            <stop offset="100%" stopColor="rgba(240,136,62,0.5)" />
          </linearGradient>
          <linearGradient
            id={removedGradId}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="rgba(248,81,73,0.25)" />
            <stop offset="100%" stopColor="rgba(248,81,73,0.5)" />
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
                points={`${x2},${y2} ${x2 - 6},${y2 - 3.5} ${x2 - 6},${
                  y2 + 3.5
                }`}
                fill={edgeColor}
                opacity={0.85}
              />
              {edge.kind !== "default" && (
                <text
                  x={(x1 + x2) / 2}
                  y={(y1 + y2) / 2 - 4}
                  textAnchor="middle"
                  fontSize={8}
                  fontWeight={600}
                  fill={edgeColor}
                  fontFamily="sans-serif"
                >
                  {edge.kind}
                </text>
              )}
            </g>
          );
        })}

        {nodes.map((node) => {
          const pos = positions[node.id];
          if (!pos) return null;
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
          const iconName =
            node.properties?.icon || "mdi:checkbox-blank-circle-outline";
          const strokeColor = getNodeStroke(node.id);
          const gradFill = getNodeGrad(node.id);

          return (
            <g key={node.id} filter={`url(#${shadowId})`}>
              <rect
                x={pos.x}
                y={pos.y}
                width={NODE_W}
                height={NODE_H}
                rx={14}
                fill={gradFill}
                stroke={strokeColor}
                strokeWidth={strokeColor === "rgba(255,255,255,0.08)" ? 1 : 2}
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
      </svg>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

type ResolveResponse =
  | {
      kind: "knowledge";
      data: {
        id: string;
        type: string;
        text: string;
        status: string;
        createdAt: string;
      };
    }
  | {
      kind: "blueprint";
      data: {
        id: string;
        title: string;
        description: string;
        agentId: string;
        //eslint-disable-next-line
        nodes: any[];
      };
    };

/* ------------------------------------------------------------------ */
/* SupervisingChat                                                      */
/* ------------------------------------------------------------------ */

const SupervisingChat = ({
  open = false,
  handleClose,
  readOnly = false,
  closeButton = true,
  loading = false,
  supervise,
  agentId,
  title,
}: {
  open: boolean;
  handleClose: () => void;
  readOnly?: boolean;
  closeButton?: boolean;
  loading?: boolean;
  agentId?: string;
  title?: string;
  supervise: {
    id: string;
    question?: string;
    conversationId?: string;
    sessionId?: string;
    blueprintId?: string;
    taskId?: string;
  };
}) => {
  const WELCOME =
    "Welcome to the Supervising Chat! Describe the situation and I'll help you resolve it.";

  const { resolveSupervising, submitSupervising } = useSupervisings();
  const { createKnowledge } = useKnowledge();
  const { getBlueprintWithId, upsertBlueprint } = useBlueprint();
  const { blueprint: currentBlueprint } = getBlueprintWithId(
    supervise.blueprintId || ""
  );

  const theme = useTheme();

  const [popChatOpen, setPopChatOpen] = React.useState(false);
  const [messages, setMessages] = React.useState([
    { role: "ASSISTANT", content: WELCOME },
  ]);
  const [isEvaluating, setIsEvaluating] = React.useState(false);
  const [resolveResponse, setResolveResponse] =
    React.useState<ResolveResponse | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  /* ---- message handler ------------------------------------------- */

  const handleMessageSend = useCallback(
    async (message: string) => {
      if (!message || !supervise.id) return;

      setMessages((prev) => [...prev, { role: "USER", content: message }]);
      setIsEvaluating(true);

      try {
        const result = await resolveSupervising(supervise.id, message);

        if (result?.nodes) {
          setResolveResponse({ kind: "blueprint", data: result });
          setMessages((prev) => [
            ...prev,
            {
              role: "ASSISTANT",
              content: `Blueprint suggestion found: "${result.title}". Review the diff below and choose to approve or reject.`,
            },
          ]);
        } else if (result?.type) {
          setResolveResponse({ kind: "knowledge", data: result });
          setMessages((prev) => [
            ...prev,
            {
              role: "ASSISTANT",
              content:
                "Knowledge data found. Review it below and save to the knowledge base if it looks correct.",
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: "ASSISTANT",
              content: "No actionable result returned. Please try again.",
            },
          ]);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "ASSISTANT",
            content: "Sorry, there was an error. Please try again.",
          },
        ]);
      } finally {
        setIsEvaluating(false);
      }
    },
    [supervise.id, resolveSupervising]
  );

  /* ---- knowledge handlers ---------------------------------------- */

  const handleSaveKnowledge = async () => {
    if (resolveResponse?.kind !== "knowledge") return;
    setIsSaving(true);
    try {
      await createKnowledge(
        { type: resolveResponse.data.type, text: resolveResponse.data.text },
        agentId || "",
        undefined,
        null,
        null,
        supervise?.taskId
      );
      await submitSupervising(supervise.id);
      setMessages((prev) => [
        ...prev,
        { role: "ASSISTANT", content: "Knowledge saved successfully!" },
      ]);
      setResolveResponse(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDismiss = () => {
    setResolveResponse(null);
    setMessages((prev) => [
      ...prev,
      { role: "ASSISTANT", content: "Suggestion dismissed." },
    ]);
  };

  /* ---- blueprint handlers ---------------------------------------- */

  const handleApproveBlueprint = async () => {
    if (resolveResponse?.kind !== "blueprint") return;
    setIsSaving(true);
    try {
      const { data } = resolveResponse;
      await upsertBlueprint(
        supervise.blueprintId || data.id,
        data.title,
        data.description,
        data.agentId || agentId || "",
        data.nodes,
        supervise.taskId
      );
      setMessages((prev) => [
        ...prev,
        { role: "ASSISTANT", content: "Blueprint updated successfully!" },
      ]);
      setResolveResponse(null);
    } finally {
      setIsSaving(false);
    }
  };

  /* ---- diff computations ----------------------------------------- */

  const { oldNodes, newNodes, oldChangeMap, newChangeMap, diffStats } =
    useMemo(() => {
      if (resolveResponse?.kind !== "blueprint") {
        return {
          oldNodes: [] as RawNode[],
          newNodes: [] as RawNode[],
          oldChangeMap: new Map(),
          newChangeMap: new Map(),
          diffStats: null,
        };
      }

      const old: RawNode[] = (currentBlueprint?.nodes as RawNode[]) || [];
      const next: RawNode[] = (resolveResponse.data.nodes as RawNode[]) || [];

      //eslint-disable-next-line
      const stats = calculateDiffStats(old as any, next as any);
      //eslint-disable-next-line
      const newCM = calculateNodeChanges(old as any, next as any);

      // For old side: mark removed nodes
      const oldCM = new Map<string, { changeType: string }>();
      old.forEach((n) => {
        const ct = newCM.get(n.id)?.changeType;
        oldCM.set(n.id, {
          changeType: ct === "removed" ? "removed" : "unchanged",
        });
      });

      return {
        oldNodes: old,
        newNodes: next,
        oldChangeMap: oldCM,
        newChangeMap: newCM,
        diffStats: stats,
      };
    }, [resolveResponse, currentBlueprint]);

  /* ----------------------------------------------------------------- */

  return (
    <>
      <Backdrop
        open={open}
        onClick={handleClose}
        sx={{
          zIndex: 9998,
          backgroundColor: alpha(theme.palette.common.black, 0.2),
        }}
      />
      <Slide direction="left" in={open} mountOnEnter unmountOnExit>
        <Card
          elevation={24}
          sx={{
            position: "fixed",
            top: 0,
            right: 0,
            height: "100vh",
            width: "50vw",
            minWidth: "400px",
            maxWidth: "600px",
            background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default}80 100%)`,
            backdropFilter: "blur(10px)",
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: "16px 0 0 16px",
            borderRight: "none",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            zIndex: 9999,
            boxShadow: theme.shadows[24],
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: 2,
              borderBottom: `1px solid ${theme.palette.divider}`,
              backgroundColor: alpha(theme.palette.primary.main, 0.05),
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {title ?? "Resolve Supervise"}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Tooltip title="See Full Conversation">
                <Fab
                  color="inherit"
                  onClick={() => setPopChatOpen(!popChatOpen)}
                >
                  <Iconify
                    icon={
                      popChatOpen
                        ? "solar:chat-round-line-linear"
                        : "solar:chat-round-line-bold"
                    }
                    sx={{ width: 26, height: 26 }}
                  />
                </Fab>
              </Tooltip>
              {closeButton && (
                <IconButton
                  onClick={handleClose}
                  sx={{
                    color: theme.palette.text.secondary,
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    },
                  }}
                >
                  <Iconify icon="material-symbols:close" />
                </IconButton>
              )}
            </Box>
          </Box>

          {/* Question */}
          {supervise.question && (
            <Box
              sx={{
                p: 2,
                borderBottom: `1px solid ${theme.palette.divider}20`,
                backgroundColor: alpha(theme.palette.secondary.main, 0.03),
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  mb: 1,
                  fontWeight: 600,
                }}
              >
                Question
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: theme.palette.text.primary,
                  lineHeight: 1.5,
                  fontStyle: "italic",
                  background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default}80 100%)`,
                  border: `1px solid ${theme.palette.divider}30`,
                  borderRadius: 1.5,
                  p: 1.5,
                }}
              >
                {supervise.question}
              </Typography>
            </Box>
          )}

          {/* Body */}
          <CardContent
            sx={{
              p: 0,
              "&:last-child": { pb: 0 },
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                flex: 1,
                paddingTop: { xs: "8px", sm: "10px" },
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                overflow: "hidden",
              }}
            >
              <BlueprintChatContent
                loading={loading || isEvaluating}
                messages={messages}
              />
            </Box>

            {/* ---- Knowledge response panel ---- */}
            {resolveResponse?.kind === "knowledge" && (
              <Box
                sx={{
                  mx: 2,
                  mb: 1,
                  p: 2,
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                  backgroundColor: alpha(theme.palette.info.main, 0.04),
                }}
              >
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
                >
                  <Iconify
                    icon="solar:document-bold"
                    sx={{ width: 18, height: 18, color: "info.main" }}
                  />
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, color: "info.main" }}
                  >
                    Knowledge Data
                  </Typography>
                  <Chip
                    label={resolveResponse.data.type}
                    size="small"
                    color="info"
                    variant="outlined"
                  />
                </Box>
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: "background.default",
                    borderRadius: 1,
                    fontFamily: "monospace",
                    fontSize: "0.75rem",
                    wordBreak: "break-all",
                    mb: 1.5,
                    maxHeight: 100,
                    overflow: "auto",
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  {resolveResponse.data.text}
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleSaveKnowledge}
                    disabled={isSaving}
                    startIcon={
                      <Iconify
                        icon="solar:diskette-bold"
                        sx={{ width: 16, height: 16 }}
                      />
                    }
                  >
                    Save to Knowledge Base
                  </Button>
                  <Button
                    size="small"
                    onClick={handleDismiss}
                    disabled={isSaving}
                  >
                    Dismiss
                  </Button>
                </Box>
              </Box>
            )}

            {/* ---- Blueprint diff panel ---- */}
            {resolveResponse?.kind === "blueprint" && diffStats && (
              <Box
                sx={{
                  mx: 2,
                  mb: 1,
                  p: 1.5,
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                  backgroundColor: alpha(theme.palette.warning.main, 0.03),
                }}
              >
                {/* Title + stats */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 1.5,
                  }}
                >
                  <Iconify
                    icon="healthicons:crisis-response-center-person-outline"
                    sx={{ width: 18, height: 18, color: "warning.dark" }}
                  />
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, color: "warning.dark", flex: 1 }}
                  >
                    {resolveResponse.data.title}
                  </Typography>
                  {diffStats.added > 0 && (
                    <Chip
                      label={`+${diffStats.added}`}
                      size="small"
                      sx={{
                        bgcolor: alpha("#2ea44f", 0.15),
                        color: "#2ea44f",
                        fontWeight: 700,
                        border: `1px solid ${alpha("#2ea44f", 0.3)}`,
                      }}
                    />
                  )}
                  {diffStats.modified > 0 && (
                    <Chip
                      label={`~${diffStats.modified}`}
                      size="small"
                      sx={{
                        bgcolor: alpha("#f0883e", 0.15),
                        color: "#f0883e",
                        fontWeight: 700,
                        border: `1px solid ${alpha("#f0883e", 0.3)}`,
                      }}
                    />
                  )}
                  {diffStats.removed > 0 && (
                    <Chip
                      label={`-${diffStats.removed}`}
                      size="small"
                      sx={{
                        bgcolor: alpha("#f85149", 0.15),
                        color: "#f85149",
                        fontWeight: 700,
                        border: `1px solid ${alpha("#f85149", 0.3)}`,
                      }}
                    />
                  )}
                </Box>

                {/* Stacked flow previews */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    mb: 1.5,
                  }}
                >
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        color: "text.secondary",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Current
                    </Typography>
                    <Box sx={{ height: 160 }}>
                      {oldNodes.length > 0 ? (
                        <DiffFlowSvg
                          nodes={oldNodes}
                          changeMap={oldChangeMap}
                          uid={`old-${resolveResponse.data.id}`}
                        />
                      ) : (
                        <Box
                          sx={{
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: 1.5,
                            border: `1px solid ${theme.palette.divider}`,
                            color: "text.disabled",
                          }}
                        >
                          <Typography variant="caption">
                            No blueprint
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "text.disabled",
                    }}
                  >
                    <Iconify
                      icon="solar:arrow-down-bold"
                      sx={{ width: 18, height: 18 }}
                    />
                  </Box>

                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        color: "success.main",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Suggested
                    </Typography>
                    <Box sx={{ height: 160 }}>
                      <DiffFlowSvg
                        nodes={newNodes}
                        changeMap={newChangeMap}
                        uid={`new-${resolveResponse.data.id}`}
                      />
                    </Box>
                  </Box>
                </Box>

                {/* Legend */}
                <Box
                  sx={{ display: "flex", gap: 1.5, mb: 1.5, flexWrap: "wrap" }}
                >
                  {diffStats.added > 0 && (
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: 0.5,
                          bgcolor: "#2ea44f",
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        Added
                      </Typography>
                    </Box>
                  )}
                  {diffStats.modified > 0 && (
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: 0.5,
                          bgcolor: "#f0883e",
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        Modified
                      </Typography>
                    </Box>
                  )}
                  {diffStats.removed > 0 && (
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: 0.5,
                          bgcolor: "#f85149",
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        Removed
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Actions */}
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={handleApproveBlueprint}
                    disabled={isSaving}
                    startIcon={
                      <Iconify
                        icon="solar:check-circle-bold"
                        sx={{ width: 16, height: 16 }}
                      />
                    }
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={handleDismiss}
                    disabled={isSaving}
                    startIcon={
                      <Iconify
                        icon="solar:close-circle-bold"
                        sx={{ width: 16, height: 16 }}
                      />
                    }
                  >
                    Reject
                  </Button>
                </Box>
              </Box>
            )}

            {/* Chat input */}
            <Box
              sx={{ borderTop: `1px solid ${theme.palette.divider}20`, mt: 1 }}
            >
              <InlineChatInput
                onSend={readOnly ? undefined : handleMessageSend}
              />
            </Box>
          </CardContent>
        </Card>
      </Slide>

      <PopupChatWidget
        readOnly={true}
        openPopChat={popChatOpen}
        setOpenPopChat={setPopChatOpen}
        conversationId={supervise.conversationId}
        sessionId={supervise.sessionId}
      />
    </>
  );
};

export default memo(SupervisingChat);
