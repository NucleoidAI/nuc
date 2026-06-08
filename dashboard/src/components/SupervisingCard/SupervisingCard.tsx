import BlueprintDrawer from "../BlueprintDrawer/BlueprintDrawer";
import { Iconify } from "@canmingir/link/platform/components";
import SupervisingChat from "../SupervisingChat";
import SupervisingTypeDialog from "../SupervisingTypeDialog";
import useBlueprint from "../../hooks/useBlueprint";
import { useEvent } from "@nucleoidai/react-event";
import useTasks from "../../hooks/useTasks";

import {
  Box,
  Card,
  Chip,
  Divider,
  Fab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";

const SupervisingCard = ({
  supervise,
  agentId,
}: {
  supervise: {
    id: string;
    question?: string;
    answer?: string;
    status: string;
    blueprintId?: string;
    taskId?: string;
  };
  agentId?: string;
}) => {
  const [knowledgeChatOpen, setKnowledgeChatOpen] = useState(false);

  const [aiResponse, setAiResponse] = useState(null);

  const [blueprintDrawerOpen, setBlueprintDrawerOpen] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);

  const { getBlueprintWithId } = useBlueprint();

  const [blueprintSelectedItem, setBlueprintSelectedItem] = useState(null);

  const { blueprint } = getBlueprintWithId(supervise.blueprintId || "");

  const [aiResponded] = useEvent("AI_RESPONDED", null);

  const { getSteps, steps } = useTasks(agentId, [aiResponded]);

  useEffect(
    () => {
      if (supervise.taskId) {
        getSteps(supervise.taskId);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [supervise.taskId, aiResponded]
  );

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleSelectKnowledge = () => {
    setDialogOpen(false);
    setKnowledgeChatOpen(true);
  };

  const handleSelectBlueprint = (blueprint: {
    id: string;
    title: string;
    description: string;
    agentId: string;
  }) => {
    setDialogOpen(false);
    setBlueprintDrawerOpen(true);
    setBlueprintSelectedItem(blueprint);
  };

  const { usedNodeIds, lastUsedNodeId, failedNodeId } = useMemo(() => {
    if (!steps || steps.length === 0 || !blueprint?.nodes)
      return {
        usedNodeIds: new Set<string>(),
        lastUsedNodeId: null as string | null,
        failedNodeId: null as string | null,
      };

    let askSupervisorIndex = -1;
    for (let i = steps.length - 1; i >= 0; i--) {
      if (steps[i]?.action === "PLATFORM:ask_supervisor") {
        askSupervisorIndex = i;
        break;
      }
    }

    const stepsBeforeAsk =
      askSupervisorIndex > 0 ? steps.slice(0, askSupervisorIndex) : steps;

    const nodeMap = new Map<string, (typeof blueprint.nodes)[number]>();
    blueprint.nodes.forEach((node) => nodeMap.set(node.id, node));

    const referencedIds = new Set<string>();
    blueprint.nodes.forEach((node) => {
      (node.next || []).forEach((id: string) => referencedIds.add(id));
      (node.true || []).forEach((id: string) => referencedIds.add(id));
      (node.false || []).forEach((id: string) => referencedIds.add(id));
    });

    let possibleNextIds = new Set<string>(
      blueprint.nodes.filter((n) => !referencedIds.has(n.id)).map((n) => n.id)
    );

    const getChildren = (node: (typeof blueprint.nodes)[number]) => {
      const next = Array.isArray(node.next)
        ? node.next
        : node.next
        ? [node.next]
        : [];
      return new Set<string>([
        ...next,
        ...(node.true || []),
        ...(node.false || []),
      ]);
    };

    const stepActions = new Set(
      stepsBeforeAsk.map((s) => s?.action).filter(Boolean)
    );

    const expandFrontier = (ids: Set<string>): Set<string> => {
      const expanded = new Set<string>();
      const queue = [...ids];
      const visited = new Set<string>();

      while (queue.length > 0) {
        const id = queue.shift()!;
        if (visited.has(id)) continue;
        visited.add(id);

        const node = nodeMap.get(id);
        if (!node) continue;

        if (stepActions.has(node.properties?.action)) {
          expanded.add(id);
        } else {
          for (const childId of getChildren(node)) {
            if (!visited.has(childId)) queue.push(childId);
          }
        }
      }

      return expanded;
    };

    const usedIds = new Set<string>();
    let lastId: string | null = null;
    let failedId: string | null = null;

    possibleNextIds = expandFrontier(possibleNextIds);

    for (const step of stepsBeforeAsk) {
      if (!step?.action) continue;

      let matched: (typeof blueprint.nodes)[number] | null = null;
      for (const nodeId of possibleNextIds) {
        const node = nodeMap.get(nodeId);
        if (node?.properties?.action === step.action) {
          matched = node;
          break;
        }
      }

      if (matched) {
        const isDecisionNode =
          matched.type === "CONDITION" ||
          matched.properties?.action === "PLATFORM:decision";
        if (step.status === "FAILED") {
          failedId = matched.id;
        } else if (!isDecisionNode) {
          usedIds.add(matched.id);
          lastId = matched.id;
        }

        possibleNextIds = expandFrontier(getChildren(matched));
      }
    }

    blueprint.nodes.forEach((node: (typeof blueprint.nodes)[number]) => {
      if (
        node.type !== "CONDITION" &&
        node.properties?.action !== "PLATFORM:decision"
      )
        return;
      const children = getChildren(node);
      const anyChildUsed = [...children].some((childId) => {
        const child = nodeMap.get(childId);
        return child && usedIds.has(childId);
      });
      if (anyChildUsed) {
        usedIds.add(node.id);
      }
    });

    return {
      usedNodeIds: usedIds,
      lastUsedNodeId: failedId ? null : lastId,
      failedNodeId: failedId,
    };
  }, [steps, blueprint]);

  return (
    <>
      <Card
        data-cy="supervise-card"
        sx={{
          borderLeft: "4px solid #2196f3",
          backgroundColor: "background.paper",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            gap: 2,
            padding: 2,
            minHeight: 180,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              flex: 4,
              minHeight: 0,
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                gap: 1,
                alignItems: "center",
                minHeight: 32,
              }}
            >
              {supervise.blueprintId && blueprint?.title && (
                <Chip
                  icon={
                    <Iconify
                      icon="healthicons:crisis-response-center-person-outline"
                      sx={{ width: 16, height: 16 }}
                      color="inherit"
                      style={{ color: "#ff9800" }}
                    />
                  }
                  label={blueprint.title}
                  size="small"
                  sx={{
                    backgroundColor: "rgba(255, 152, 0, 0.1)",
                    color: "#ff9800",
                    fontWeight: 500,
                    border: "1px solid rgba(255, 152, 0, 0.3)",
                  }}
                />
              )}
            </Box>

            <Box
              sx={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                paddingLeft: 0.5,
                pt: 1,
                pb: 1,
              }}
            >
              <Typography sx={{ fontWeight: 500 }}>
                {supervise.question}
              </Typography>
            </Box>

            <TextField
              data-cy="supervising-answer"
              variant="outlined"
              label="Answer"
              value={supervise.answer ? `${supervise.answer}` : ""}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-input": {
                  cursor: "default",
                },
              }}
              slotProps={{
                input: {
                  readOnly: true,
                  style: { cursor: "text" },
                },
              }}
            />
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 2,
            }}
          >
            <TableContainer>
              <Table
                size="small"
                sx={{
                  tableLayout: "fixed",
                  width: "120px",
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ textAlign: "center" }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ textAlign: "center" }}>
                      <Typography
                        sx={{
                          mt: 1,
                        }}
                      >
                        {(() => {
                          switch (supervise.status) {
                            case "IN_PROGRESS":
                              return "In Progress";
                            case "ANSWERED":
                              return "Answered";
                            default:
                              return supervise.status;
                          }
                        })()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Tooltip title="Open supervising options">
              <Fab
                sx={{
                  alignSelf: "center",
                  textAlign: "center",
                }}
                color="inherit"
                onClick={handleOpenDialog}
              >
                <Iconify
                  icon={
                    supervise.status === "IN_PROGRESS"
                      ? "solar:reply-2-bold-duotone"
                      : "solar:check-read-line-duotone"
                  }
                  sx={{ width: 26, height: 26 }}
                />
              </Fab>
            </Tooltip>
          </Box>
        </Box>
      </Card>
      <SupervisingTypeDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSelectKnowledge={handleSelectKnowledge}
        onSelectBlueprint={(blueprint) => handleSelectBlueprint(blueprint)}
        blueprint={blueprint}
        usedNodeIds={usedNodeIds}
        lastUsedNodeId={lastUsedNodeId}
        failedNodeId={failedNodeId}
        supervise={supervise}
      />
      <SupervisingChat
        open={knowledgeChatOpen}
        handleClose={() => setKnowledgeChatOpen(false)}
        supervise={supervise}
      />
      <BlueprintDrawer
        drawerOpen={blueprintDrawerOpen}
        handleDrawerClose={() => setBlueprintDrawerOpen(false)}
        selectedItem={blueprintSelectedItem}
        taskId={supervise.taskId}
        setSelectedItem={setBlueprintSelectedItem}
        setAiResponse={setAiResponse}
        aiResponse={aiResponse}
        usedNodeIds={usedNodeIds}
        lastUsedNodeId={lastUsedNodeId}
        failedNodeId={failedNodeId}
      />
    </>
  );
};

export default SupervisingCard;
