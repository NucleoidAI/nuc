import ApiFieldsPanel from "../ApiNode/ApiFieldsPanel";
import NodeInputOverride from "./NodeInputOverride";

import {
  ActionButtonWrapper,
  ChangeBadge,
  ChangeLabel,
  ForceBadge,
  ForceIndicatorWrapper,
  HighlightOverlay,
  NodeWrapper,
  StatusBadge,
  StatusLabel,
} from "./BlueprintFlowPlugin.styles";
import {
  ConnectionsPanel,
  Iconify,
  InfoNode,
  handleDataAttrs,
} from "@canmingir/link/platform/components";
import {
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  type NodeFields,
  isApiNode,
  truncateDescription,
} from "./BlueprintFlowPlugin.helpers";
import React, { useState } from "react";

type FlowGraphNode = import("./helper").DefinitionGraphNode & {
  changeType?: string;
  hasError?: boolean;
  isUsed?: boolean;
  isLastUsed?: boolean;
  isFailed?: boolean;
  isSelected?: boolean;
  [key: string]: unknown;
};

const DECISION_ENDPOINT_LAYOUT_VARIANT: "split-icon-panel" | undefined =
  "split-icon-panel";

function NodeHandles({
  node,
  fields,
  boundFields,
  hasForceNode,
  liteMode,
  onHandleDragStart,
  onOverrideParameter,
}: {
  node: FlowGraphNode;
  fields: NodeFields;
  boundFields?: Set<string>;
  hasForceNode?: boolean;
  liteMode?: boolean;
  onOverrideParameter?: (nodeId: string, field: string, value: unknown) => void;
  onHandleDragStart?: (
    nodeId: string,
    field: string,
    e: React.MouseEvent
  ) => void;
}) {
  const isForceTarget =
    node.nodeType === "END" ||
    Boolean(liteMode) ||
    Boolean((node.raw?.properties as { force?: boolean } | undefined)?.force);

  const inputs = fields.inputs.map((field) => ({
    name: field,
    bound: boundFields?.has(field) ?? false,
    interactive: isForceTarget,
    title: isForceTarget ? `Input: ${field}` : undefined,
    dataAttrs: {
      ...handleDataAttrs("in", node.id, field),
      "data-in-handle": "",
      ...(isForceTarget ? { "data-in-bindable": "" } : {}),
    },
  }));

  const outputs = fields.outputs.map((field) => ({
    name: field,
    interactive: Boolean(hasForceNode),
    title: hasForceNode
      ? `Output: ${field === "result" ? "result (raw)" : field}`
      : undefined,
    dataAttrs: handleDataAttrs("out", node.id, field),
    onHandleMouseDown: hasForceNode
      ? (e: React.MouseEvent) => {
          e.stopPropagation();
          e.preventDefault();
          onHandleDragStart?.(node.id, field, e);
        }
      : undefined,
  }));

  const renderLabel = (name: string, side: "in" | "out") => {
    if (side !== "in" || !onOverrideParameter) return name;

    const schema = fields.inputProperties?.[name];
    if (!schema) return name;

    return (
      <NodeInputOverride
        field={name}
        schema={schema}
        parameters={node.raw?.properties?.parameters ?? {}}
        onChange={(value) => onOverrideParameter(node.id, name, value)}
      />
    );
  };

  if (fields.apiFields) {
    const isRequest = node.nodeType === "START";

    return (
      <ApiFieldsPanel
        side={isRequest ? "out" : "in"}
        title={isRequest ? "Request" : "Response"}
        fields={fields.apiFields}
        handles={isRequest ? outputs : inputs}
        renderLabel={(name) => renderLabel(name, isRequest ? "out" : "in")}
        sx={{ mt: -1, ml: 0.6 }}
      />
    );
  }

  return (
    <ConnectionsPanel
      inputs={inputs}
      outputs={outputs}
      renderLabel={renderLabel}
      sx={{ mt: -1, ml: 0.6 }}
    />
  );
}

export default function FlowNodeRenderer({
  node,
  nodeStyle,
}: {
  node: FlowGraphNode;
  nodeStyle?: {
    onAdd?: (node: FlowGraphNode) => void;
    onEdit?: (node: FlowGraphNode) => void;
    onSwapBranch?: (node: FlowGraphNode) => void;
    onDelete?: (node: FlowGraphNode) => void;
    showConnections?: boolean;
    nodeFields?: Record<string, NodeFields>;
    boundFieldsByNode?: Record<string, Set<string>>;
    hasForceNode?: boolean;
    onHandleDragStart?: (
      nodeId: string,
      field: string,
      e: React.MouseEvent
    ) => void;
    onToggleForce?: (node: FlowGraphNode) => void;
    onOverrideParameter?: (
      nodeId: string,
      field: string,
      value: unknown
    ) => void;
    liteMode?: boolean;
    [key: string]: unknown;
  };
}) {
  const {
    onAdd,
    onEdit,
    onSwapBranch,
    onDelete,
    showConnections,
    nodeFields,
    boundFieldsByNode,
    hasForceNode,
    onHandleDragStart,
    onToggleForce,
    onOverrideParameter,
    liteMode,
  } = nodeStyle || {};
  const isLocked = isApiNode(node);
  const canAddChild = node.nodeType !== "END";
  const fields =
    node.nodeType === "NORMAL" || isLocked ? nodeFields?.[node.id] : undefined;
  const isForceNode = Boolean(
    (node.raw?.properties as { force?: boolean } | undefined)?.force
  );
  const isDecisionNode =
    node.nodeType === "APPROVAL" ||
    node.nodeType === "SWITCH" ||
    node.connectorType === "decision";
  const isEndpointNode =
    node.nodeType === "START" ||
    node.nodeType === "END" ||
    node.action === "PLATFORM:complete";
  const isCompleteNode = node.action === "PLATFORM:complete";
  const infoNode = isDecisionNode
    ? { ...node, description: truncateDescription(node.description) }
    : node;
  const isReadOnly =
    isCompleteNode || (!onAdd && !onEdit && !onSwapBranch && !onDelete);
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
  } | null>(null);

  const changeType = node.changeType;
  const hasError = node.hasError;
  const isUsed = node.isUsed;
  const isLastUsed = node.isLastUsed;
  const isFailed = node.isFailed;
  const isSelected = node.isSelected;

  const handleContextMenu = (e: React.MouseEvent) => {
    if (isReadOnly) return;
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ mouseX: e.clientX, mouseY: e.clientY });
  };

  const handleMouseDownCapture = (e: React.MouseEvent) => {
    if (e.button === 2) {
      e.stopPropagation();
    }
  };

  const handleClose = () => setContextMenu(null);

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAdd?.(node);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(node);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(node);
  };

  const handleToggleForceClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleForce?.(node);
  };

  return (
    <NodeWrapper
      isApproval={node.nodeType === "APPROVAL"}
      isDecision={isDecisionNode}
      isEndpoint={isEndpointNode}
      isEndpointStart={node.nodeType === "START"}
      title={isForceNode ? "Force node: action is guaranteed" : undefined}
      onContextMenu={handleContextMenu}
      onMouseDownCapture={handleMouseDownCapture}
    >
      {isForceNode && isReadOnly && (
        <ForceIndicatorWrapper
          readonly
          title="Force node: action is guaranteed"
        >
          <Iconify icon="mdi:lightning-bolt" width={16} height={16} />
        </ForceIndicatorWrapper>
      )}
      {isForceNode && !liteMode && changeType && changeType !== "unchanged" && (
        <ForceBadge>
          <Iconify icon="mdi:lightning-bolt" width={11} height={11} />
          force
        </ForceBadge>
      )}
      {showConnections &&
        fields &&
        (fields.inputs.length > 0 || fields.outputs.length > 0) && (
          <NodeHandles
            node={node}
            fields={fields}
            boundFields={boundFieldsByNode?.[node.id]}
            hasForceNode={hasForceNode}
            liteMode={liteMode}
            onHandleDragStart={onHandleDragStart}
            onOverrideParameter={isReadOnly ? undefined : onOverrideParameter}
          />
        )}
      <HighlightOverlay
        changetype={changeType}
        haserror={hasError ? "true" : "false"}
        isused={isUsed ? "true" : "false"}
        islastused={isLastUsed ? "true" : "false"}
        isfailed={isFailed ? "true" : "false"}
        isselected={isSelected ? "true" : "false"}
      />
      {hasError ? (
        <>
          <StatusLabel variant="error" />
          <StatusBadge variant="error" />
        </>
      ) : isFailed ? (
        <>
          <StatusLabel variant="failed" />
          <StatusBadge variant="failed" />
        </>
      ) : isLastUsed ? (
        <>
          <StatusLabel variant="supervise" />
          <StatusBadge variant="supervise" />
        </>
      ) : isUsed ? (
        <>
          <StatusLabel variant="used" />
          <StatusBadge variant="used" />
        </>
      ) : (
        changeType &&
        changeType !== "unchanged" && (
          <>
            <ChangeLabel changetype={changeType} />
            <ChangeBadge changetype={changeType} />
          </>
        )
      )}
      <InfoNode node={infoNode} nodeStyle={nodeStyle}>
        {!isReadOnly && (
          <>
            {!isLocked && (
              <ActionButtonWrapper
                position="delete"
                hoverColor="error"
                onClick={handleDeleteClick}
                title="Delete node"
              >
                <Iconify icon="mdi:delete-outline" width={16} height={16} />
              </ActionButtonWrapper>
            )}
            <ActionButtonWrapper
              position="edit"
              onClick={handleEditClick}
              title="Edit node"
            >
              <Iconify icon="mdi:pencil" width={16} height={16} />
            </ActionButtonWrapper>
            {isForceNode && (
              <ForceIndicatorWrapper title="Force node: action is guaranteed">
                <Iconify icon="mdi:lightning-bolt" width={16} height={16} />
              </ForceIndicatorWrapper>
            )}
            {canAddChild && (
              <ActionButtonWrapper
                position="add"
                onClick={handleAddClick}
                title="Add child node"
              >
                <Iconify icon="mdi:plus" width={16} height={16} />
              </ActionButtonWrapper>
            )}
          </>
        )}
      </InfoNode>

      {!isReadOnly && (
        <Menu
          open={contextMenu !== null}
          onClose={handleClose}
          anchorReference="anchorPosition"
          anchorPosition={
            contextMenu !== null
              ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
              : undefined
          }
          sx={{ zIndex: (theme) => theme.zIndex.modal + 3 }}
          slotProps={{ paper: { sx: { minWidth: 180 } } }}
        >
          {canAddChild && (
            <MenuItem
              onClick={(e) => {
                handleAddClick(e);
                handleClose();
              }}
            >
              <ListItemIcon>
                <Iconify icon="mdi:plus" width={18} height={18} />
              </ListItemIcon>
              <ListItemText>Add child node</ListItemText>
            </MenuItem>
          )}
          <MenuItem
            onClick={(e) => {
              handleEditClick(e);
              handleClose();
            }}
          >
            <ListItemIcon>
              <Iconify icon="mdi:pencil" width={18} height={18} />
            </ListItemIcon>
            <ListItemText>Edit node</ListItemText>
          </MenuItem>
          {onToggleForce && !isLocked && (
            <MenuItem
              onClick={(e) => {
                handleToggleForceClick(e);
                handleClose();
              }}
            >
              <ListItemIcon>
                <Iconify
                  icon={
                    isForceNode
                      ? "mdi:lightning-bolt"
                      : "mdi:lightning-bolt-outline"
                  }
                  width={18}
                  height={18}
                />
              </ListItemIcon>
              <ListItemText>
                {isForceNode ? "Unmark force node" : "Mark as force node"}
              </ListItemText>
            </MenuItem>
          )}
          {!isLocked && <Divider />}
          {!isLocked && (
            <MenuItem
              onClick={(e) => {
                handleDeleteClick(e);
                handleClose();
              }}
              sx={{ color: "error.main" }}
            >
              <ListItemIcon sx={{ color: "error.main" }}>
                <Iconify icon="mdi:delete-outline" width={18} height={18} />
              </ListItemIcon>
              <ListItemText>Delete node</ListItemText>
            </MenuItem>
          )}
        </Menu>
      )}
    </NodeWrapper>
  );
}

export { DECISION_ENDPOINT_LAYOUT_VARIANT };
export type { FlowGraphNode };
