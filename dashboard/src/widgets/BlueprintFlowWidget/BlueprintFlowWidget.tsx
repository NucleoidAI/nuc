import ApiNodeDrawer from "../../components/ApiNode/ApiNodeDrawer";
import BlueprintFlow from "../../components/BlueprintFlow/BlueprintFlow";
import BlueprintFlowSkeleton from "../../components/Skeletons/BlueprintFlowSkeleton";
import NodeEditorWidget from "../NodeEditorWidget/NodeEditorWidget";
import type { ParameterBinding } from "../../components/BlueprintFlow/NodeConnectionOverlay";
import SampleNode from "../../components/BlueprintFlow/Samples/SampleNode";
import type { SwitchCase } from "../../components/BlueprintFlow/helper";
import { publish } from "@nucleoidai/react-event";
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
  isBranchNodeType,
  isSwitchNodeType,
} from "../../components/BlueprintFlow/helper";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  calculateDiffStats,
  calculateNodeChanges,
} from "../../components/BlueprintFlow/DiffPanel/diffHelper";
import {
  isApiNodeType,
  withApiNodes,
  withoutApiNodes,
} from "../../components/ApiNode/apiNodes";

interface AIResponse {
  flow: FlowDefinition;
}

interface Blueprint {
  id: string;
  title: string;
  description: string;
  agentId: string;
  blocking?: boolean;
  executionMode?: "NORMAL" | "LITE";
  api?: boolean;
  skill?: string;
}

function graphToNodes(graphData: DefinitionGraph) {
  return Object.values(graphData.nodes).map((node) => {
    const baseNode = {
      id: node.id,
      type: node.nodeType,
      properties: {
        label: node.label || node.raw?.properties?.label,
        instructions: node.raw?.properties?.instructions,
        pseudocode: node.raw?.properties?.pseudocode,
        pseudocodeEnabled: node.raw?.properties?.pseudocodeEnabled,
        icon: node.icon || node.raw?.properties?.icon,
        action: node.action || node.raw?.properties?.action,
        description: node.description || node.raw?.properties?.description,
        ...(node.raw?.properties?.force && { force: true }),
        ...(node.nodeType === "NORMAL" &&
          node.raw?.properties?.parameters &&
          Object.keys(node.raw.properties.parameters).length > 0 && {
            parameters: node.raw.properties.parameters,
          }),
        ...(node.nodeType === "APPROVAL" && {
          question: node.raw?.properties?.question,
        }),
        ...(node.nodeType === "SWITCH" && {
          cases: node.cases ?? node.raw?.properties?.cases ?? [],
        }),
        ...(node.nodeType === "HANDOFF" && {
          targetAgentId: node.raw?.properties?.targetAgentId,
          targetBlueprintId:
            node.raw?.properties?.targetBlueprintId || undefined,
        }),
        ...(isApiNodeType(node.nodeType) && {
          fields: node.raw?.properties?.fields ?? [],
        }),
        ...(node.nodeType === "START" && {
          strict: Boolean(node.raw?.properties?.strict),
          ...(node.raw?.properties?.timeout !== undefined && {
            timeout: node.raw.properties.timeout,
          }),
        }),
        ...(node.nodeType === "END" && {
          parameters: node.raw?.properties?.parameters ?? {},
        }),
      },
      createdAt: node.createdAt,
    };

    if (isBranchNodeType(node.nodeType)) {
      return {
        ...baseNode,
        true: node.trueNext || node.raw?.true || [],
        false: node.falseNext || node.raw?.false || [],
      };
    } else if (node.nodeType === "HANDOFF") {
      return baseNode;
    }

    return {
      ...baseNode,
      next: Array.isArray(node.next)
        ? node.next
        : node.next
        ? [node.next]
        : null,
    };
  });
}

function nextIdsOf(node?: { next?: string | string[] | null }): string[] {
  if (!node) return [];
  return Array.isArray(node.next) ? node.next : node.next ? [node.next] : [];
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
  liteMode = false,
  api,
  showConnections: showConnectionsProp,
  onDescriptionChange,
  onDescriptionLoadingChange,
  onSkillChange,
  onSkillLoadingChange,
  onNodesChange,
  onContextChange,
  onSave,
}: {
  aiResponse?: AIResponse;
  setAiResponse?: (response: AIResponse | null) => void;
  blueprint: Blueprint;
  taskId?: string;
  setSelectedItem?: (item: Blueprint) => void;
  onDescriptionChange?: (description: string) => void;
  onDescriptionLoadingChange?: (loading: boolean) => void;
  onSkillChange?: (skill: string) => void;
  onSkillLoadingChange?: (loading: boolean) => void;
  onNodesChange?: (nodes: ReturnType<typeof graphToNodes>) => void;
  onContextChange?: (
    context: import("../../hooks/useBlueprint").BlueprintContext | null
  ) => void;
  usedNodeIds?: Set<string>;
  lastUsedNodeId?: string | null;
  failedNodeId?: string | null;
  isSuperviseFlow?: boolean;
  agentId?: string;
  readOnly?: boolean;
  teamId?: string;
  blocking?: boolean;
  onBlockingChange?: (value: boolean) => void;
  liteMode?: boolean;
  api?: boolean;
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
  const lastSavedRef = useRef<{ title?: string; description?: string }>({});

  const {
    getBlueprintWithNode,
    upsertBlueprint,
    generate,
    generatePseudocode,
  } = useBlueprint();
  const { blueprintNodes, loading } = getBlueprintWithNode(blueprint?.id);
  const { getMCPs } = useMCPs();
  const { mcps } = getMCPs();

  const hasDifferences = useMemo(() => {
    if (!baselineNodes?.nodes || !graphData?.nodes) return false;

    const currentNodesArray = Object.values(graphData.nodes).map(
      (node) => node.raw
    );

    return calculateDiffStats(baselineNodes.nodes, currentNodesArray).total > 0;
  }, [baselineNodes, graphData]);

  const isDirty = baselineNodes?.nodes ? hasDifferences : hasLocalChanges;

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

  const [localDescription, setLocalDescription] = useState("");
  const [localSkill, setLocalSkill] = useState("");
  const generateRequestRef = useRef(0);
  const generationRef = useRef<Promise<{
    description: string;
    skill: string;
  }> | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingGenerateRef = useRef<{
    requestId: number;
    nodes: ReturnType<typeof graphToNodes>;
  } | null>(null);

  const runGenerate = (
    requestId: number,
    nodes: ReturnType<typeof graphToNodes>
  ) => {
    onDescriptionLoadingChange?.(true);
    onSkillLoadingChange?.(true);
    publish("BLUEPRINT", "GENERATING", { generating: true });

    const promise = generate(nodes).then((result) => {
      if (requestId === generateRequestRef.current) {
        setLocalDescription(result.description);
        onDescriptionChange?.(result.description);
        setLocalSkill(result.skill);
        onSkillChange?.(result.skill);

        onDescriptionLoadingChange?.(false);
        onSkillLoadingChange?.(false);
        generationRef.current = null;
        publish("BLUEPRINT", "GENERATING", { generating: false });
      }
      return result;
    });

    generationRef.current = promise;
    return promise;
  };

  useEffect(() => {
    if (!hasLocalChanges || !graphData) return;

    const requestId = ++generateRequestRef.current;
    const nodes = graphToNodes(graphData);
    pendingGenerateRef.current = { requestId, nodes };

    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      pendingGenerateRef.current = null;
      runGenerate(requestId, nodes);
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphData, hasLocalChanges]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedParentNode, setSelectedParentNode] = useState(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [newNodeLabel, setNewNodeLabel] = useState("");
  const [newNodeInstructions, setNewNodeInstructions] = useState("");
  const [newNodeQuestion, setNewNodeQuestion] = useState("");
  const [newNodeDescription, setNewNodeDescription] = useState("");
  const [newNodePseudocodeEnabled, setNewNodePseudocodeEnabled] =
    useState(true);
  const [pseudocodeLoading, setPseudocodeLoading] = useState(false);
  const [newNodeForce, setNewNodeForce] = useState(false);
  const [newNodeParameters, setNewNodeParameters] = useState<
    Record<string, unknown>
  >({});
  const [newNodeType, setNewNodeType] = useState("NORMAL");
  const [newNodeCaseLabel, setNewNodeCaseLabel] = useState("");
  const [switchCases, setSwitchCases] = useState<SwitchCase[]>([]);
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

  const [showSampleFlow] = useState(false);
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

  useEffect(() => {
    if (hasLocalChanges) return;
    if (blueprintNodes?.skill) {
      setLocalSkill(blueprintNodes.skill);
      onSkillChange?.(blueprintNodes.skill);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blueprintNodes?.skill, hasLocalChanges]);

  useEffect(() => {
    onNodesChange?.(graphData ? graphToNodes(graphData) : []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphData]);

  useEffect(() => {
    onContextChange?.(blueprintNodes?.context ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blueprintNodes?.context]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [blueprintNodes, aiResponse, blueprint?.id]
  );

  useEffect(
    () => {
      if (!blueprintNodes) return;

      if (
        blueprintNodes.title === lastSavedRef.current.title &&
        blueprintNodes.description === lastSavedRef.current.description
      ) {
        return;
      }

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
    if (readOnly || api === undefined || !graphData) return;

    const hasApiNodes = Object.values(graphData.nodes).some(
      (node) => node.nodeType === "START"
    );
    if (api === hasApiNodes) return;

    const nodes = graphToNodes(graphData);
    setGraphData(
      buildDefinitionGraph(api ? withApiNodes(nodes) : withoutApiNodes(nodes))
    );
    setHasLocalChanges(true);
  }, [api, graphData, readOnly]);

  useEffect(() => {
    if (graphData && mcps?.content?.mcps) {
      const validationResult = validateFlow(graphData, mcps.content.mcps);
      setValidationErrors(validationResult.errors);

      if (validationResult.errors.length === 0 && showValidationErrors) {
        setShowValidationErrors(false);
      }
    }
  }, [graphData, mcps, showValidationErrors]);

  const generateNodePseudocode = async (instructions: string) => {
    const effectiveAgentId =
      agentId || blueprintNodes?.agentId || blueprint?.agentId;

    setPseudocodeLoading(true);

    try {
      setNodePseudocode(
        await generatePseudocode(instructions, effectiveAgentId)
      );
    } catch {
      setNodePseudocode("");
    } finally {
      setPseudocodeLoading(false);
    }
  };

  const handlePseudocodeEnabledChange = async (enabled: boolean) => {
    setNewNodePseudocodeEnabled(enabled);

    if (!enabled) {
      setNodePseudocode("");
      return;
    }

    await generateNodePseudocode(newNodeInstructions);
  };

  const pseudocodeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    if (!drawerOpen || !newNodePseudocodeEnabled) return;

    if (pseudocodeDebounceRef.current) {
      clearTimeout(pseudocodeDebounceRef.current);
    }

    if (!newNodeInstructions.trim()) {
      setNodePseudocode("");
      return;
    }

    pseudocodeDebounceRef.current = setTimeout(() => {
      generateNodePseudocode(newNodeInstructions);
    }, 1200);

    return () => {
      if (pseudocodeDebounceRef.current) {
        clearTimeout(pseudocodeDebounceRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newNodeInstructions, newNodePseudocodeEnabled, drawerOpen]);

  const handleIntegrationChange = (integration) => {
    setNewNodeDescription((current) =>
      !current.trim() ||
      current.trim() === (selectedIntegration?.description || "").trim()
        ? integration?.description || ""
        : current
    );
    const previousAction =
      selectedIntegration?.action || graphData?.nodes?.[editingNodeId]?.action;
    if (previousAction && previousAction !== integration?.action) {
      setNewNodeParameters({});
    }
    setSelectedIntegration(integration);
  };

  const handleAddNodeClick = (node) => {
    setSelectedParentNode(node);
    setNewNodeLabel("");
    setNewNodeInstructions("");
    setNewNodeQuestion("");
    setNewNodeDescription("");
    setNewNodeForce(false);
    setNewNodeParameters({});
    setNodePseudocode("");
    setNewNodePseudocodeEnabled(true);
    setNewNodeType("NORMAL");
    setNewNodeCaseLabel("");
    setSwitchCases([]);
    setSelectedBranch("true");
    setInheritedNextBranch("none");
    setShowValidationErrors(false);
    setDrawerOpen(true);
  };

  const [apiNodeId, setApiNodeId] = useState<string | null>(null);

  const handleApiNodeSave = (properties: Record<string, unknown>) => {
    setGraphData((prev) => {
      const node = prev?.nodes[apiNodeId];
      if (!node) return prev;
      const label = (properties.label as string) || node.label;
      return {
        ...prev,
        nodes: {
          ...prev.nodes,
          [node.id]: {
            ...node,
            label,
            raw: {
              ...node.raw,
              properties: { ...node.raw?.properties, ...properties, label },
            },
          },
        },
      };
    });
    setHasLocalChanges(true);
    setApiNodeId(null);
  };

  const handleEditNodeClick = (node) => {
    if (isApiNodeType(node.nodeType)) {
      setApiNodeId(node.id);
      return;
    }

    setEditMode(true);
    setEditingNodeId(node.id);
    const nodeLabel = node?.label || node?.properties?.label || "";
    const nodeInstructions = node?.raw?.properties?.instructions || "";
    const nodeType = node.nodeType || "NORMAL";
    setNewNodeLabel(nodeLabel);
    setNewNodeInstructions(nodeInstructions);
    setNewNodeDescription(
      node?.description ||
        node?.properties?.description ||
        node?.raw?.properties?.description ||
        ""
    );
    setNewNodeForce(Boolean(node?.raw?.properties?.force));
    setNewNodeQuestion(node?.raw?.properties?.question || "");
    setNewNodeParameters({ ...node?.raw?.properties?.parameters });
    setNewNodeType(nodeType);
    setNodePseudocode(node?.raw?.properties?.pseudocode || "");
    setNewNodePseudocodeEnabled(true);

    if (isSwitchNodeType(nodeType)) {
      setSwitchCases(
        nextIdsOf(node).map(
          (nodeId) =>
            (node?.cases ?? node?.raw?.properties?.cases ?? []).find(
              (item) => item.nodeId === nodeId
            ) ?? { nodeId }
        )
      );
    } else {
      setSwitchCases([]);
    }

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

        if (isSwitchNodeType(parentNode.nodeType)) {
          setNewNodeCaseLabel(
            (parentNode.cases ?? []).find((item) => item.nodeId === node.id)
              ?.label ?? ""
          );
        }

        if (isBranchNodeType(parentNode.nodeType)) {
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

  const parametersToSave =
    newNodeType === "NORMAL" ? newNodeParameters : undefined;

  const handleEditNode = () => {
    if (!editingNodeId) return;

    const nodeIcon =
      newNodeType === "CONDITION"
        ? "mdi:help-circle-outline"
        : newNodeType === "SWITCH"
        ? "mdi:call-split"
        : newNodeType === "APPROVAL"
        ? "mdi:account-check"
        : newNodeType === "HANDOFF"
        ? "mdi:account-arrow-right"
        : "mdi:cube-outline";
    const actionType =
      newNodeType === "CONDITION"
        ? "PLATFORM:decision"
        : newNodeType === "SWITCH"
        ? "PLATFORM:switch"
        : newNodeType === "APPROVAL"
        ? "PLATFORM:customer_approval"
        : newNodeType === "HANDOFF"
        ? "PLATFORM:handoff"
        : selectedIntegration?.action;
    const descriptionText =
      newNodeDescription.trim() ||
      (newNodeType === "CONDITION"
        ? "A decision node that branches the flow based on conditions."
        : newNodeType === "SWITCH"
        ? "Routes the flow to one of several branches, chosen by the agent."
        : newNodeType === "APPROVAL"
        ? "Waits for the customer to approve or reject before continuing."
        : newNodeType === "HANDOFF"
        ? "Transfer this task to another agent's blueprint."
        : selectedIntegration?.description || "");
    setGraphData((prevData) => {
      if (!prevData) return prevData;

      const currentNodes = { ...prevData.nodes };
      const nodeToUpdate = currentNodes[editingNodeId];

      if (!nodeToUpdate) return prevData;

      const wasSwitch = isSwitchNodeType(nodeToUpdate.nodeType);
      const willBeSwitch = isSwitchNodeType(newNodeType);
      const isChangingToCondition =
        isBranchNodeType(newNodeType) &&
        !isBranchNodeType(nodeToUpdate.nodeType);
      const isChangingToNormal =
        !isBranchNodeType(newNodeType) &&
        !willBeSwitch &&
        isBranchNodeType(nodeToUpdate.nodeType);

      let updatedNode;

      if (willBeSwitch) {
        const childIds = wasSwitch
          ? nextIdsOf(nodeToUpdate)
          : isBranchNodeType(nodeToUpdate.nodeType)
          ? [
              ...(nodeToUpdate.trueNext || []),
              ...(nodeToUpdate.falseNext || []),
            ]
          : nextIdsOf(nodeToUpdate);

        const editedCases = wasSwitch ? switchCases : [];
        const cases = childIds.map(
          (nodeId) =>
            editedCases.find((item) => item.nodeId === nodeId) ?? {
              nodeId,
              label: currentNodes[nodeId]?.label,
            }
        );

        updatedNode = {
          ...nodeToUpdate,
          label: newNodeLabel,
          description: descriptionText,
          action: actionType,
          icon: nodeIcon,
          nodeType: newNodeType,
          connectorType: "default" as const,
          cases,
          next: childIds.length ? childIds : null,
          trueNext: undefined,
          falseNext: undefined,
          raw: {
            ...nodeToUpdate.raw,
            type: newNodeType,
            properties: {
              ...nodeToUpdate.raw?.properties,
              label: newNodeLabel,
              instructions: newNodeInstructions,
              pseudocodeEnabled: newNodePseudocodeEnabled,
              pseudocode: nodePseudocode,
              force: newNodeForce,
              description: descriptionText,
              action: actionType,
              icon: nodeIcon,
              cases,
            },
            next: childIds,
            true: undefined,
            false: undefined,
          },
        };
      } else if (wasSwitch) {
        const survivingNext = nextIdsOf(nodeToUpdate).slice(0, 1);
        const willBranch = isBranchNodeType(newNodeType);
        const isHandoff = newNodeType === "HANDOFF";
        const keptProperties = { ...nodeToUpdate.raw?.properties };
        delete keptProperties.cases;

        updatedNode = {
          ...nodeToUpdate,
          label: newNodeLabel,
          description: descriptionText,
          action: actionType,
          icon: nodeIcon,
          nodeType: newNodeType,
          connectorType: willBranch
            ? ("decision" as const)
            : ("default" as const),
          cases: undefined,
          trueNext: willBranch ? survivingNext : undefined,
          falseNext: willBranch ? [] : undefined,
          next: isHandoff ? null : survivingNext[0] ?? null,
          raw: {
            ...nodeToUpdate.raw,
            type: newNodeType,
            properties: {
              ...keptProperties,
              label: newNodeLabel,
              instructions: newNodeInstructions,
              question: newNodeQuestion,
              pseudocodeEnabled: newNodePseudocodeEnabled,
              pseudocode: nodePseudocode,
              force: newNodeForce,
              parameters: parametersToSave,
              description: descriptionText,
              action: actionType,
              icon: nodeIcon,
              ...(isHandoff && {
                targetAgentId: handoffTargetAgentId,
                targetBlueprintId: handoffTargetBlueprintId || undefined,
              }),
            },
            next: willBranch || isHandoff ? null : survivingNext,
            true: willBranch ? survivingNext : undefined,
            false: willBranch ? [] : undefined,
          },
        };
      } else if (isChangingToCondition) {
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
              instructions: newNodeInstructions,
              question: newNodeQuestion,
              pseudocodeEnabled: newNodePseudocodeEnabled,
              pseudocode: nodePseudocode,
              force: newNodeForce,
              parameters: parametersToSave,
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
              instructions: newNodeInstructions,
              question: newNodeQuestion,
              pseudocodeEnabled: newNodePseudocodeEnabled,
              pseudocode: nodePseudocode,
              force: newNodeForce,
              parameters: parametersToSave,
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
              instructions: newNodeInstructions,
              question: newNodeQuestion,
              pseudocodeEnabled: newNodePseudocodeEnabled,
              pseudocode: nodePseudocode,
              force: newNodeForce,
              parameters: parametersToSave,
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
              instructions: newNodeInstructions,
              question: newNodeQuestion,
              pseudocodeEnabled: newNodePseudocodeEnabled,
              pseudocode: nodePseudocode,
              force: newNodeForce,
              parameters: parametersToSave,
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
    setNewNodeInstructions("");
    setNewNodeQuestion("");
    setNewNodeDescription("");
    setNewNodeForce(false);
    setNewNodeParameters({});
    setNodePseudocode("");
    setNewNodePseudocodeEnabled(false);
    setNewNodeType("NORMAL");
    setNewNodeCaseLabel("");
    setSwitchCases([]);
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
        : newNodeType === "SWITCH"
        ? "mdi:call-split"
        : newNodeType === "APPROVAL"
        ? "mdi:account-check"
        : newNodeType === "HANDOFF"
        ? "mdi:account-arrow-right"
        : selectedIntegration?.icon;
    const actionType =
      newNodeType === "CONDITION"
        ? "PLATFORM:decision"
        : newNodeType === "SWITCH"
        ? "PLATFORM:switch"
        : newNodeType === "APPROVAL"
        ? "PLATFORM:customer_approval"
        : newNodeType === "HANDOFF"
        ? "PLATFORM:handoff"
        : selectedIntegration?.action;

    const descriptionText =
      newNodeDescription.trim() ||
      (newNodeType === "CONDITION"
        ? "A decision node that branches the flow based on conditions."
        : newNodeType === "SWITCH"
        ? "Routes the flow to one of several branches, chosen by the agent."
        : newNodeType === "APPROVAL"
        ? "Waits for the customer to approve or reject before continuing."
        : newNodeType === "HANDOFF"
        ? "Transfer this task to another agent's blueprint."
        : selectedIntegration?.description || "");
    if (selectedParentNode.id === "starter") {
      const firstNode = isSwitchNodeType(newNodeType)
        ? {
            id: newId,
            label: newNodeLabel,
            description: descriptionText,
            nodeType: newNodeType,
            action: actionType,
            icon: nodeIcon,
            createdAt: currentTime,
            connectorType: "default" as const,
            cases: [],
            next: null,
            raw: {
              id: newId,
              type: newNodeType,
              properties: {
                action: actionType,
                label: newNodeLabel,
                instructions: newNodeInstructions,
                pseudocodeEnabled: newNodePseudocodeEnabled,
                pseudocode: nodePseudocode,
                force: newNodeForce,
                description: descriptionText,
                icon: nodeIcon,
                cases: [],
              },
              next: [],
              createdAt: currentTime,
            },
          }
        : isBranchNodeType(newNodeType)
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
                instructions: newNodeInstructions,
                question: newNodeQuestion,
                pseudocodeEnabled: newNodePseudocodeEnabled,
                pseudocode: nodePseudocode,
                force: newNodeForce,
                parameters: parametersToSave,
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
                instructions: newNodeInstructions,
                question: newNodeQuestion,
                pseudocodeEnabled: newNodePseudocodeEnabled,
                pseudocode: nodePseudocode,
                force: newNodeForce,
                parameters: parametersToSave,
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
                instructions: newNodeInstructions,
                question: newNodeQuestion,
                pseudocodeEnabled: newNodePseudocodeEnabled,
                pseudocode: nodePseudocode,
                force: newNodeForce,
                parameters: parametersToSave,
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

      const isParentCondition = isBranchNodeType(parentNode.nodeType);
      const isParentSwitch = isSwitchNodeType(parentNode.nodeType);
      const existingTrueNext = parentNode.trueNext;
      const existingFalseNext = parentNode.falseNext;

      let inheritedNext = null;
      if (isParentCondition) {
        if (selectedBranch === "true") {
          inheritedNext = existingTrueNext?.[0] || null;
        } else {
          inheritedNext = existingFalseNext?.[0] || null;
        }
      } else if (isParentSwitch) {
        inheritedNext = null;
      } else {
        inheritedNext = parentNode.next;
      }

      const switchInheritedIds = inheritedNext
        ? Array.isArray(inheritedNext)
          ? inheritedNext
          : [inheritedNext]
        : [];
      const switchInheritedCases = switchInheritedIds.map((nodeId) => ({
        nodeId,
        label: currentNodes[nodeId]?.label,
      }));

      const newNode = isSwitchNodeType(newNodeType)
        ? {
            id: newId,
            label: newNodeLabel,
            description: descriptionText,
            nodeType: newNodeType,
            action: actionType,
            icon: nodeIcon,
            createdAt: currentTime,
            connectorType: "default" as const,
            cases: switchInheritedCases,
            next: switchInheritedIds.length ? switchInheritedIds : null,
            raw: {
              id: newId,
              type: newNodeType,
              properties: {
                action: actionType,
                label: newNodeLabel,
                instructions: newNodeInstructions,
                pseudocodeEnabled: newNodePseudocodeEnabled,
                pseudocode: nodePseudocode,
                force: newNodeForce,
                description: descriptionText,
                icon: nodeIcon,
                cases: switchInheritedCases,
              },
              next: switchInheritedIds,
              createdAt: currentTime,
            },
          }
        : isBranchNodeType(newNodeType)
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
                instructions: newNodeInstructions,
                question: newNodeQuestion,
                pseudocodeEnabled: newNodePseudocodeEnabled,
                pseudocode: nodePseudocode,
                force: newNodeForce,
                parameters: parametersToSave,
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
                instructions: newNodeInstructions,
                question: newNodeQuestion,
                pseudocodeEnabled: newNodePseudocodeEnabled,
                pseudocode: nodePseudocode,
                force: newNodeForce,
                parameters: parametersToSave,
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
                instructions: newNodeInstructions,
                question: newNodeQuestion,
                pseudocodeEnabled: newNodePseudocodeEnabled,
                pseudocode: nodePseudocode,
                force: newNodeForce,
                parameters: parametersToSave,
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
      } else if (isParentSwitch) {
        const parentNextIds = [...nextIdsOf(parentNode), newId];
        const parentCases = [
          ...(parentNode.cases ?? []),
          {
            nodeId: newId,
            label: newNodeCaseLabel.trim() || newNodeLabel,
          },
        ];

        updatedParent = {
          ...parentNode,
          cases: parentCases,
          next: parentNextIds,
          raw: {
            ...parentNode.raw,
            properties: {
              ...parentNode.raw?.properties,
              cases: parentCases,
            },
            next: parentNextIds,
          },
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

      const referenced = new Set<string>();
      Object.values(currentNodes).forEach(
        (node: {
          id: string;
          nodeType: string;
          next?: string | string[] | null;
          trueNext?: string[] | null;
          falseNext?: string[] | null;
        }) => {
          if (isBranchNodeType(node.nodeType)) {
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
      if (!deletedNode || isApiNodeType(deletedNode.nodeType)) return prev;

      const isDeletedCondition = isBranchNodeType(deletedNode.nodeType);
      const trueChildren: string[] = isDeletedCondition
        ? deletedNode.trueNext || []
        : [];
      const falseChildren: string[] = isDeletedCondition
        ? deletedNode.falseNext || []
        : [];
      const normalChildren: string[] = isDeletedCondition
        ? []
        : isSwitchNodeType(deletedNode.nodeType)
        ? nextIdsOf(deletedNode).slice(0, 1)
        : nextIdsOf(deletedNode);

      const dedup = (arr: string[]) => [...new Set(arr)];

      Object.keys(currentNodes).forEach((id) => {
        const n = currentNodes[id];
        if (isBranchNodeType(n.nodeType)) {
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
        } else if (isSwitchNodeType(n.nodeType)) {
          const parentNextIds = nextIdsOf(n);
          if (parentNextIds.includes(node.id)) {
            const replacement = isDeletedCondition
              ? trueChildren
              : normalChildren;
            const removedCase = (n.cases ?? []).find(
              (item) => item.nodeId === node.id
            );

            const newNext = dedup(
              parentNextIds.flatMap((id) =>
                id === node.id ? replacement : [id]
              )
            );
            const newCases = newNext.map(
              (nodeId) =>
                (n.cases ?? []).find((item) => item.nodeId === nodeId) ??
                (removedCase
                  ? { ...removedCase, nodeId }
                  : { nodeId, label: currentNodes[nodeId]?.label })
            );

            currentNodes[id] = {
              ...n,
              cases: newCases,
              next: newNext.length ? newNext : null,
              raw: {
                ...n.raw,
                properties: { ...n.raw?.properties, cases: newCases },
                next: newNext,
              },
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
                next: dedupedReplacement.length > 0 ? dedupedReplacement : null,
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
          if (isBranchNodeType(cn.nodeType)) {
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
            if (isBranchNodeType(n.nodeType)) {
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
          if (isBranchNodeType(n.nodeType)) {
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
      if (!n || !isBranchNodeType(n.nodeType)) return prev;

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

      if (!targetNode.raw?.properties?.force && targetNode.nodeType !== "END")
        return prev;

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

  const handleOverrideParameter = (
    nodeId: string,
    field: string,
    value: unknown
  ) => {
    if (readOnly) return;
    setGraphData((prev) => {
      const node = prev?.nodes[nodeId];
      if (!node || (node.nodeType !== "NORMAL" && node.nodeType !== "END"))
        return prev;
      const parameters = { ...node.raw?.properties?.parameters };
      if (value === undefined) delete parameters[field];
      else parameters[field] = value;
      return {
        ...prev,
        nodes: {
          ...prev.nodes,
          [nodeId]: {
            ...node,
            raw: {
              ...node.raw,
              properties: { ...node.raw?.properties, parameters },
            },
          },
        },
      };
    });
    setHasLocalChanges(true);
  };

  const handleToggleForceNode = (node: { id: string }) => {
    setGraphData((prev) => {
      if (!prev) return prev;
      const targetNode = prev.nodes[node.id];
      if (!targetNode) return prev;

      if (isApiNodeType(targetNode.nodeType)) return prev;

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
    if (!graphData) return;

    const agentId = blueprintNodes?.agentId || blueprint?.agentId;

    if (!agentId) {
      console.error("Cannot save blueprint: agentId is required");
      alert(
        "Cannot save blueprint: Agent ID is missing. Please ensure an agent is selected."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedNodes = graphToNodes(graphData);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      if (pendingGenerateRef.current) {
        const { requestId, nodes } = pendingGenerateRef.current;
        pendingGenerateRef.current = null;
        runGenerate(requestId, nodes);
      }

      let generated: { description: string; skill: string } | null = null;
      try {
        generated = generationRef.current ? await generationRef.current : null;
      } catch (error) {
        console.error(
          "Blueprint description/skill generation failed; saving with the last known description/skill instead",
          error
        );
        generationRef.current = null;
      }

      const response = await upsertBlueprint(
        blueprintNodes?.id || blueprint?.id,
        blueprint?.title || blueprintNodes?.title || "Newly Created Blueprint",
        generated?.description ||
          localDescription ||
          blueprintNodes?.description ||
          blueprint?.description ||
          "Blueprint created from flow",
        agentId,
        updatedNodes,
        taskId,
        blueprintNodes?.messages,
        blocking,
        generated?.skill || localSkill || blueprintNodes?.skill || undefined,
        undefined,
        liteMode ? "LITE" : "NORMAL",
        api
      );

      lastSavedRef.current = {
        title: response?.Blueprint?.title,
        description: response?.Blueprint?.description,
      };

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
      onSave?.();
    } catch (error) {
      console.error("Failed to save blueprint", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFlowChange = (updatedGraphData) => {
    setGraphData(updatedGraphData);
    setHasLocalChanges(true);
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
    setNewNodeInstructions("");
    setNewNodeQuestion("");
    setNodePseudocode("");
    setNewNodePseudocodeEnabled(true);
    setNewNodeType("NORMAL");
    setNewNodeCaseLabel("");
    setSwitchCases([]);
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
          {!showSampleFlow && (
            <SampleNode handleStarterNodeClick={handleStarterNodeClick} />
          )}
        </>
      ) : !graphData && hasRealFlowData ? null : (
        <BlueprintFlow
          graphData={graphData}
          enrichedGraphData={enrichedGraphData}
          drawerOpen={drawerOpen}
          readOnly={readOnly}
          hasLocalChanges={hasLocalChanges}
          hasDifferences={isDirty}
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
          onOverrideParameter={handleOverrideParameter}
          onToggleForceNode={handleToggleForceNode}
          liteMode={liteMode}
        />
      )}

      <ApiNodeDrawer
        open={Boolean(apiNodeId && graphData?.nodes?.[apiNodeId])}
        node={apiNodeId ? graphData?.nodes?.[apiNodeId] : undefined}
        blueprintId={blueprintNodes?.id || blueprint?.id}
        onClose={() => setApiNodeId(null)}
        onSave={handleApiNodeSave}
      />

      <NodeEditorWidget
        graphData={graphData}
        pseudocode={nodePseudocode}
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
        setNewNodePseudocodeEnabled={handlePseudocodeEnabledChange}
        pseudocodeLoading={pseudocodeLoading}
        parameters={newNodeParameters}
        onParametersChange={setNewNodeParameters}
        newNodeForce={newNodeForce}
        setNewNodeForce={setNewNodeForce}
        newNodeType={newNodeType}
        setNewNodeType={setNewNodeType}
        newNodeCaseLabel={newNodeCaseLabel}
        setNewNodeCaseLabel={setNewNodeCaseLabel}
        switchCases={switchCases}
        setSwitchCases={setSwitchCases}
        selectedBranch={selectedBranch}
        setSelectedBranch={setSelectedBranch}
        inheritedNextBranch={inheritedNextBranch}
        setInheritedNextBranch={setInheritedNextBranch}
        handleSubmit={editMode ? handleEditNode : handleAddNode}
        selectedIntegration={selectedIntegration}
        setSelectedIntegration={handleIntegrationChange}
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
