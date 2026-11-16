import { refPathOf } from "./parameterRefs";

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
export const JSON_START_NODE_ID = "json-start";

export const BLUEPRINT_MODES = ["API", "CHAT", "JSON"] as const;

export type BlueprintMode = (typeof BLUEPRINT_MODES)[number];

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

function withoutNodes(
  nodes: FlowNode[],
  matches: (node: FlowNode) => boolean
): FlowNode[] {
  const removed = new Set(nodes.filter(matches).map((node) => node.id));
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

export function withoutApiNodes(nodes: FlowNode[]): FlowNode[] {
  return withoutNodes(nodes, isApiNode);
}

export function withJsonNodes(nodes: FlowNode[]): FlowNode[] {
  const graph = withoutNodes(nodes, (node) => node.type === "END");
  const existingStart = startNodeOf(graph);
  const body = graph.filter((node) => node.type !== "START");

  const roots = rootIds(body);
  const entry = roots.length ? roots : null;

  if (existingStart) {
    const properties = Object.fromEntries(
      Object.entries(existingStart.properties ?? {}).filter(
        ([key]) => key !== "timeout"
      )
    );

    return [
      {
        ...existingStart,
        next: successorIds(existingStart).length ? existingStart.next : entry,
        properties,
      },
      ...body,
    ];
  }

  return [
    {
      id: JSON_START_NODE_ID,
      type: "START",
      next: entry,
      properties: {
        label: "Input",
        icon: "mdi:code-json",
        fields: [],
        strict: false,
      },
    },
    ...body,
  ];
}

export function jsonRequestOf(
  blueprint: { mode?: string; nodes?: FlowNode[] | null } | null | undefined,
  variables: Record<string, unknown> | null | undefined
) {
  const start =
    blueprint?.mode === "JSON" ? startNodeOf(blueprint.nodes) : undefined;

  return start
    ? {
        nodeId: start.id,
        body: variables ?? {},
        comment: "Received JSON input.",
      }
    : undefined;
}

export function applyModeNodes(
  nodes: FlowNode[],
  mode: BlueprintMode
): FlowNode[] {
  if (mode === "API") return withApiNodes(nodes);
  if (mode === "JSON") return withJsonNodes(nodes);
  return withoutApiNodes(nodes);
}

function requestOf(
  start: FlowNode,
  steps: { nodeId?: string | null; result?: unknown }[]
) {
  const result = steps.find((step) => step.nodeId === start.id)?.result;
  if (typeof result !== "string") return result ?? {};

  try {
    return JSON.parse(result);
  } catch {
    return {};
  }
}

export function omitMissingRequestRefs({
  parameters,
  start,
  steps,
  variables,
}: {
  parameters: Record<string, unknown>;
  start?: FlowNode;
  steps: { nodeId?: string | null; result?: unknown }[];
  variables?: Record<string, unknown>;
}): Record<string, unknown> {
  if (!start) return parameters;

  const optional = new Set(
    (start.properties?.fields ?? [])
      .filter((field: { required?: boolean }) => field.required === false)
      .map((field: { name: string }) => field.name)
  );
  if (!optional.size) return parameters;

  const sources: [string, Record<string, unknown>][] = [
    [`byNode.${start.id}.result.`, requestOf(start, steps)],
    ...(variables
      ? [["session_variables.", variables] as [string, Record<string, unknown>]]
      : []),
  ];

  const isPresent = (value: unknown) => {
    const path = refPathOf(value);
    const source = sources.find(([prefix]) => path?.startsWith(prefix));
    if (!path || !source) return true;

    const [prefix, values] = source;
    const field = path.slice(prefix.length).split(/[.[]/, 1)[0];
    return !optional.has(field) || field in values;
  };

  const omit = (values: Record<string, unknown>): Record<string, unknown> =>
    Object.fromEntries(
      Object.entries(values)
        .filter(([, value]) => isPresent(value))
        .map(([key, value]) => [
          key,
          isPlainObject(value) && !refPathOf(value) ? omit(value) : value,
        ])
    );

  return omit(parameters);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
