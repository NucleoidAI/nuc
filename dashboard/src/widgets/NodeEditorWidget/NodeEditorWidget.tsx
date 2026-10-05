import NodeEditorDrawer from "../../components/NodeEditor/NodeEditorDrawer";

import useAgents from "../../hooks/useAgents";
import useBlueprint from "../../hooks/useBlueprint";
import useMCPs from "../../hooks/useMCPs";

import type {
  DefinitionGraph,
  SwitchCase,
} from "../../components/BlueprintFlow/helper";

import React, { useEffect, useState } from "react";

import { getNextNodeId, isValidIntegration } from "./helper";

const NodeEditorWidget = ({
  parameters = {},
  onParametersChange,
  drawerOpen,
  handleDrawerClose,
  selectedParentNode,
  newNodeLabel,
  setNewNodeLabel,
  newNodeInstructions,
  setNewNodeInstructions,
  newNodeQuestion,
  setNewNodeQuestion,
  newNodeDescription,
  setNewNodeDescription,
  newNodePseudocodeEnabled,
  setNewNodePseudocodeEnabled,
  pseudocodeLoading,
  newNodeForce,
  setNewNodeForce,
  newNodeType,
  setNewNodeType,
  newNodeCaseLabel = "",
  setNewNodeCaseLabel,
  switchCases = [],
  setSwitchCases,
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
  handoffTargetAgentId = "",
  setHandoffTargetAgentId,
  handoffTargetBlueprintId = "",
  setHandoffTargetBlueprintId,
  graphData,
}: {
  parameters?: Record<string, unknown>;
  onParametersChange?: (parameters: Record<string, unknown>) => void;
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
  newNodeLabel: string;
  setNewNodeLabel: (label: string) => void;
  newNodeInstructions: string;
  setNewNodeInstructions: (instructions: string) => void;
  newNodeQuestion?: string;
  setNewNodeQuestion?: (question: string) => void;
  newNodeDescription?: string;
  setNewNodeDescription?: (description: string) => void;
  newNodePseudocodeEnabled?: boolean;
  setNewNodePseudocodeEnabled?: (enabled: boolean) => void;
  pseudocodeLoading?: boolean;
  newNodeForce?: boolean;
  setNewNodeForce?: (force: boolean) => void;
  newNodeType: string;
  setNewNodeType: (type: string) => void;
  newNodeCaseLabel?: string;
  setNewNodeCaseLabel?: (label: string) => void;
  switchCases?: SwitchCase[];
  setSwitchCases?: (cases: SwitchCase[]) => void;
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
  agentId: string;
  teamId?: string;
  handoffTargetAgentId?: string;
  setHandoffTargetAgentId?: (id: string) => void;
  handoffTargetBlueprintId?: string;
  setHandoffTargetBlueprintId?: (id: string) => void;
  graphData?: DefinitionGraph | null;
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
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (drawerOpen) {
      setSearchQuery("");
    }
  }, [drawerOpen]);

  const { getMCPs, getActions } = useMCPs();
  const { getTeamAgents } = useAgents();
  const { getBlueprint } = useBlueprint();

  const { agents } = getTeamAgents([]);
  const availableAgents: Array<{ id: string; name: string; icon?: string }> =
    Array.isArray(agents) ? agents : [];

  const { Blueprint: agentBlueprints } = getBlueprint(
    [],
    handoffTargetAgentId || undefined
  );
  const availableAgentBlueprints: Array<{ id: string; title: string }> =
    Array.isArray(agentBlueprints) ? agentBlueprints : [];

  const { mcps } = getMCPs();
  const { actions } = getActions();

  const transformedActions = Array.isArray(actions?.content?.actions)
    ? actions.content.actions
        .filter(
          (action) =>
            action.action !== "PLATFORM:decision" &&
            action.action !== "PLATFORM:switch" &&
            action.action !== "PLATFORM:customer_approval"
        )
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
          outputSchema: action.outputSchema || {
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
  }, [editMode, editingNode, drawerOpen, allIntegrations]);

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

  const nextNodeId = getNextNodeId(selectedParentNode, selectedBranch);

  const hasInheritedNext = !!nextNodeId;

  const caseTargetLabels = Object.fromEntries(
    switchCases.map(({ nodeId }) => [
      nodeId,
      graphData?.nodes?.[nodeId]?.label ?? nodeId,
    ])
  );

  return (
    <NodeEditorDrawer
      parameters={parameters}
      onParametersChange={onParametersChange}
      pseudocode={pseudocode}
      drawerOpen={drawerOpen}
      handleDrawerClose={handleDrawerClose}
      selectedParentNode={selectedParentNode}
      newNodeLabel={newNodeLabel}
      setNewNodeLabel={setNewNodeLabel}
      newNodeInstructions={newNodeInstructions}
      setNewNodeInstructions={setNewNodeInstructions}
      newNodeQuestion={newNodeQuestion}
      setNewNodeQuestion={setNewNodeQuestion}
      newNodeDescription={newNodeDescription}
      setNewNodeDescription={setNewNodeDescription}
      newNodePseudocodeEnabled={newNodePseudocodeEnabled}
      setNewNodePseudocodeEnabled={setNewNodePseudocodeEnabled}
      pseudocodeLoading={pseudocodeLoading}
      newNodeForce={newNodeForce}
      setNewNodeForce={setNewNodeForce}
      newNodeType={newNodeType}
      setNewNodeType={setNewNodeType}
      newNodeCaseLabel={newNodeCaseLabel}
      setNewNodeCaseLabel={setNewNodeCaseLabel}
      switchCases={switchCases}
      setSwitchCases={setSwitchCases}
      caseTargetLabels={caseTargetLabels}
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
      handleSubmit={handleSubmit}
      editMode={editMode}
      availableAgents={availableAgents}
      handoffTargetAgentId={handoffTargetAgentId}
      setHandoffTargetAgentId={setHandoffTargetAgentId}
      handoffTargetBlueprintId={handoffTargetBlueprintId}
      setHandoffTargetBlueprintId={setHandoffTargetBlueprintId}
      availableAgentBlueprints={availableAgentBlueprints}
    />
  );
};

export default NodeEditorWidget;
