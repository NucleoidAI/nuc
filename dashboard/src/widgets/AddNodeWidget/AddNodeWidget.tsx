import AddNodeDrawer from "../../components/AddNode/AddNodeDrawer";
import useIntegrations from "../../hooks/useIntegrations";

import React, { useEffect, useState } from "react";
import { getNextNodeId, isValidIntegration } from "./helper";

const AddNodeWidget = ({
  drawerOpen,
  handleDrawerClose,
  selectedParentNode,
  graphData,
  newNodeLabel,
  setNewNodeLabel,
  newNodeType,
  setNewNodeType,
  selectedBranch,
  setSelectedBranch,
  handleSubmit,
  selectedIntegration,
  setSelectedIntegration,
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
  newNodeType: string;
  setNewNodeType: (type: string) => void;
  selectedBranch: "true" | "false";
  setSelectedBranch: (branch: "true" | "false") => void;
  handleSubmit: () => void;
  selectedIntegration: {
    id: string;
    action: string;
    provider: string;
    description: string;
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
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (drawerOpen) {
      setSearchQuery("");
    }
  }, [drawerOpen]);

  const { getIntegrations } = useIntegrations();

  const { integrations } = getIntegrations();

  const allIntegrations = Array.isArray(integrations?.content.integrations)
    ? integrations.content.integrations.filter(isValidIntegration)
    : [];

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

  return (
    <AddNodeDrawer
      drawerOpen={drawerOpen}
      handleDrawerClose={handleDrawerClose}
      selectedParentNode={selectedParentNode}
      newNodeLabel={newNodeLabel}
      setNewNodeLabel={setNewNodeLabel}
      newNodeType={newNodeType}
      setNewNodeType={setNewNodeType}
      selectedBranch={selectedBranch}
      setSelectedBranch={setSelectedBranch}
      availableIntegrations={allIntegrations}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      selectedIntegration={selectedIntegration}
      setSelectedIntegration={setSelectedIntegration}
      parentIntegration={parentIntegration}
      nextIntegration={nextIntegration}
      handleSubmit={handleSubmit}
    />
  );
};

export default AddNodeWidget;
