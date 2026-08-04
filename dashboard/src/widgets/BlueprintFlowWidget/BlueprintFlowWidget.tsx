import BlueprintFlow from "../../components/BlueprintFlow/BlueprintFlow";
import BlueprintFlowSkeleton from "../../components/Skeletons/BlueprintFlowSkeleton";
import NodeEditorWidget from "../NodeEditorWidget/NodeEditorWidget";
import type { ParameterBinding } from "../../components/BlueprintFlow/NodeConnectionOverlay";
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
  buildByNodeRef,
  buildDefinitionGraph,
  getAncestorNodes,
} from "../../components/BlueprintFlow/helper";
import React, { useEffect, useMemo, useRef, useState } from "react";

interface AIResponse {
  flow: FlowDefinition;
}

interface Blueprint {
  id: string;
  title: string;
  description: string;
  agentId: string;
  pseudocode?: string;
  blocking?: boolean;
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
  blocking: blockingProp,
  onBlockingChange: onBlockingChangeProp,
  showConnections: showConnectionsProp,
  onSave,
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
  blocking?: boolean;
  onBlockingChange?: (value: boolean) => void;
  showConnections?: boolean;
  onSave?: () => void;
}) {
  const [graphData, setGraphData] = useState<DefinitionGraph | null>(null);
  const [hasLocalChanges, setHasLocalChanges] = useState(false);
  const hasLocalChangesRef = useRef(hasLocalChanges);
  useEffect(() => {
    hasLocalChangesRef.current = hasLocalChanges;
  }, [hasLocalChanges]);
  const [blockingInternal, setBlockingInternal] = useState<boolean>(
    blueprint?.blocking ?? true
  );
  const blocking = blockingProp !== undefined ? blockingProp : blockingInternal;
  const showConnections = showConnectionsProp ?? false;
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
  const [newNodeForce, setNewNodeForce] = useState(false);
  const [newNodeType, setNewNodeType] = useState("NORMAL");
  const [handoffTargetAgentId, setHandoffTargetAgentId] = useState("");
  const [handoffTargetBlueprintId, setHandoffTargetBlueprintId] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<"true" | "false">(
    "true"
  );
  const [inheritedNextBranch, setInheritedNextBranch] = useState<
    "true" | "false" | "none"
  >("none");
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
      if (blueprintNodes?.blocking !== undefined) {
        if (onBlockingChangeProp) {
          onBlockingChangeProp(blueprintNodes.blocking);
        } else {
          setBlockingInternal(blueprintNodes.blocking);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [blueprintNodes?.blocking]
  );

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
      } else if (blueprintNodes && !hasLocalChangesRef.current) {
        const initialData = buildDefinitionGraph(blueprintNodes);
        setGraphData(initialData);
        setBaselineNodes({
          blueprintId: blueprintNodes.id,
          nodes: blueprintNodes.nodes || [],
        });
      }
    },
    // Deliberately excludes hasLocalChanges: this effect must only re-run when
    // the fetched blueprint itself changes, not when the flip-to-false after a
    // save flips it — otherwise it races the still-stale blueprintNodes fetch
    // and clobbers the just-saved graphData with pre-save data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [blueprintNodes, aiResponse, blueprint?.id]
  );

  useEffect(
    () => {
      if (!blueprintNodes) return;

      const titleChanged =
        blueprint?.title !== undefined &&
        blueprint.title !== blueprintNodes.title;
      const descriptionChanged =
        blueprint?.description !== undefined &&
        blueprint.description !== blueprintNodes.description;

      if (titleChanged || descriptionChanged) {
        setHasLocalChanges(true);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [blueprint?.title, blueprint?.description, blueprintNodes]
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
    setNewNodeForce(false);
    setNodePseudocode("");
    setNewNodeType("NORMAL");
    setSelectedBranch("true");
    setInheritedNextBranch("none");
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
    setNewNodeForce(Boolean(node?.raw?.properties?.force));
    setNewNodeType(nodeType);
    setNodePseudocode(node?.raw?.properties?.pseudocode || "");

    if (nodeType === "HANDOFF") {
      setHandoffTargetAgentId(node?.raw?.properties?.targetAgentId || "");
      setHandoffTargetBlueprintId(
        node?.raw?.properties?.targetBlueprintId || ""
      );
    }

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
        : newNodeType === "HANDOFF"
        ? "mdi:account-arrow-right"
        : "mdi:cube-outline";
    const actionType =
      newNodeType === "CONDITION"
        ? "PLATFORM:decision"
        : newNodeType === "HANDOFF"
        ? "PLATFORM:handoff"
        : selectedIntegration?.action;
    const descriptionText =
      newNodeType === "CONDITION"
        ? "A decision node that branches the flow based on conditions."
        : newNodeType === "HANDOFF"
        ? "Transfer this task to another agent's blueprint."
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
              force: newNodeForce,
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
              force: newNodeForce,
              description: descriptionText,
              action: actionType,
              icon: nodeIcon,
            },
            next: nextValue ? [nextValue] : [],
            true: undefined,
            false: undefined,
          },
        };
      } else if (newNodeType === "HANDOFF") {
        updatedNode = {
          ...nodeToUpdate,
          label: newNodeLabel,
          description: descriptionText,
          action: actionType,
          icon: nodeIcon,
          nodeType: newNodeType,
          connectorType: "default" as const,
          next: null,
          trueNext: undefined,
          falseNext: undefined,
          raw: {
            ...nodeToUpdate.raw,
            type: newNodeType,
            properties: {
              ...nodeToUpdate.raw?.properties,
              label: newNodeLabel,
              prompt: newNodePrompt,
              force: newNodeForce,
              description: descriptionText,
              action: actionType,
              icon: nodeIcon,
              targetAgentId: handoffTargetAgentId,
              targetBlueprintId: handoffTargetBlueprintId || undefined,
            },
            next: null,
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
              force: newNodeForce,
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
    setNewNodeForce(false);
    setNodePseudocode("");
    setNewNodeType("NORMAL");
    setSelectedBranch("true");
    setInheritedNextBranch("none");
    setHandoffTargetAgentId("");
    setHandoffTargetBlueprintId("");
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
        : newNodeType === "HANDOFF"
        ? "mdi:account-arrow-right"
        : selectedIntegration?.icon;
    const actionType =
      newNodeType === "CONDITION"
        ? "PLATFORM:decision"
        : newNodeType === "HANDOFF"
        ? "PLATFORM:handoff"
        : selectedIntegration?.action;

    const descriptionText =
      newNodeType === "CONDITION"
        ? "A decision node that branches the flow based on conditions."
        : newNodeType === "HANDOFF"
        ? "Transfer this task to another agent's blueprint."
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
                  force: newNodeForce,
                  description: descriptionText,
                  icon: nodeIcon,
                },
                true: [],
                false: [],
                createdAt: currentTime,
              },
            }
          : newNodeType === "HANDOFF"
          ? {
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
                  force: newNodeForce,
                  description: descriptionText,
                  icon: nodeIcon,
                  targetAgentId: handoffTargetAgentId,
                  targetBlueprintId: handoffTargetBlueprintId || undefined,
                },
                next: null,
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
                  force: newNodeForce,
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
              trueNext:
                inheritedNextBranch === "true"
                  ? Array.isArray(inheritedNext)
                    ? inheritedNext
                    : inheritedNext
                    ? [inheritedNext]
                    : []
                  : [],
              falseNext:
                inheritedNextBranch === "false"
                  ? Array.isArray(inheritedNext)
                    ? inheritedNext
                    : inheritedNext
                    ? [inheritedNext]
                    : []
                  : [],
              next: inheritedNextBranch !== "none" ? inheritedNext : null,
              raw: {
                id: newId,
                type: newNodeType,
                properties: {
                  action: actionType,
                  label: newNodeLabel,
                  prompt: newNodePrompt,
                  force: newNodeForce,
                  description: descriptionText,
                  icon: nodeIcon,
                },
                true:
                  inheritedNextBranch === "true"
                    ? Array.isArray(inheritedNext)
                      ? inheritedNext
                      : inheritedNext
                      ? [inheritedNext]
                      : []
                    : [],
                false:
                  inheritedNextBranch === "false"
                    ? Array.isArray(inheritedNext)
                      ? inheritedNext
                      : inheritedNext
                      ? [inheritedNext]
                      : []
                    : [],
                createdAt: currentTime,
              },
            }
          : newNodeType === "HANDOFF"
          ? {
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
                  force: newNodeForce,
                  description: descriptionText,
                  icon: nodeIcon,
                  targetAgentId: handoffTargetAgentId,
                  targetBlueprintId: handoffTargetBlueprintId || undefined,
                },
                next: null,
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
                  force: newNodeForce,
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

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDeleteNode = (node: { id: string }) => {
    setGraphData((prev) => {
      if (!prev) return prev;
      const currentNodes = { ...prev.nodes };
      const deletedNode = currentNodes[node.id];
      if (!deletedNode) return prev;

      const isDeletedCondition = deletedNode.nodeType === "CONDITION";
      const trueChildren: string[] = isDeletedCondition
        ? deletedNode.trueNext || []
        : [];
      const falseChildren: string[] = isDeletedCondition
        ? deletedNode.falseNext || []
        : [];
      const normalChildren: string[] = !isDeletedCondition
        ? deletedNode.next
          ? Array.isArray(deletedNode.next)
            ? deletedNode.next
            : [deletedNode.next]
          : []
        : [];

      const dedup = (arr: string[]) => [...new Set(arr)];

      Object.keys(currentNodes).forEach((id) => {
        const n = currentNodes[id];
        if (n.nodeType === "CONDITION") {
          const inTrue = n.trueNext?.includes(node.id);
          const inFalse = n.falseNext?.includes(node.id);
          if (inTrue || inFalse) {
            const replacementForTrue = isDeletedCondition
              ? trueChildren
              : normalChildren;
            const replacementForFalse = isDeletedCondition
              ? falseChildren
              : normalChildren;

            const newTrueNext = dedup(
              inTrue
                ? [
                    ...(n.trueNext || []).filter((x) => x !== node.id),
                    ...replacementForTrue,
                  ]
                : n.trueNext || []
            );
            const newFalseNext = dedup(
              inFalse
                ? [
                    ...(n.falseNext || []).filter((x) => x !== node.id),
                    ...replacementForFalse,
                  ]
                : n.falseNext || []
            );
            currentNodes[id] = {
              ...n,
              trueNext: newTrueNext,
              falseNext: newFalseNext,
              raw: { ...n.raw, true: newTrueNext, false: newFalseNext },
            };
          }
        } else {
          const next = n.next;
          if (
            next === node.id ||
            (Array.isArray(next) && next.includes(node.id))
          ) {
            const replacement = isDeletedCondition
              ? trueChildren
              : normalChildren;
            const dedupedReplacement = dedup(replacement);
            const newNext =
              dedupedReplacement.length === 1
                ? dedupedReplacement[0]
                : dedupedReplacement.length > 1
                ? dedupedReplacement
                : null;
            currentNodes[id] = {
              ...n,
              next: newNext,
              raw: {
                ...n.raw,
                next: dedupedReplacement,
              },
            };
          }
        }
      });

      delete currentNodes[node.id];

      if (isDeletedCondition && falseChildren.length > 0) {
        const falseSubtree = new Set<string>();
        const queue = [...falseChildren];
        while (queue.length > 0) {
          const cid = queue.shift()!;
          if (falseSubtree.has(cid) || !currentNodes[cid]) continue;
          falseSubtree.add(cid);
          const cn = currentNodes[cid];
          if (cn.nodeType === "CONDITION") {
            [...(cn.trueNext || []), ...(cn.falseNext || [])].forEach((id) =>
              queue.push(id)
            );
          } else {
            const cnNext = cn.next;
            if (typeof cnNext === "string") queue.push(cnNext);
            else if (Array.isArray(cnNext))
              cnNext.forEach((id) => queue.push(id));
          }
        }

        const stillReferenced = new Set<string>();
        Object.values(currentNodes).forEach(
          (n: {
            nodeType: string;
            next?: string | string[] | null;
            trueNext?: string[] | null;
            falseNext?: string[] | null;
          }) => {
            if (n.nodeType === "CONDITION") {
              n.trueNext?.forEach((id) => stillReferenced.add(id));
              n.falseNext?.forEach((id) => stillReferenced.add(id));
            } else {
              if (typeof n.next === "string") stillReferenced.add(n.next);
              else if (Array.isArray(n.next))
                n.next.forEach((id) => stillReferenced.add(id));
            }
          }
        );

        falseSubtree.forEach((cid) => {
          if (!stillReferenced.has(cid)) {
            delete currentNodes[cid];
          }
        });
      }

      const referenced = new Set<string>();
      Object.values(currentNodes).forEach(
        (n: {
          nodeType: string;
          next?: string | string[] | null;
          trueNext?: string[] | null;
          falseNext?: string[] | null;
        }) => {
          if (n.nodeType === "CONDITION") {
            n.trueNext?.forEach((id) => referenced.add(id));
            n.falseNext?.forEach((id) => referenced.add(id));
          } else {
            if (typeof n.next === "string") referenced.add(n.next);
            else if (Array.isArray(n.next))
              n.next.forEach((id) => referenced.add(id));
          }
        }
      );
      const newRoots = Object.keys(currentNodes).filter(
        (id) => !referenced.has(id)
      );

      return { ...prev, nodes: currentNodes, roots: newRoots };
    });
    setHasLocalChanges(true);
  };

  const handleSwapBranch = (node: { id: string }) => {
    setGraphData((prev) => {
      if (!prev) return prev;
      const currentNodes = { ...prev.nodes };
      const n = currentNodes[node.id];
      if (!n || n.nodeType !== "CONDITION") return prev;

      const newTrueNext = n.falseNext || [];
      const newFalseNext = n.trueNext || [];

      currentNodes[node.id] = {
        ...n,
        trueNext: newTrueNext,
        falseNext: newFalseNext,
        raw: {
          ...n.raw,
          true: newTrueNext,
          false: newFalseNext,
        },
      };

      return { ...prev, nodes: currentNodes };
    });
    setHasLocalChanges(true);
  };

  const handleConnectParameter = ({
    sourceNodeId,
    sourceField,
    targetNodeId,
    targetField,
  }: ParameterBinding) => {
    setGraphData((prev) => {
      if (!prev) return prev;
      const targetNode = prev.nodes[targetNodeId];
      if (!targetNode) return prev;

      // Only force nodes have a guaranteed action, so only their inputs
      // are meaningful to bind — other nodes' input handles are read-only.
      if (!targetNode.raw?.properties?.force) return prev;

      const ancestors = getAncestorNodes(prev, targetNodeId);
      if (!ancestors.some((n) => n.id === sourceNodeId)) return prev;

      const existingParams =
        (targetNode.raw?.properties?.parameters as
          | Record<string, unknown>
          | undefined) || {};

      const currentNodes = { ...prev.nodes };
      currentNodes[targetNodeId] = {
        ...targetNode,
        raw: {
          ...targetNode.raw,
          properties: {
            ...targetNode.raw?.properties,
            parameters: {
              ...existingParams,
              [targetField]: buildByNodeRef(sourceNodeId, sourceField),
            },
          },
        },
      };

      return { ...prev, nodes: currentNodes };
    });
    setHasLocalChanges(true);
  };

  const handleDisconnectParameter = (
    targetNodeId: string,
    targetField: string
  ) => {
    setGraphData((prev) => {
      if (!prev) return prev;
      const targetNode = prev.nodes[targetNodeId];
      if (!targetNode) return prev;

      const existingParams = {
        ...((targetNode.raw?.properties?.parameters as
          | Record<string, unknown>
          | undefined) || {}),
      };
      delete existingParams[targetField];

      const currentNodes = { ...prev.nodes };
      currentNodes[targetNodeId] = {
        ...targetNode,
        raw: {
          ...targetNode.raw,
          properties: {
            ...targetNode.raw?.properties,
            parameters: existingParams,
          },
        },
      };

      return { ...prev, nodes: currentNodes };
    });
    setHasLocalChanges(true);
  };

  const handleToggleForceNode = (node: { id: string }) => {
    setGraphData((prev) => {
      if (!prev) return prev;
      const targetNode = prev.nodes[node.id];
      if (!targetNode) return prev;

      const wasForced = Boolean(targetNode.raw?.properties?.force);

      const currentNodes = { ...prev.nodes };
      currentNodes[node.id] = {
        ...targetNode,
        raw: {
          ...targetNode.raw,
          properties: {
            ...targetNode.raw?.properties,
            force: !wasForced,
          },
        },
      };

      return { ...prev, nodes: currentNodes };
    });
    setHasLocalChanges(true);
  };

  const handleSaveFlow = async () => {
    setIsSubmitting(true);
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
          ...(node.raw?.properties?.force && { force: true }),
          ...(node.nodeType === "NORMAL" &&
            node.raw?.properties?.parameters &&
            Object.keys(node.raw.properties.parameters).length > 0 && {
              parameters: node.raw.properties.parameters,
            }),
          ...(node.nodeType === "HANDOFF" && {
            targetAgentId: node.raw?.properties?.targetAgentId,
            targetBlueprintId:
              node.raw?.properties?.targetBlueprintId || undefined,
          }),
        },
        createdAt: node.createdAt,
      };

      if (node.nodeType === "CONDITION") {
        return {
          ...baseNode,
          true: node.trueNext || node.raw?.true || [],
          false: node.falseNext || node.raw?.false || [],
        };
      } else if (node.nodeType === "HANDOFF") {
        return baseNode;
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
      blueprint?.title || blueprintNodes?.title || "Newly Created Blueprint",
      blueprint?.description ||
        blueprintNodes?.description ||
        "Blueprint created from flow",
      agentId,
      updatedNodes,
      taskId,
      blueprintNodes?.messages,
      blocking
    );

    if (setSelectedItem && response?.Blueprint) {
      setSelectedItem(response.Blueprint);
    }

    if (response?.Blueprint?.nodes) {
      setGraphData(buildDefinitionGraph(response.Blueprint));
      setBaselineNodes({
        blueprintId: response.Blueprint.id,
        nodes: response.Blueprint.nodes || [],
      });
    }

    setHasLocalChanges(false);
    setShowDiffPanel(false);
    if (setAiResponse) {
      setAiResponse(null);
    }
    setSaveSuccess(true);
    setIsSubmitting(false);
    onSave?.();
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
    (!graphData?.nodes || Object.keys(graphData.nodes).length === 0) &&
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
          onSwapBranchClick={handleSwapBranch}
          onDeleteNodeClick={handleDeleteNode}
          onSave={handleSaveFlow}
          onShowDiff={() => setShowDiffPanel(true)}
          onCloseDiff={() => setShowDiffPanel(false)}
          onShowValidationErrors={setShowValidationErrors}
          onSaveSuccessChange={setSaveSuccess}
          isSuperviseFlow={isSuperviseFlow}
          isSubmitting={isSubmitting}
          showConnections={showConnections}
          onConnectParameter={handleConnectParameter}
          onDisconnectParameter={handleDisconnectParameter}
          onToggleForceNode={handleToggleForceNode}
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
        newNodeForce={newNodeForce}
        setNewNodeForce={setNewNodeForce}
        newNodeType={newNodeType}
        setNewNodeType={setNewNodeType}
        selectedBranch={selectedBranch}
        setSelectedBranch={setSelectedBranch}
        inheritedNextBranch={inheritedNextBranch}
        setInheritedNextBranch={setInheritedNextBranch}
        handleSubmit={editMode ? handleEditNode : handleAddNode}
        selectedIntegration={selectedIntegration}
        setSelectedIntegration={setSelectedIntegration}
        editMode={editMode}
        editingNode={
          editingNodeId && graphData?.nodes?.[editingNodeId]
            ? graphData.nodes[editingNodeId]
            : undefined
        }
        agentId={agentId || blueprintNodes?.agentId || ""}
        teamId={teamId}
        handoffTargetAgentId={handoffTargetAgentId}
        setHandoffTargetAgentId={setHandoffTargetAgentId}
        handoffTargetBlueprintId={handoffTargetBlueprintId}
        setHandoffTargetBlueprintId={setHandoffTargetBlueprintId}
      />
    </>
  );
}

export default BlueprintFlowWidget;
