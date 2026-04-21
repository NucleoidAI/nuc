import BlueprintFlow from "../../components/BlueprintFlow/BlueprintFlow";
import BlueprintFlowSkeleton from "../../components/Skeletons/BlueprintFlowSkeleton";
import NodeEditorWidget from "../NodeEditorWidget/NodeEditorWidget";
import SampleFlow from "../../components/BlueprintFlow/Samples/SampleFlow";
import SampleNode from "../../components/BlueprintFlow/Samples/SampleNode";
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
  pseudocode?: string;
}

function BlueprintFlowWidget({
  aiResponse,
  setAiResponse,
  blueprint,
  taskId,
  setSelectedItem,
  usedNodeIds,
  lastUsedNodeId,
  failedNodeId,
  isSuperviseFlow = false,
  agentId,
  readOnly = false,
  teamId,
}: {
  aiResponse?: AIResponse;
  setAiResponse?: (response: AIResponse | null) => void;
  blueprint: Blueprint;
  taskId?: string;
  setSelectedItem?: (item: Blueprint) => void;
  usedNodeIds?: Set<string>;
  lastUsedNodeId?: string | null;
  failedNodeId?: string | null;
  isSuperviseFlow?: boolean;
  agentId?: string;
  readOnly?: boolean;
  teamId?: string;
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

      const hasError =
        showValidationErrors &&
        validationErrors.some(
          (error) => error.nodeId === nodeId || error.nextNodeId === nodeId
        );

      const isUsed = usedNodeIds && usedNodeIds.has(nodeId);
      const isLastUsed = lastUsedNodeId === nodeId;
      const isFailed = failedNodeId === nodeId;

      acc[nodeId] = {
        ...node,
        changeType,
        hasError,
        isUsed,
        isLastUsed,
        isFailed,
      };

      return acc;
    }, {});

    return enriched;
  }, [
    graphData,
    nodeChanges,
    validationErrors,
    showValidationErrors,
    usedNodeIds,
    lastUsedNodeId,
    failedNodeId,
  ]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedParentNode, setSelectedParentNode] = useState(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [newNodeLabel, setNewNodeLabel] = useState("");
  const [newNodePrompt, setNewNodePrompt] = useState("");
  const [newNodeType, setNewNodeType] = useState("NORMAL");
  const [selectedBranch, setSelectedBranch] = useState<"true" | "false">(
    "true"
  );
  const [selectedIntegration, setSelectedIntegration] = useState({
    id: "",
    action: "",
    provider: "",
    description: "",
    icon: "",
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

  const [showSampleFlow, setShowSampleFlow] = useState(false);
  const [nodePseudocode, setNodePseudocode] = useState("");

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
    setNewNodePrompt("");
    setNodePseudocode("");
    setNewNodeType("NORMAL");
    setSelectedBranch("true");
    setShowValidationErrors(false);
    setDrawerOpen(true);
  };

  const handleEditNodeClick = (node) => {
    setEditMode(true);
    setEditingNodeId(node.id);
    const nodeLabel = node?.label || node?.properties?.label || "";
    const nodePrompt = node?.raw?.properties?.prompt || "";
    const nodeType = node.nodeType || "NORMAL";
    setNewNodeLabel(nodeLabel);
    setNewNodePrompt(nodePrompt);
    setNewNodeType(nodeType);
    setNodePseudocode(node?.raw?.properties?.pseudocode || "");

    if (graphData?.nodes) {
      const parentNode = Object.values(graphData.nodes).find((n) => {
        if (n.next === node.id) return true;
        if (Array.isArray(n.next) && n.next.includes(node.id)) return true;
        if (Array.isArray(n.trueNext) && n.trueNext.includes(node.id))
          return true;
        if (Array.isArray(n.falseNext) && n.falseNext.includes(node.id))
          return true;
        return false;
      });

      if (parentNode) {
        setSelectedParentNode(parentNode);

        if (parentNode.nodeType === "CONDITION") {
          const isOnTrueBranch = parentNode.trueNext?.includes(node.id);
          const isOnFalseBranch = parentNode.falseNext?.includes(node.id);

          if (isOnTrueBranch) {
            setSelectedBranch("true");
          } else if (isOnFalseBranch) {
            setSelectedBranch("false");
          }
        }
      }
    }

    setDrawerOpen(true);
  };

  const handleEditNode = () => {
    if (!editingNodeId) return;

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
      if (!prevData) return prevData;

      const currentNodes = { ...prevData.nodes };
      const nodeToUpdate = currentNodes[editingNodeId];

      if (!nodeToUpdate) return prevData;

      const isChangingToCondition =
        newNodeType === "CONDITION" && nodeToUpdate.nodeType !== "CONDITION";
      const isChangingToNormal =
        newNodeType !== "CONDITION" && nodeToUpdate.nodeType === "CONDITION";

      let updatedNode;

      if (isChangingToCondition) {
        const existingNext = nodeToUpdate.next;
        updatedNode = {
          ...nodeToUpdate,
          label: newNodeLabel,
          description: descriptionText,
          action: actionType,
          icon: nodeIcon,
          nodeType: newNodeType,
          connectorType: "decision" as const,
          trueNext: existingNext
            ? Array.isArray(existingNext)
              ? existingNext
              : [existingNext]
            : [],
          falseNext: [],
          next: existingNext,
          raw: {
            ...nodeToUpdate.raw,
            type: newNodeType,
            properties: {
              ...nodeToUpdate.raw?.properties,
              label: newNodeLabel,
              prompt: newNodePrompt,
              description: descriptionText,
              action: actionType,
              icon: nodeIcon,
            },
            true: existingNext
              ? Array.isArray(existingNext)
                ? existingNext
                : [existingNext]
              : [],
            false: [],
            next: undefined,
          },
        };
      } else if (isChangingToNormal) {
        const nextValue = nodeToUpdate.trueNext?.[0] || null;
        updatedNode = {
          ...nodeToUpdate,
          label: newNodeLabel,
          description: descriptionText,
          action: actionType,
          icon: nodeIcon,
          nodeType: newNodeType,
          connectorType: "default" as const,
          next: nextValue,
          trueNext: undefined,
          falseNext: undefined,
          raw: {
            ...nodeToUpdate.raw,
            type: newNodeType,
            properties: {
              ...nodeToUpdate.raw?.properties,
              label: newNodeLabel,
              prompt: newNodePrompt,
              description: descriptionText,
              action: actionType,
              icon: nodeIcon,
            },
            next: nextValue ? [nextValue] : [],
            true: undefined,
            false: undefined,
          },
        };
      } else {
        updatedNode = {
          ...nodeToUpdate,
          label: newNodeLabel,
          description: descriptionText,
          action: actionType,
          icon: nodeIcon,
          nodeType: newNodeType,
          raw: {
            ...nodeToUpdate.raw,
            type: newNodeType,
            properties: {
              ...nodeToUpdate.raw?.properties,
              label: newNodeLabel,
              prompt: newNodePrompt,
              description: descriptionText,
              action: actionType,
              icon: nodeIcon,
            },
          },
        };
      }

      currentNodes[editingNodeId] = updatedNode;

      return {
        ...prevData,
        nodes: currentNodes,
      };
    });

    handleDrawerClose();
    setHasLocalChanges(true);
    setEditMode(false);
    setEditingNodeId(null);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setEditMode(false);
    setEditingNodeId(null);
    setSelectedParentNode(null);
    setNewNodeLabel("");
    setNewNodePrompt("");
    setNodePseudocode("");
    setNewNodeType("NORMAL");
    setSelectedBranch("true");
    setSelectedIntegration({
      id: "",
      action: "",
      provider: "",
      description: "",
      icon: "",
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
        ? "mdi:source-branch"
        : selectedIntegration?.icon;
    const actionType =
      newNodeType === "CONDITION"
        ? "PLATFORM:decision"
        : selectedIntegration?.action;

    const descriptionText =
      newNodeType === "CONDITION"
        ? "A decision node that branches the flow based on conditions."
        : selectedIntegration?.description || "";
    if (selectedParentNode.id === "starter") {
      const firstNode =
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
              trueNext: [],
              falseNext: [],
              next: null,
              raw: {
                id: newId,
                type: newNodeType,
                properties: {
                  action: actionType,
                  label: newNodeLabel,
                  prompt: newNodePrompt,
                  description: descriptionText,
                  icon: nodeIcon,
                },
                true: [],
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
              next: null,
              raw: {
                id: newId,
                type: newNodeType,
                properties: {
                  action: actionType,
                  label: newNodeLabel,
                  prompt: newNodePrompt,
                  description: descriptionText,
                  icon: nodeIcon,
                },
                next: [],
                createdAt: currentTime,
              },
            };

      setGraphData({
        nodes: { [newId]: firstNode },
        roots: [newId],
      });

      handleDrawerClose();
      setHasLocalChanges(true);
      return;
    }

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
                  prompt: newNodePrompt,
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
                  prompt: newNodePrompt,
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
    if (!graphData) return;

    const agentId = blueprintNodes?.agentId || blueprint?.agentId;

    if (!agentId) {
      console.error("Cannot save blueprint: agentId is required");
      alert(
        "Cannot save blueprint: Agent ID is missing. Please ensure an agent is selected."
      );
      return;
    }

    const updatedNodes = Object.values(graphData.nodes).map((node) => {
      const baseNode = {
        id: node.id,
        type: node.nodeType,
        properties: {
          label: node.label || node.raw?.properties?.label,
          prompt: node.raw?.properties?.prompt,
          pseudocode: node.raw?.properties?.pseudocode,
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

    const response = await upsertBlueprint(
      blueprintNodes?.id || blueprint?.id,
      blueprintNodes?.title || blueprint?.title || "Newly Created Blueprint",
      blueprintNodes?.description ||
        blueprint?.description ||
        "Blueprint created from flow",
      agentId,
      updatedNodes,
      taskId,
      blueprintNodes?.messages
    );

    if (setSelectedItem && response?.Blueprint) {
      setSelectedItem(response.Blueprint);
    }

    setHasLocalChanges(false);
    setShowDiffPanel(false);
    if (setAiResponse) {
      setAiResponse(null);
    }
    setSaveSuccess(true);
  };

  const handleFlowChange = (updatedGraphData) => {
    setGraphData(updatedGraphData);
    setHasLocalChanges(true);
  };

  const loadSampleFlow = () => {
    setShowSampleFlow(!showSampleFlow);
  };

  const handleStarterNodeClick = () => {
    const starterParent = {
      id: "starter",
      label: "Start",
      nodeType: "START",
      next: null,
    };
    setSelectedParentNode(starterParent);
    setNewNodeLabel("");
    setNewNodePrompt("");
    setNodePseudocode("");
    setNewNodeType("NORMAL");
    setSelectedBranch("true");
    setShowValidationErrors(false);
    setDrawerOpen(true);
  };

  const hasRealFlowData =
    aiResponse?.flow ||
    (blueprintNodes?.nodes && blueprintNodes.nodes.length > 0);

  const isEmptyState =
    !loading &&
    !aiResponse?.flow &&
    (!blueprintNodes?.nodes || blueprintNodes.nodes.length === 0);

  return (
    <>
      {loading ? (
        <BlueprintFlowSkeleton />
      ) : isEmptyState ? (
        <>
          {showSampleFlow && <SampleFlow />}
          {!showSampleFlow && (
            <SampleNode
              loadSampleFlow={loadSampleFlow}
              handleStarterNodeClick={handleStarterNodeClick}
            />
          )}
        </>
      ) : !graphData && hasRealFlowData ? null : (
        <BlueprintFlow
          graphData={graphData}
          enrichedGraphData={enrichedGraphData}
          drawerOpen={drawerOpen}
          readOnly={readOnly}
          hasLocalChanges={hasLocalChanges}
          hasDifferences={hasDifferences}
          validationErrors={validationErrors}
          showDiffPanel={showDiffPanel}
          showValidationErrors={showValidationErrors}
          saveSuccess={saveSuccess}
          baselineNodes={baselineNodes?.nodes ?? []}
          onFlowChange={handleFlowChange}
          onAddNodeClick={handleAddNodeClick}
          onEditNodeClick={handleEditNodeClick}
          onSave={handleSaveFlow}
          onShowDiff={() => setShowDiffPanel(true)}
          onCloseDiff={() => setShowDiffPanel(false)}
          onShowValidationErrors={setShowValidationErrors}
          onSaveSuccessChange={setSaveSuccess}
          isSuperviseFlow={isSuperviseFlow}
        />
      )}

      <NodeEditorWidget
        pseudocode={nodePseudocode}
        drawerOpen={drawerOpen}
        handleDrawerClose={handleDrawerClose}
        selectedParentNode={selectedParentNode}
        graphData={graphData}
        newNodeLabel={newNodeLabel}
        setNewNodeLabel={setNewNodeLabel}
        newNodePrompt={newNodePrompt}
        setNewNodePrompt={setNewNodePrompt}
        newNodeType={newNodeType}
        setNewNodeType={setNewNodeType}
        selectedBranch={selectedBranch}
        setSelectedBranch={setSelectedBranch}
        handleSubmit={editMode ? handleEditNode : handleAddNode}
        selectedIntegration={selectedIntegration}
        setSelectedIntegration={setSelectedIntegration}
        editMode={editMode}
        editingNode={
          editingNodeId && graphData?.nodes?.[editingNodeId]
            ? graphData.nodes[editingNodeId]
            : undefined
        }
        agentId={agentId ?? blueprint.agentId}
        blueprintId={blueprint?.id}
        teamId={teamId}
      />
    </>
  );
}

export default BlueprintFlowWidget;
