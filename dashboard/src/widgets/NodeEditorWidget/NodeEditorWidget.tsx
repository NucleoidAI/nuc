import NodeEditorDrawer from "../../components/NodeEditor/NodeEditorDrawer";
import useMCPs from "../../hooks/useMCPs";

import React, { useEffect, useState } from "react";
import { getNextNodeId, isValidIntegration } from "./helper";

const NodeEditorWidget = ({
  drawerOpen,
  handleDrawerClose,
  selectedParentNode,
  graphData,
  newNodeLabel,
  setNewNodeLabel,
  newNodePrompt,
  setNewNodePrompt,
  newNodeType,
  setNewNodeType,
  selectedBranch,
  setSelectedBranch,
  inheritedNextBranch = "none",
  setInheritedNextBranch = () => {},
  handleSubmit,
  selectedIntegration,
  setSelectedIntegration,
  editMode,
  editingNode,
  pseudocode,
  agentId,
  blueprintId,
  teamId,
}: {
  drawerOpen: boolean;
  handleDrawerClose: () => void;
  selectedParentNode: {
    id: string;
    label?: string;
    action?: string;
    nodeType?: string;
    next?: string | string[];
    trueNext?: string[];
    falseNext?: string[];
  };
  graphData: {
    nodes: Record<
      string,
      {
        id: string;
        label?: string;
        action?: string;
        nodeType?: string;
        next?: string | string[];
        trueNext?: string[];
        falseNext?: string[];
      }
    >;
    roots: string[];
  };
  newNodeLabel: string;
  setNewNodeLabel: (label: string) => void;
  newNodePrompt: string;
  setNewNodePrompt: (prompt: string) => void;
  newNodeType: string;
  setNewNodeType: (type: string) => void;
  selectedBranch: "true" | "false";
  setSelectedBranch: (branch: "true" | "false") => void;
  inheritedNextBranch?: "true" | "false" | "none";
  setInheritedNextBranch?: (branch: "true" | "false" | "none") => void;
  handleSubmit: () => void;
  selectedIntegration: {
    id: string;
    action: string;
    provider: string;
    description: string;
    icon: string;
    direction: string;
    lib: string;
    inputSchema: {
      type?: string;
      properties?: Record<
        string,
        {
          type: string;
          description?: string;
          nullable?: boolean;
        }
      >;
    };
    outputSchema?: {
      type?: string;
      properties?: Record<
        string,
        {
          type: string;
          description?: string;
          nullable?: boolean;
        }
      >;
    };
  };
  setSelectedIntegration: (integration) => void;
  editMode?: boolean;
  editingNode?: {
    id: string;
    label?: string;
    action?: string;
    nodeType?: string;
    properties?: {
      label?: string;
      action?: string;
      description?: string;
      icon?: string;
    };
    raw?: {
      id?: string;
      type?: string;
      properties?: {
        label?: string;
        action?: string;
        description?: string;
        icon?: string;
      };
      next?: string | string[];
      true?: string[];
      false?: string[];
      trueNext?: string[];
      falseNext?: string[];
      createdAt?: string;
    };
  };
  pseudocode?: string;
  agentId: string;
  blueprintId?: string;
  teamId?: string;
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (drawerOpen) {
      setSearchQuery("");
    }
  }, [drawerOpen]);

  const { getMCPs, getActions } = useMCPs();

  const { mcps } = getMCPs();
  const { actions } = getActions();

  const transformedActions = Array.isArray(actions?.content?.actions)
    ? actions.content.actions
        .filter((action) => action.action !== "PLATFORM:decision")
        .map((action) => ({
          id: action.action,
          action: action.action,
          provider: "PLATFORM",
          description:
            action.description || action.action.replace("PLATFORM:", ""),
          icon: action.icon || "",
          direction: "internal",
          lib: action.lib || "",
          inputSchema: action.inputSchema || {
            type: "object",
            properties: {},
          },
          outputSchema: {
            type: "object",
            properties: {},
          },
        }))
    : [];

  const integrationsList = Array.isArray(mcps?.content.mcps)
    ? mcps.content.mcps.filter(isValidIntegration)
    : [];

  const allIntegrations = [...transformedActions, ...integrationsList];

  useEffect(() => {
    if (editMode && editingNode && drawerOpen) {
      const nodeAction =
        editingNode?.action || editingNode?.raw?.properties?.action;
      if (nodeAction && allIntegrations.length > 0) {
        const currentIntegration = allIntegrations.find(
          (int) => int.action === nodeAction
        );
        if (currentIntegration) {
          setSelectedIntegration(currentIntegration);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode, editingNode, drawerOpen]);

  const filteredIntegrations = searchQuery
    ? allIntegrations.filter(
        (integration) =>
          integration.action
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          integration.provider
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          integration.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
      )
    : allIntegrations;

  const parentIntegration = selectedParentNode?.action
    ? allIntegrations.find(
        (integration) => integration?.action === selectedParentNode?.action
      )
    : null;

  const nextNodeId = getNextNodeId(selectedParentNode, selectedBranch);
  const nextNode = nextNodeId && graphData?.nodes?.[nextNodeId];
  const nextIntegration = nextNode?.action
    ? allIntegrations.find(
        (integration) => integration?.action === nextNode.action
      )
    : null;

  const hasInheritedNext = !!nextNodeId;

  return (
    <NodeEditorDrawer
      pseudocode={pseudocode}
      drawerOpen={drawerOpen}
      handleDrawerClose={handleDrawerClose}
      selectedParentNode={selectedParentNode}
      newNodeLabel={newNodeLabel}
      setNewNodeLabel={setNewNodeLabel}
      newNodePrompt={newNodePrompt}
      setNewNodePrompt={setNewNodePrompt}
      newNodeType={newNodeType}
      setNewNodeType={setNewNodeType}
      selectedBranch={selectedBranch}
      setSelectedBranch={setSelectedBranch}
      inheritedNextBranch={inheritedNextBranch}
      setInheritedNextBranch={setInheritedNextBranch}
      hasInheritedNext={hasInheritedNext}
      availableIntegrations={filteredIntegrations}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      selectedIntegration={selectedIntegration}
      setSelectedIntegration={setSelectedIntegration}
      parentIntegration={parentIntegration}
      nextIntegration={nextIntegration}
      handleSubmit={handleSubmit}
      editMode={editMode}
    />
  );
};

export default NodeEditorWidget;
