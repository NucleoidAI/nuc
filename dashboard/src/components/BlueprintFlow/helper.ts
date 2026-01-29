type DefinitionNode = {
  id: string;
  type: "NORMAL" | "CONDITION" | string;
  properties?: {
    action?: string;
    label?: string;
    icon?: string;
    description?: string;
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

type DefinitionGraphNode = {
  id: string;
  label: string;
  nodeType: DefinitionNode["type"];
  action?: string;
  description?: string;
  icon?: string;
  createdAt?: string;
  raw: DefinitionNode;
  connectorType: "decision" | "default";
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
      connectorType: node.type === "CONDITION" ? "decision" : "default",
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
