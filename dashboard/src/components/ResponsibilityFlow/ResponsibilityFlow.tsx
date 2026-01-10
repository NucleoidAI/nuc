import AddNodeWidget from "../../widgets/AddNodeWidget/AddNodeWidget";
import { Box } from "@mui/material";
import { Flow } from "@canmingir/link/platform/components";
import { buildDefinitionGraph } from "./helper";
import { responsibilityChartPlugin } from "./ResponsibilityFlowPlugin";
import useResponsibility from "../../hooks/useResponsibility";
import { v4 as uuid } from "uuid";

import React, { useEffect, useState } from "react";

function ResponsibilityFlow({ aiResponse, setAiResponse, responsibility }) {
  const [graphData, setGraphData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getResponsibilityWithNode, upsertResponsibility } =
    useResponsibility();
  const { responsibilityNodes, loading } = getResponsibilityWithNode(
    responsibility?.id
  );

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
    }
  }, [responsibilityNodes, aiResponse]);

  useEffect(() => {
    if (loading) setIsLoading(false);
  }, [loading]);

  const handleAddNodeClick = (node) => {
    setSelectedParentNode(node);
    setNewNodeLabel("");
    setNewNodeType("NORMAL");
    setSelectedBranch("true");
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

  const handleSubmit = async () => {
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

    let updatedNodes = null;

    setGraphData((prevData) => {
      const currentNodes = { ...prevData.nodes };
      const parentId = selectedParentNode.id;
      const parentNode = currentNodes[parentId];

      if (!parentNode) return prevData;

      const isParentCondition = parentNode.nodeType === "CONDITION";
      const existingNext = parentNode.next;
      const existingTrueNext = parentNode.trueNext;
      const existingFalseNext = parentNode.falseNext;

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
              trueNext: Array.isArray(existingNext)
                ? existingNext
                : existingNext
                ? [existingNext]
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
                true: Array.isArray(existingNext)
                  ? existingNext
                  : existingNext
                  ? [existingNext]
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
              next: null,
              raw: {
                id: newId,
                type: newNodeType,
                properties: {
                  action: actionType,
                  label: newNodeLabel,
                  description: descriptionText,
                  icon: nodeIcon,
                },
                next: [],
                createdAt: currentTime,
              },
            };

      let updatedParent;
      if (isParentCondition) {
        updatedParent = {
          ...parentNode,
          ...(selectedBranch === "true"
            ? {
                trueNext: [...(existingTrueNext || []), newId],
                raw: {
                  ...parentNode.raw,
                  true: [...(parentNode.raw?.true || []), newId],
                },
              }
            : {
                falseNext: [...(existingFalseNext || []), newId],
                raw: {
                  ...parentNode.raw,
                  false: [...(parentNode.raw?.false || []), newId],
                },
              }),
        };
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

      updatedNodes = Object.values(currentNodes).map(
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
              description:
                node.description || node.raw?.properties?.description,
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

      if (setAiResponse) {
        setAiResponse((prev) => ({
          ...prev,
          flow: nextGraphData,
        }));
      }

      return nextGraphData;
    });

    await upsertResponsibility(
      responsibilityNodes.id,
      responsibilityNodes.title,
      responsibilityNodes.description,
      responsibilityNodes.colleagueId,
      updatedNodes
    );

    handleDrawerClose();
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
      <Flow data={graphData} plugin={responsibilityChartPlugin} style={style} />

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
        handleSubmit={handleSubmit}
        selectedIntegration={selectedIntegration}
        setSelectedIntegration={setSelectedIntegration}
      />
    </Box>
  );
}

export default ResponsibilityFlow;
