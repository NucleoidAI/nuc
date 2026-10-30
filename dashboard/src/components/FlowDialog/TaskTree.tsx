import { DrawerLayout } from "@canmingir/link/layouts";
import { Flow } from "@canmingir/link/platform/components";
import TaskFlowStepDialog from "./TaskFlowStepDialog";
import { taskChartPlugin } from "./TaskChartPlugin";

import { Box, Stack, Typography } from "@mui/material";
import React, { useCallback, useMemo, useState } from "react";
import { buildFieldBindings, buildTimelineGraph } from "./util";

const TaskTree = ({ open, setOpen, treeData }) => {
  const data = useMemo(() => buildTimelineGraph(treeData), [treeData]);

  const [selectedStep, setSelectedStep] = useState(null);
  const [hoveredField, setHoveredField] = useState<string | null>(null);

  const stepCount = Object.keys(data.nodes).length;

  const bindings = useMemo(() => buildFieldBindings(data), [data]);

  const { boundInputsByNode, hiddenFieldsByNode } = useMemo(() => {
    const bound: Record<string, Set<string>> = {};
    const hidden: Record<string, Set<string>> = {};

    const add = (
      map: Record<string, Set<string>>,
      nodeId: string,
      field: string
    ) => {
      if (!map[nodeId]) map[nodeId] = new Set();
      map[nodeId].add(field);
    };

    bindings.forEach(({ sourceNodeId, targetNodeId, field, adjacent }) => {
      add(bound, targetNodeId, field);

      if (!adjacent) {
        add(hidden, targetNodeId, field);
        add(hidden, sourceNodeId, field);
      }
    });

    return { boundInputsByNode: bound, hiddenFieldsByNode: hidden };
  }, [bindings]);

  const visibleBindings = useMemo(
    () =>
      bindings.filter(
        ({ adjacent, field }) => adjacent || field === hoveredField
      ),
    [bindings, hoveredField]
  );

  const flowStyle = useMemo(
    () => ({
      direction: "horizontal" as const,
      showConnections: true,
      onNodeClick: setSelectedStep,
      boundInputsByNode,
      hiddenFieldsByNode,
      onFieldHover: setHoveredField,
    }),
    [boundInputsByNode, hiddenFieldsByNode]
  );

  const labelForBinding = useCallback(
    (binding: { sourceNodeId: string; field: string }) =>
      `"${binding.field}" comes from ${
        data.nodes[binding.sourceNodeId]?.label ?? binding.sourceNodeId
      }`,
    [data]
  );

  return (
    <DrawerLayout
      open={open}
      onClose={() => {
        setOpen(false);
      }}
      mode="wide"
      sx={{
        zIndex: (theme) => theme.zIndex.modal + 2,
      }}
      contentSx={{
        p: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: 3,
          py: 2,
          flexShrink: 0,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
            Task Flow
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {stepCount} {stepCount === 1 ? "step" : "steps"}
          </Typography>
        </Box>
      </Stack>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          '& path[stroke-dasharray="2 4"]': { strokeDasharray: "none" },
        }}
      >
        <Flow
          data={data}
          height={"100%"}
          fitViewOnMount
          fitViewOnNodesChange
          fitViewOnResize
          fitViewMinZoom={0.8}
          style={flowStyle}
          plugin={taskChartPlugin}
          impliedConnections={visibleBindings}
          showImpliedConnections={visibleBindings.length > 0}
          labelForImpliedConnection={labelForBinding}
        />
      </Box>

      <TaskFlowStepDialog
        open={Boolean(selectedStep)}
        onClose={() => setSelectedStep(null)}
        step={selectedStep}
      />
    </DrawerLayout>
  );
};

export default TaskTree;
