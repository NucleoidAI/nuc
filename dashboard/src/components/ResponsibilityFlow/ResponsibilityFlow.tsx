import AddNodeWidget from "../../widgets/AddNodeWidget/AddNodeWidget";
import { Box } from "@mui/material";
import { Flow } from "@canmingir/link/platform/components";
import SuccessSnackbar from "./SuccessSnackbar";
import ValidationButtons from "./ValidationButtons";
import ValidationErrorView from "./ValidationErrorView";
import { buildDefinitionGraph } from "./helper";
import { responsibilityChartPlugin } from "./ResponsibilityFlowPlugin";
import useIntegrations from "../../hooks/useIntegrations";
import useResponsibility from "../../hooks/useResponsibility";
import { v4 as uuid } from "uuid";
import { validateFlow } from "./validation";

import React, { useEffect, useState } from "react";

function ResponsibilityFlow({ aiResponse, setAiResponse, responsibility }) {
  const [graphData, setGraphData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLocalChanges, setHasLocalChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { getResponsibilityWithNode, upsertResponsibility } =
    useResponsibility();
  const { responsibilityNodes, loading } = getResponsibilityWithNode(
    responsibility?.id
  );
  const { getIntegrations } = useIntegrations();
  const { integrations } = getIntegrations();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedParentNode, setSelectedParentNode] = useState(null);
  const [newNodeLabel, setNewNodeLabel] = useState("");
  const [newNodeType, setNewNodeType] = useState("NORMAL");
  const [selectedBranch, setSelectedBranch] = useState<"true" | "false">(
    "true"
  );
  const [selectedIntegration, setSelectedIntegration] = useState({
    id: "",
    action: "",
    provider: "",
    description: "",
    direction: "",
    lib: "",
    inputSchema: {
      type: "object",
      properties: {},
    },
    outputSchema: {
      type: "object",
      properties: {},
    },
  });

  const getFlowDimensions = () => {
    return { width: "100%", height: "100%" };
  };

  useEffect(() => {
    if (aiResponse?.flow) {
      const cleanData = buildDefinitionGraph(aiResponse.flow);
      setGraphData(cleanData);
    } else if (responsibilityNodes) {
      const initialData = buildDefinitionGraph(responsibilityNodes);
      setGraphData(initialData);
      setHasLocalChanges(false);
    }
  }, [responsibilityNodes, aiResponse]);

  useEffect(() => {
    if (loading) setIsLoading(false);
  }, [loading]);

  useEffect(() => {
    if (graphData && integrations?.content?.integrations) {
      const validationResult = validateFlow(
        graphData,
        integrations.content.integrations
      );
      setValidationErrors(validationResult.errors);

      if (validationResult.errors.length === 0 && showValidationErrors) {
        setShowValidationErrors(false);
      }
    }
  }, [graphData, integrations, showValidationErrors]);

  const handleAddNodeClick = (node) => {
    setSelectedParentNode(node);
    setNewNodeLabel("");
    setNewNodeType("NORMAL");
    setSelectedBranch("true");
    setShowValidationErrors(false);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedParentNode(null);
    setNewNodeLabel("");
    setNewNodeType("NORMAL");
    setSelectedBranch("true");
    setSelectedIntegration({
      id: "",
      action: "",
      provider: "",
      description: "",
      direction: "",
      lib: "",
      inputSchema: {
        type: "object",
        properties: {},
      },
      outputSchema: {
        type: "object",
        properties: {},
      },
    });
  };

  const handleAddNode = () => {
    if (!selectedParentNode) return;

    const newId = uuid();
    const currentTime = new Date().toISOString();

    const nodeIcon =
      newNodeType === "CONDITION"
        ? "mdi:help-circle-outline"
        : "mdi:cube-outline";
    const actionType =
      newNodeType === "CONDITION"
        ? "PLATFORM:decision"
        : selectedIntegration?.action;

    const descriptionText =
      newNodeType === "CONDITION"
        ? "A decision node that branches the flow based on conditions."
        : selectedIntegration?.description || "";

    setGraphData((prevData) => {
      const currentNodes = { ...prevData.nodes };
      const parentId = selectedParentNode.id;
      const parentNode = currentNodes[parentId];

      if (!parentNode) return prevData;

      const isParentCondition = parentNode.nodeType === "CONDITION";
      const existingTrueNext = parentNode.trueNext;
      const existingFalseNext = parentNode.falseNext;

      let inheritedNext = null;
      if (isParentCondition) {
        if (selectedBranch === "true") {
          inheritedNext = existingTrueNext?.[0] || null;
        } else {
          inheritedNext = existingFalseNext?.[0] || null;
        }
      } else {
        inheritedNext = parentNode.next;
      }

      const newNode =
        newNodeType === "CONDITION"
          ? {
              id: newId,
              label: newNodeLabel,
              description: descriptionText,
              nodeType: newNodeType,
              action: actionType,
              icon: nodeIcon,
              createdAt: currentTime,
              connectorType: "decision",
              trueNext: Array.isArray(inheritedNext)
                ? inheritedNext
                : inheritedNext
                ? [inheritedNext]
                : [],
              falseNext: [],
              raw: {
                id: newId,
                type: newNodeType,
                properties: {
                  action: actionType,
                  label: newNodeLabel,
                  description: descriptionText,
                  icon: nodeIcon,
                },
                true: Array.isArray(inheritedNext)
                  ? inheritedNext
                  : inheritedNext
                  ? [inheritedNext]
                  : [],
                false: [],
                createdAt: currentTime,
              },
            }
          : {
              id: newId,
              label: newNodeLabel,
              description: descriptionText,
              nodeType: newNodeType,
              action: actionType,
              icon: nodeIcon,
              createdAt: currentTime,
              connectorType: "default",
              next: inheritedNext,
              raw: {
                id: newId,
                type: newNodeType,
                properties: {
                  action: actionType,
                  label: newNodeLabel,
                  description: descriptionText,
                  icon: nodeIcon,
                },
                next: inheritedNext ? [inheritedNext] : [],
                createdAt: currentTime,
              },
            };

      let updatedParent;
      if (isParentCondition) {
        if (selectedBranch === "true") {
          const existingBranchNext = existingTrueNext?.[0];
          const newTrueNext = existingBranchNext
            ? [newId]
            : [...(existingTrueNext || []), newId];
          const updatedFalseNext = existingFalseNext || [];

          const allNextIds = [...newTrueNext, ...updatedFalseNext];
          const nextValue =
            allNextIds.length === 1
              ? allNextIds[0]
              : allNextIds.length > 1
              ? allNextIds
              : undefined;

          updatedParent = {
            ...parentNode,
            trueNext: newTrueNext,
            falseNext: updatedFalseNext,
            next: nextValue,
            raw: {
              ...parentNode.raw,
              true: newTrueNext,
            },
          };
        } else {
          const existingBranchNext = existingFalseNext?.[0];
          const newFalseNext = existingBranchNext
            ? [newId]
            : [...(existingFalseNext || []), newId];
          const updatedTrueNext = existingTrueNext || [];

          const allNextIds = [...updatedTrueNext, ...newFalseNext];
          const nextValue =
            allNextIds.length === 1
              ? allNextIds[0]
              : allNextIds.length > 1
              ? allNextIds
              : undefined;

          updatedParent = {
            ...parentNode,
            trueNext: updatedTrueNext,
            falseNext: newFalseNext,
            next: nextValue,
            raw: {
              ...parentNode.raw,
              false: newFalseNext,
            },
          };
        }
      } else {
        updatedParent = {
          ...parentNode,
          next: newId,
          raw: {
            ...parentNode.raw,
            next: [newId],
          },
        };
      }

      currentNodes[parentId] = updatedParent;
      currentNodes[newId] = newNode;

      const nextGraphData = {
        ...prevData,
        nodes: currentNodes,
      };

      if (setAiResponse) {
        setAiResponse((prev) => ({
          ...prev,
          flow: nextGraphData,
        }));
      }

      return nextGraphData;
    });

    handleDrawerClose();
    setHasLocalChanges(true);
  };

  const handleSaveFlow = async () => {
    if (!graphData || !responsibilityNodes) return;

    const updatedNodes = Object.values(graphData.nodes).map(
      (node: {
        id: string;
        nodeType: string;
        label?: string;
        icon?: string;
        action?: string;
        description?: string;
        next?: string | string[] | null;
        trueNext?: string[] | null;
        falseNext?: string[] | null;
        raw?: {
          id: string;
          type: string;
          properties: {
            label?: string;
            icon?: string;
            action?: string;
            description?: string;
          };
          true?: string[] | null;
          false?: string[] | null;
          next?: string[] | null;
        };
        createdAt: string;
      }) => {
        const baseNode = {
          id: node.id,
          type: node.nodeType,
          properties: {
            label: node.label || node.raw?.properties?.label,
            icon: node.icon || node.raw?.properties?.icon,
            action: node.action || node.raw?.properties?.action,
            description: node.description || node.raw?.properties?.description,
          },
          createdAt: node.createdAt,
        };

        if (node.nodeType === "CONDITION") {
          return {
            ...baseNode,
            true: node.trueNext || node.raw?.true || [],
            false: node.falseNext || node.raw?.false || [],
          };
        } else {
          return {
            ...baseNode,
            next: Array.isArray(node.next)
              ? node.next
              : node.next
              ? [node.next]
              : null,
          };
        }
      }
    );

    try {
      await upsertResponsibility(
        responsibilityNodes.id,
        responsibilityNodes.title,
        responsibilityNodes.description,
        responsibilityNodes.colleagueId,
        updatedNodes
      );
      setHasLocalChanges(false);
      setSaveSuccess(true);
    } catch (error) {
      console.error("Failed to save flow:", error);
    }
  };

  const handleFlowChange = (updatedGraphData) => {
    setGraphData(updatedGraphData);
    if (setAiResponse) {
      setAiResponse((prev) => ({
        ...prev,
        flow: updatedGraphData,
      }));
    }

    setHasLocalChanges(true);
  };

  const style = () => {
    return {
      onAdd: (n) => handleAddNodeClick(n),
      direction: "horizontal",
    };
  };

  if (isLoading || !graphData) return;

  const flowDimensions = getFlowDimensions();

  return (
    <Box
      sx={{
        width: flowDimensions.width,
        height: flowDimensions.height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      <Flow
        data={graphData}
        plugin={responsibilityChartPlugin}
        style={style}
        editable={true}
        onChange={handleFlowChange}
      />

      <AddNodeWidget
        drawerOpen={drawerOpen}
        handleDrawerClose={handleDrawerClose}
        selectedParentNode={selectedParentNode}
        graphData={graphData}
        newNodeLabel={newNodeLabel}
        setNewNodeLabel={setNewNodeLabel}
        newNodeType={newNodeType}
        setNewNodeType={setNewNodeType}
        selectedBranch={selectedBranch}
        setSelectedBranch={setSelectedBranch}
        handleSubmit={handleAddNode}
        selectedIntegration={selectedIntegration}
        setSelectedIntegration={setSelectedIntegration}
      />

      {hasLocalChanges && !drawerOpen && (
        <ValidationButtons
          validationErrors={validationErrors}
          setShowValidationErrors={setShowValidationErrors}
          handleSaveFlow={handleSaveFlow}
        />
      )}

      {showValidationErrors && !drawerOpen && (
        <ValidationErrorView
          validationErrors={validationErrors}
          setShowValidationErrors={setShowValidationErrors}
        />
      )}
      <SuccessSnackbar
        saveSuccess={saveSuccess}
        setSaveSuccess={setSaveSuccess}
      />
    </Box>
  );
}

export default ResponsibilityFlow;
