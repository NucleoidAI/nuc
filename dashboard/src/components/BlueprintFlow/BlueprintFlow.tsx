import { BlueprintFlowProps } from "./BlueprintFlow.types";
import { Box } from "@mui/material";
import DiffButton from "./DiffPanel/DiffButton";
import { Flow } from "@canmingir/link/platform/components";
import { FlowMiniMap } from "./FlowMiniMap";
import JSONDiffPanel from "./DiffPanel/JSONDiffPanel";
import type { NodeFields } from "./BlueprintFlowPlugin";
import SuccessSnackbar from "./Validation/SuccessSnackbar";
import ValidationButtons from "./Validation/ValidationButtons";
import ValidationErrorView from "./Validation/ValidationErrorView";
import { blueprintFlowPlugin } from "./BlueprintFlowPlugin";
import { isRefValue } from "./helper";
import useAllIntegrations from "../../hooks/useAllIntegrations";

import NodeConnectionOverlay, { type DragState } from "./NodeConnectionOverlay";
import React, { useMemo, useRef, useState } from "react";

export default function BlueprintFlow({
  graphData,
  enrichedGraphData,
  drawerOpen,
  readOnly = false,
  hasLocalChanges,
  hasDifferences,
  validationErrors,
  showDiffPanel,
  showValidationErrors,
  saveSuccess,
  baselineNodes,
  onFlowChange,
  onAddNodeClick,
  onEditNodeClick,
  onSwapBranchClick,
  onDeleteNodeClick,
  onSave,
  onShowDiff,
  onCloseDiff,
  onShowValidationErrors,
  onSaveSuccessChange,
  isSubmitting,
  isSuperviseFlow = false,
  showConnections = false,
  onConnectParameter,
  onDisconnectParameter,
  onToggleForceNode,
}: BlueprintFlowProps) {
  const flowContainerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<DragState | null>(null);
  const allIntegrations = useAllIntegrations();

  const nodeFields: Record<string, NodeFields> = useMemo(() => {
    if (!showConnections || !graphData?.nodes) return {};

    const result: Record<string, NodeFields> = {};
    for (const node of Object.values(graphData.nodes)) {
      if (node.nodeType !== "NORMAL" || !node.action) continue;
      const integration = allIntegrations.find((i) => i.action === node.action);
      if (!integration) continue;

      const inputs = integration.inputSchema?.properties
        ? Object.keys(integration.inputSchema.properties)
        : [];
      const outputs = Array.from(
        new Set([
          ...(integration.outputSchema?.properties
            ? Object.keys(integration.outputSchema.properties)
            : []),
          "result",
        ])
      );

      if (inputs.length || outputs.length) {
        result[node.id] = { inputs, outputs };
      }
    }
    return result;
  }, [showConnections, graphData, allIntegrations]);

  const boundFieldsByNode: Record<string, Set<string>> = useMemo(() => {
    if (!showConnections || !graphData?.nodes) return {};

    const result: Record<string, Set<string>> = {};
    for (const node of Object.values(graphData.nodes)) {
      const params = (
        node.raw?.properties as
          | { parameters?: Record<string, unknown> }
          | undefined
      )?.parameters;
      if (!params) continue;
      const bound = new Set(
        Object.entries(params)
          .filter(([, value]) => isRefValue(value))
          .map(([field]) => field)
      );
      if (bound.size) result[node.id] = bound;
    }
    return result;
  }, [showConnections, graphData]);

  const hasForceNode = useMemo(
    () =>
      Object.values(graphData?.nodes ?? {}).some(
        (node) =>
          (node.raw?.properties as { force?: boolean } | undefined)?.force
      ),
    [graphData]
  );

  return (
    <Box
      ref={flowContainerRef}
      sx={{
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    >
      {!readOnly &&
        baselineNodes.length > 0 &&
        hasDifferences &&
        !drawerOpen && (
          <DiffButton
            onShowDiff={onShowDiff}
            validationErrors={validationErrors}
          />
        )}

      <Flow
        data={enrichedGraphData}
        plugin={blueprintFlowPlugin}
        editable={!readOnly}
        height={"100%"}
        fitViewOnMount
        fitViewOnNodesChange
        fitViewOnResize
        onChange={readOnly ? undefined : onFlowChange}
        variant="horizontal"
        style={() => ({
          direction: "horizontal",
          onAdd: readOnly ? undefined : onAddNodeClick,
          onEdit: readOnly ? undefined : onEditNodeClick,
          onSwapBranch: readOnly ? undefined : onSwapBranchClick,
          onDelete: readOnly ? undefined : onDeleteNodeClick,
          showConnections: !readOnly && showConnections,
          nodeFields,
          boundFieldsByNode,
          hasForceNode,
          onHandleDragStart: (nodeId: string, field: string) =>
            setDragging({ sourceNodeId: nodeId, sourceField: field }),
          onToggleForce: readOnly ? undefined : onToggleForceNode,
        })}
      />

      {!readOnly && showConnections && (
        <NodeConnectionOverlay
          containerRef={flowContainerRef}
          graphData={graphData}
          nodeFields={nodeFields}
          dragging={dragging}
          onDragEnd={() => setDragging(null)}
          onConnect={(binding) => onConnectParameter?.(binding)}
          onDisconnect={(targetNodeId, targetField) =>
            onDisconnectParameter?.(targetNodeId, targetField)
          }
        />
      )}

      {!isSuperviseFlow && (
        <FlowMiniMap
          graphData={graphData}
          flowContainerRef={flowContainerRef}
        />
      )}

      {!readOnly && hasDifferences && !drawerOpen && (
        <ValidationButtons
          validationErrors={validationErrors}
          setShowValidationErrors={onShowValidationErrors}
          handleSaveFlow={onSave}
          isSubmitting={isSubmitting}
          hasLocalChanges={hasLocalChanges}
        />
      )}

      {showValidationErrors && (
        <ValidationErrorView
          validationErrors={validationErrors}
          setShowValidationErrors={onShowValidationErrors}
        />
      )}

      <JSONDiffPanel
        savedNodes={baselineNodes}
        aiGeneratedFlow={null}
        currentGraphData={graphData}
        open={showDiffPanel}
        onClose={onCloseDiff}
      />

      <SuccessSnackbar
        saveSuccess={saveSuccess}
        setSaveSuccess={onSaveSuccessChange}
      />
    </Box>
  );
}
