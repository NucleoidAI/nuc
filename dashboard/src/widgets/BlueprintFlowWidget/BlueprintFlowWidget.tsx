import AddNodeWidget from "../../widgets/AddNodeWidget/AddNodeWidget";
import BlueprintFlow from "../../components/BlueprintFlow/BlueprintFlow";
import SampleFlow from "../../components/BlueprintFlow/SampleFlow";
import { calculateNodeChanges } from "../../components/BlueprintFlow/DiffPanel/diffHelper";
import useBlueprint from "../../hooks/useBlueprint";
import useMCPs from "../../hooks/useMCPs";
import { v4 as uuid } from "uuid";
import { validateFlow } from "../../components/BlueprintFlow/Validation/validation";

import {
  DefinitionGraph,
  FlowDefinition,
  buildDefinitionGraph,
} from "../../components/BlueprintFlow/helper";
import React, { useEffect, useMemo, useState } from "react";

interface AIResponse {
  flow: FlowDefinition;
}

interface Blueprint {
  id: string;
  title: string;
  description: string;
  agentId: string;
}

function BlueprintFlowWidget({
  aiResponse,
  setAiResponse,
  blueprint,
  taskId,
}: {
  aiResponse?: AIResponse;
  setAiResponse?: (response: AIResponse | null) => void;
  blueprint: Blueprint;
  taskId?: string;
}) {
  const [graphData, setGraphData] = useState<DefinitionGraph | null>(null);
  const [hasLocalChanges, setHasLocalChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDiffPanel, setShowDiffPanel] = useState(false);
  const [baselineNodes, setBaselineNodes] = useState(null);

  const { getBlueprintWithNode, upsertBlueprint } = useBlueprint();
  const { blueprintNodes, loading } = getBlueprintWithNode(blueprint?.id);
  const { getMCPs } = useMCPs();
  const { mcps } = getMCPs();

  const hasDifferences = useMemo(() => {
    if (!baselineNodes?.nodes || !graphData?.nodes) return false;

    const baselineCount = baselineNodes.nodes.length;
    const currentCount = Object.keys(graphData.nodes).length;

    if (baselineCount !== currentCount) return true;

    const baselineIds = new Set(baselineNodes.nodes.map((n) => n.id));
    const currentIds = new Set(Object.keys(graphData.nodes));

    if (baselineIds.size !== currentIds.size) return true;
    for (const id of currentIds) {
      if (!baselineIds.has(id)) return true;
    }

    return false;
  }, [baselineNodes, graphData]);

  const nodeChanges = useMemo(() => {
    if (!baselineNodes?.nodes || !graphData?.nodes) {
      return new Map();
    }

    const currentNodesArray = Object.values(graphData.nodes).map(
      (node) => node.raw
    );

    return calculateNodeChanges(baselineNodes.nodes, currentNodesArray);
  }, [baselineNodes, graphData]);

  const enrichedGraphData = useMemo(() => {
    if (!graphData) return null;

    const enriched = { ...graphData };
    enriched.nodes = Object.keys(graphData.nodes).reduce((acc, nodeId) => {
      const node = graphData.nodes[nodeId];
      const change = nodeChanges.get(nodeId);
      const changeType = change?.changeType || "unchanged";

      acc[nodeId] = {
        ...node,
        changeType,
      };

      return acc;
    }, {});

    return enriched;
  }, [graphData, nodeChanges]);

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

  useEffect(
    () => {
      if (aiResponse?.flow) {
        const cleanData = buildDefinitionGraph(aiResponse.flow);
        setGraphData(cleanData);
        setHasLocalChanges(true);

        if (!baselineNodes && blueprint?.id) {
          setBaselineNodes({
            blueprintId: blueprint.id,
            nodes: blueprintNodes?.nodes || [],
          });
        }

        if (blueprintNodes?.nodes && blueprintNodes.nodes.length > 0) {
          setShowDiffPanel(true);
        }
      } else if (blueprintNodes && !hasLocalChanges) {
        const initialData = buildDefinitionGraph(blueprintNodes);
        setGraphData(initialData);
        setBaselineNodes({
          blueprintId: blueprintNodes.id,
          nodes: blueprintNodes.nodes || [],
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [blueprintNodes, aiResponse, hasLocalChanges, blueprint?.id]
  );

  useEffect(() => {
    if (graphData && mcps?.content?.mcps) {
      const validationResult = validateFlow(graphData, mcps.content.mcps);
      setValidationErrors(validationResult.errors);

      if (validationResult.errors.length === 0 && showValidationErrors) {
        setShowValidationErrors(false);
      }
    }
  }, [graphData, mcps, showValidationErrors]);

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
              connectorType: "decision" as const,
              trueNext: Array.isArray(inheritedNext)
                ? inheritedNext
                : inheritedNext
                ? [inheritedNext]
                : [],
              falseNext: [],
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
              connectorType: "default" as const,
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

      const referenced = new Set<string>();
      Object.values(currentNodes).forEach(
        (node: {
          id: string;
          nodeType: string;
          next?: string | string[] | null;
          trueNext?: string[] | null;
          falseNext?: string[] | null;
        }) => {
          if (node.nodeType === "CONDITION") {
            if (node.trueNext) {
              node.trueNext.forEach((id) => referenced.add(id));
            }
            if (node.falseNext) {
              node.falseNext.forEach((id) => referenced.add(id));
            }
          } else {
            if (typeof node.next === "string") {
              referenced.add(node.next);
            } else if (Array.isArray(node.next)) {
              node.next.forEach((id) => referenced.add(id));
            }
          }
        }
      );
      const newRoots = Object.keys(currentNodes).filter(
        (id) => !referenced.has(id)
      );

      return {
        ...prevData,
        nodes: currentNodes,
        roots: newRoots,
      };
    });

    handleDrawerClose();
    setHasLocalChanges(true);
  };

  const handleSaveFlow = async () => {
    if (!graphData || !blueprintNodes) return;

    const updatedNodes = Object.values(graphData.nodes).map((node) => {
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
    });

    try {
      await upsertBlueprint(
        blueprintNodes.id,
        blueprintNodes.title,
        blueprintNodes.description,
        blueprintNodes.agentId,
        updatedNodes,
        taskId
      );
      setHasLocalChanges(false);
      setShowDiffPanel(false);
      if (setAiResponse) {
        setAiResponse(null);
      }
      setSaveSuccess(true);
    } catch (error) {
      console.error("Failed to save flow:", error);
    }
  };

  const handleFlowChange = (updatedGraphData) => {
    setGraphData(updatedGraphData);
    setHasLocalChanges(true);
  };

  if (loading || !graphData) {
    return <SampleFlow />;
  }

  return (
    <>
      <BlueprintFlow
        graphData={graphData}
        enrichedGraphData={enrichedGraphData}
        drawerOpen={drawerOpen}
        hasLocalChanges={hasLocalChanges}
        hasDifferences={hasDifferences}
        validationErrors={validationErrors}
        showDiffPanel={showDiffPanel}
        showValidationErrors={showValidationErrors}
        saveSuccess={saveSuccess}
        baselineNodes={baselineNodes?.nodes ?? []}
        onFlowChange={handleFlowChange}
        onAddNodeClick={handleAddNodeClick}
        onSave={handleSaveFlow}
        onShowDiff={() => setShowDiffPanel(true)}
        onCloseDiff={() => setShowDiffPanel(false)}
        onShowValidationErrors={setShowValidationErrors}
        onSaveSuccessChange={setSaveSuccess}
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
    </>
  );
}

export default BlueprintFlowWidget;
