import AddNodeDrawer from "../AddNode/AddNodeDrawer";
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
  const { getResponsibilityWithNode } = useResponsibility();
  const { loading } = getResponsibilityWithNode(responsibility?.id);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedParentNode, setSelectedParentNode] = useState(null);
  const [newNodeLabel, setNewNodeLabel] = useState("");
  const [newNodeType, setNewNodeType] = useState("NORMAL");

  const getFlowDimensions = () => {
    return { width: "100%", height: "100%" };
  };

  useEffect(() => {
    if (aiResponse?.flow) {
      const cleanData = buildDefinitionGraph(aiResponse.flow);
      setGraphData(cleanData);
    } else if (responsibility) {
      const initialData = buildDefinitionGraph(responsibility);
      setGraphData(initialData);
    }
  }, [responsibility, aiResponse]);

  useEffect(() => {
    if (loading) setIsLoading(false);
  }, [loading]);

  const handleAddNodeClick = (node) => {
    setSelectedParentNode(node);
    setNewNodeLabel("");
    setNewNodeType("NORMAL");
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedParentNode(null);
  };

  const handleSubmit = () => {
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
        : "PLATFORM:user_interaction";

    setGraphData((prevData) => {
      const currentNodes = { ...prevData.nodes };
      const parentId = selectedParentNode.id;
      const parentNode = currentNodes[parentId];

      if (!parentNode) return prevData;

      const existingNext = parentNode.next;

      const newNode = {
        id: newId,
        label: newNodeLabel,
        nodeType: newNodeType,
        action: actionType,
        icon: nodeIcon,
        createdAt: currentTime,
        connectorType: "default",
        next: existingNext,
        raw: {
          id: newId,
          type: newNodeType,
          properties: {
            action: actionType,
            label: newNodeLabel,
            icon: nodeIcon,
          },
          next: Array.isArray(existingNext)
            ? existingNext
            : existingNext
            ? [existingNext]
            : [],
          createdAt: currentTime,
        },
      };

      const updatedParent = {
        ...parentNode,
        next: newId,
        raw: {
          ...parentNode.raw,
          next: [newId],
        },
      };

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

      <AddNodeDrawer
        drawerOpen={drawerOpen}
        handleDrawerClose={handleDrawerClose}
        selectedParentNode={selectedParentNode}
        newNodeLabel={newNodeLabel}
        setNewNodeLabel={setNewNodeLabel}
        newNodeType={newNodeType}
        setNewNodeType={setNewNodeType}
        handleSubmit={handleSubmit}
      />
    </Box>
  );
}

export default ResponsibilityFlow;
