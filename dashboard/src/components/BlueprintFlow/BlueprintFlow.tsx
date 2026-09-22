import { BlueprintFlowProps } from "./BlueprintFlow.types";
import { Box } from "@mui/material";
import DiffButton from "./DiffPanel/DiffButton";
import JSONDiffPanel from "./DiffPanel/JSONDiffPanel";
import type { NodeFields } from "./BlueprintFlowPlugin";
import SuccessSnackbar from "./Validation/SuccessSnackbar";
import ValidationButtons from "./Validation/ValidationButtons";
import ValidationErrorView from "./Validation/ValidationErrorView";
import { blueprintFlowPlugin } from "./BlueprintFlowPlugin";
import { definitionGraphToRawNodes } from "./miniTypes";
import useAllIntegrations from "../../hooks/useAllIntegrations";
import { Flow, FlowMiniMap } from "@canmingir/link/platform/components";

import NodeConnectionOverlay, { type DragState } from "./NodeConnectionOverlay";
import { useCallback, useMemo, useRef, useState } from "react";

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
  onOverrideParameter,
  onToggleForceNode,
  liteMode = false,
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
        result[node.id] = {
          inputs,
          outputs,
          inputProperties: integration.inputSchema?.properties,
        };
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
          .filter(([, value]) => value !== undefined)
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

  const impliedConnections = useMemo(() => {
    if (!showConnections || !graphData?.nodes) return [];

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

    const explicit = new Set<string>();
    for (const node of Object.values(graphData.nodes)) {
      const bound = boundFieldsByNode[node.id];
      if (!bound) continue;
      for (const field of bound) explicit.add(`${node.id}:${field}`);
    }

    const result: {
      sourceNodeId: string;
      targetNodeId: string;
      field: string;
    }[] = [];

    for (const node of Object.values(graphData.nodes)) {
      if (node.nodeType !== "NORMAL") continue;
      const isForce = Boolean(
        (node.raw?.properties as { force?: boolean } | undefined)?.force
      );
      if (isForce) continue;

      const targetFields = nodeFields[node.id];
      if (!targetFields?.inputs.length) continue;

      const parents = parentsById.get(node.id);
      if (!parents?.size) continue;

      for (const field of targetFields.inputs) {
        if (explicit.has(`${node.id}:${field}`)) continue;

        for (const parentId of parents) {
          if (nodeFields[parentId]?.outputs.includes(field)) {
            result.push({
              sourceNodeId: parentId,
              targetNodeId: node.id,
              field,
            });
          }
        }
      }
    }

    return result;
  }, [showConnections, graphData, nodeFields, boundFieldsByNode]);

  const labelForImpliedConnection = useCallback(
    (b: { sourceNodeId: string; field: string }) =>
      `"${b.field}" is passed implicitly from ${
        graphData.nodes[b.sourceNodeId]?.label ?? b.sourceNodeId
      } by matching name — mark this node as a force node to bind it explicitly.`,
    [graphData]
  );

  const miniMapNodes = useMemo(
    () => (graphData ? definitionGraphToRawNodes(graphData) : []),
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
        fitViewMinZoom={0.8}
        fitViewAlign="start"
        onChange={readOnly ? undefined : onFlowChange}
        variant="horizontal"
        impliedConnections={impliedConnections}
        showImpliedConnections={
          !readOnly && showConnections && impliedConnections.length > 0
        }
        labelForImpliedConnection={labelForImpliedConnection}
        layout="dag"
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
          onOverrideParameter: readOnly ? undefined : onOverrideParameter,
          liteMode,
        })}
      />

      {!readOnly && showConnections && (
        <NodeConnectionOverlay
          containerRef={flowContainerRef}
          graphData={graphData}
          dragging={dragging}
          onDragEnd={() => setDragging(null)}
          onConnect={(binding) => onConnectParameter?.(binding)}
          onDisconnect={(targetNodeId, targetField) =>
            onDisconnectParameter?.(targetNodeId, targetField)
          }
        />
      )}

      {!isSuperviseFlow && (
        <FlowMiniMap nodes={miniMapNodes} flowContainerRef={flowContainerRef} />
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
