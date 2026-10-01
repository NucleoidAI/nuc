export type FlowNode = {
  id: string;
  type: string;
  next?: (string | null)[] | null;
  true?: (string | null)[] | null;
  false?: (string | null)[] | null;
  properties?: Record<string, any>;
  [key: string]: unknown;
};

const API_NODE_TYPES = ["START", "END"];

export const API_START_NODE_ID = "api-start";
export const API_END_NODE_ID = "api-end";

export function isApiNode(node?: { type?: string }) {
  return API_NODE_TYPES.includes(node?.type ?? "");
}

export function startNodeOf(nodes?: FlowNode[] | null): FlowNode | undefined {
  return nodes?.find((node) => node.type === "START");
}

export function endNodeOf(nodes?: FlowNode[] | null): FlowNode | undefined {
  return nodes?.find((node) => node.type === "END");
}

function successorIds(node: FlowNode): string[] {
  return [
    ...(node.next ?? []),
    ...(node.true ?? []),
    ...(node.false ?? []),
  ].filter((id): id is string => typeof id === "string");
}

function rootIds(nodes: FlowNode[]) {
  const referenced = new Set(nodes.flatMap(successorIds));
  return nodes.map((node) => node.id).filter((id) => !referenced.has(id));
}

export function withApiNodes(nodes: FlowNode[]): FlowNode[] {
  const body = nodes.filter((node) => !isApiNode(node));

  const end: FlowNode = endNodeOf(nodes) ?? {
    id: API_END_NODE_ID,
    type: "END",
    next: null,
    properties: {
      label: "Response",
      icon: "mdi:export",
      fields: [],
      parameters: {},
    },
  };

  const wired = body.map((node) =>
    node.type === "NORMAL" && !successorIds(node).length
      ? { ...node, next: [end.id] }
      : node
  );

  const roots = rootIds(wired);
  const entry = roots.length ? roots : [end.id];
  const existingStart = startNodeOf(nodes);

  const start: FlowNode = existingStart
    ? successorIds(existingStart).length
      ? existingStart
      : { ...existingStart, next: entry }
    : {
        id: API_START_NODE_ID,
        type: "START",
        next: entry,
        properties: {
          label: "Request",
          icon: "mdi:api",
          fields: [],
          strict: false,
        },
      };

  return [start, ...wired, end];
}

export function withoutApiNodes(nodes: FlowNode[]): FlowNode[] {
  const removed = new Set(nodes.filter(isApiNode).map((node) => node.id));
  if (!removed.size) return nodes;

  const prune = (refs?: (string | null)[] | null) => {
    if (!Array.isArray(refs)) return refs;
    const kept = refs.filter((id) => !id || !removed.has(id));
    return kept.length ? kept : null;
  };

  return nodes
    .filter((node) => !removed.has(node.id))
    .map((node) => ({
      ...node,
      ...("next" in node && { next: prune(node.next) }),
      ...("true" in node && { true: prune(node.true) }),
      ...("false" in node && { false: prune(node.false) }),
    }));
}

export function applyApiNodes(nodes: FlowNode[], enabled: boolean): FlowNode[] {
  return enabled ? withApiNodes(nodes) : withoutApiNodes(nodes);
}
