export const BRANCH_NODE_TYPES = ["CONDITION", "APPROVAL"];

export function isBranchNodeType(nodeType?: string) {
  return BRANCH_NODE_TYPES.includes(nodeType ?? "");
}

export function isSwitchNodeType(nodeType?: string) {
  return nodeType === "SWITCH";
}

export type SwitchCase = {
  nodeId: string;
  label?: string;
  description?: string;
};

export function normalizeSwitchCases(node: {
  next?: string[] | null;
  properties?: { cases?: SwitchCase[] };
}): SwitchCase[] {
  const declared = node.properties?.cases ?? [];
  const byNodeId = new Map(declared.map((item) => [item.nodeId, item]));

  return (node.next ?? []).map((nodeId) => byNodeId.get(nodeId) ?? { nodeId });
}

type DefinitionNode = {
  id: string;
  type: "NORMAL" | "CONDITION" | "APPROVAL" | string;
  properties?: {
    action?: string;
    label?: string;
    instructions?: string;
    pseudocode?: string;
    pseudocodeEnabled?: boolean;
    icon?: string;
    description?: string;
    parameters?: Record<string, unknown>;
    cases?: SwitchCase[];
    [key: string]: unknown;
  };
  next?: string[] | null;
  true?: string[] | null;
  false?: string[] | null;
  createdAt?: string;
};

export type FlowDefinition =
  | DefinitionNode[]
  | { nodes: DefinitionNode[] }
  | { nodes: DefinitionNode[] };

export type DefinitionGraphNode = {
  id: string;
  label: string;
  nodeType: DefinitionNode["type"];
  action?: string;
  description?: string;
  icon?: string;
  createdAt?: string;
  raw: DefinitionNode;
  connectorType: "decision" | "default";
  cases?: SwitchCase[];
  next?: string | string[];
  trueNext?: string[];
  falseNext?: string[];
  changeType?: "added" | "modified" | "removed" | "unchanged";
};

export type DefinitionGraph = {
  nodes: Record<string, DefinitionGraphNode>;
  roots: string[];
};

export function buildDefinitionGraph(
  definition: FlowDefinition
): DefinitionGraph {
  let list: DefinitionNode[] = [];

  if (Array.isArray(definition)) {
    list = definition;
  } else if (
    definition &&
    typeof definition === "object" &&
    "nodes" in definition &&
    Array.isArray(definition.nodes)
  ) {
    list = definition.nodes;
  }

  if (!Array.isArray(list) || list.length === 0) {
    return { nodes: {}, roots: [] };
  }

  const nodes: Record<string, DefinitionGraphNode> = {};
  const referenced = new Set<string>();

  for (const node of list) {
    const props = node.properties ?? {};

    const label =
      props.label ??
      (typeof props.action === "string"
        ? props.action.replace(/^PLATFORM:/i, "")
        : undefined) ??
      node.id;

    nodes[node.id] = {
      id: node.id,
      label,
      nodeType: node.type,
      action: typeof props.action === "string" ? props.action : undefined,
      description:
        typeof props.description === "string" ? props.description : undefined,
      icon: typeof props.icon === "string" ? props.icon : undefined,
      createdAt: node.createdAt,
      raw: node,
      connectorType: isBranchNodeType(node.type) ? "decision" : "default",
      ...(isSwitchNodeType(node.type) && {
        cases: normalizeSwitchCases(node),
      }),
    };
  }

  for (const node of list) {
    const id = node.id;
    const nextIds: string[] = [];

    if (Array.isArray(node.next)) {
      nextIds.push(...node.next);
    }

    const trueNext = node["true"];
    if (Array.isArray(trueNext)) {
      nextIds.push(...trueNext);
      nodes[id].trueNext = trueNext;
    }

    const falseNext = node["false"];
    if (Array.isArray(falseNext)) {
      nextIds.push(...falseNext);
      nodes[id].falseNext = falseNext;
    }

    if (nextIds.length === 1) {
      nodes[id].next = nextIds[0];
    } else if (nextIds.length > 1) {
      nodes[id].next = nextIds;
    }

    for (const childId of nextIds) {
      referenced.add(childId);
    }
  }

  const roots = list.map((n) => n.id).filter((id) => !referenced.has(id));

  return { nodes, roots };
}

function childIdsOf(node: DefinitionGraphNode): string[] {
  const ids: string[] = [];

  if (Array.isArray(node.next)) {
    ids.push(...node.next);
  } else if (typeof node.next === "string") {
    ids.push(node.next);
  }

  if (node.trueNext) ids.push(...node.trueNext);
  if (node.falseNext) ids.push(...node.falseNext);

  return ids;
}

export function getAncestorNodes(
  graph: DefinitionGraph,
  nodeId: string
): DefinitionGraphNode[] {
  const parentsById = new Map<string, Set<string>>();

  for (const node of Object.values(graph.nodes)) {
    for (const childId of childIdsOf(node)) {
      if (!parentsById.has(childId)) parentsById.set(childId, new Set());
      parentsById.get(childId)!.add(node.id);
    }
  }

  const visited = new Set<string>();
  const queue = [...(parentsById.get(nodeId) ?? [])];

  while (queue.length) {
    const id = queue.shift()!;
    if (visited.has(id) || id === nodeId) continue;
    visited.add(id);
    queue.push(...(parentsById.get(id) ?? []));
  }

  return [...visited]
    .map((id) => graph.nodes[id])
    .filter((node): node is DefinitionGraphNode => Boolean(node));
}

const BY_NODE_REF_PATTERN = /^byNode\.([^.]+)\.result(?:\.(.+))?$/;

export function isRefValue(value: unknown): value is { $ref: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { $ref?: unknown }).$ref === "string"
  );
}

const START_NODE_ID = "__start__";

function buildSyntheticNode(
  id: string,
  nodeType: "START",
  label: string,
  extra?: { icon?: string; description?: string; action?: string }
): DefinitionGraphNode {
  return {
    id,
    label,
    nodeType,
    raw: { id, type: nodeType },
    connectorType: "default",
    ...extra,
  };
}

export function addStartNode(graph: DefinitionGraph): DefinitionGraph {
  const rootIds = graph.roots.filter((id) => graph.nodes[id]);
  if (rootIds.length === 0) return graph;

  const nodes: DefinitionGraph["nodes"] = { ...graph.nodes };

  nodes[START_NODE_ID] = {
    ...buildSyntheticNode(START_NODE_ID, "START", "Start", {
      icon: "mdi:play",
      description: "Defines the starting point of the Blueprint",
      action: "PLATFORM:start_node",
    }),
    next: rootIds.length === 1 ? rootIds[0] : rootIds,
  };

  return { nodes, roots: [START_NODE_ID] };
}

export function parseByNodeRef(
  value: unknown
): { sourceNodeId: string; sourceField: string } | null {
  if (!isRefValue(value)) return null;
  const match = value.$ref.match(BY_NODE_REF_PATTERN);
  if (!match) return null;
  return { sourceNodeId: match[1], sourceField: match[2] ?? "result" };
}

export function buildByNodeRef(sourceNodeId: string, sourceField: string) {
  return {
    $ref:
      sourceField === "result"
        ? `byNode.${sourceNodeId}.result`
        : `byNode.${sourceNodeId}.result.${sourceField}`,
  };
}
