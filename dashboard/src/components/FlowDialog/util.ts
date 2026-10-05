type TaskTreeNode = {
  id: string;
  action?: string;
  status?: string;
  comment?: string;
  taskId?: string;
  nodeId?: string;
  createdAt?: string;
  children?: TaskTreeNode[];
  [key: string]: unknown;
};

type TimelineGraphNode = {
  id: string;
  label: string;
  type: "task";
  action?: string;
  status?: string;
  comment?: string;
  tooltip?: string;
  nodeId?: string;
  taskId?: string;
  createdAt?: string;
  parameters?: unknown;
  result?: unknown;
  raw: Omit<TaskTreeNode, "children">;
  next?: string | string[];
  previous?: string;
};

type TimelineGraph = {
  nodes: Record<string, TimelineGraphNode>;
  roots: string[];
};

function isTimelineGraph(value: unknown): value is TimelineGraph {
  if (!value || typeof value !== "object") return false;

  const maybe = value as {
    nodes?: unknown;
    roots?: unknown;
  };

  if (!maybe.nodes || typeof maybe.nodes !== "object") return false;
  if (!Array.isArray(maybe.roots)) return false;

  return true;
}

export function buildTimelineGraph(
  tree?: TaskTreeNode | TimelineGraph | null
): TimelineGraph {
  if (isTimelineGraph(tree)) {
    return tree;
  }

  if (!tree || !tree.id) {
    return { nodes: {}, roots: [] };
  }

  const nodes: Record<string, TimelineGraphNode> = {};
  const roots: string[] = [];

  const walk = (node: TaskTreeNode, parentId: string | null = null): void => {
    if (!node || !node.id) return;

    const { children = [], ...rest } = node;

    const label =
      node.action?.replace(/^PLATFORM:/i, "") ||
      node.comment ||
      node.nodeId ||
      "Step";

    if (!nodes[node.id]) {
      nodes[node.id] = {
        id: node.id,
        label,
        type: "task",
        action: node.action,
        status: node.status,
        comment: node.comment,
        tooltip: node.comment,
        nodeId: node.nodeId,
        taskId: node.taskId,
        createdAt: node.createdAt,
        parameters: node.parameters,
        result: node.result,
        raw: rest,
      };
    }

    const childIds = children
      .map((c) => c.id)
      .filter((id): id is string => Boolean(id));

    if (childIds.length === 1) {
      nodes[node.id].next = childIds[0];
    } else if (childIds.length > 1) {
      nodes[node.id].next = childIds;
    }

    if (parentId) {
      nodes[node.id].previous = parentId;
    } else if (!roots.includes(node.id)) {
      roots.push(node.id);
    }

    children.forEach((child) => walk(child, node.id));
  };

  walk(tree);

  return { nodes, roots };
}

export const getActionIcon = (action?: string) => {
  if (!action) return "mdi:cube-outline";

  const normalized = String(action).toUpperCase();

  if (normalized.includes("SCRAPE")) return "mdi:web";
  if (normalized.includes("LLM")) return "mdi:robot";

  const iconMap: Record<string, string> = {
    SCRAPE_WEBSITE: "mdi:web",
    LLM: "mdi:robot",
    DEFAULT: "mdi:cube-outline",
  };

  return iconMap[normalized] || iconMap.DEFAULT;
};

type StatusConfig = {
  label: string;
  color: "primary" | "success" | "error" | "warning" | "info";
};

const STATUS_MAP: Record<string, StatusConfig> = {
  IN_PROGRESS: { label: "In Progress", color: "primary" },
  DOING: { label: "In Progress", color: "primary" },
  COMPLETED: { label: "Completed", color: "success" },
  FAILED: { label: "Failed", color: "error" },
  BLOCKED: { label: "Blocked", color: "error" },
  WAITING_FOR_USER: { label: "Waiting for user", color: "warning" },
  WAITING_FOR_APPROVAL: { label: "Waiting for approval", color: "warning" },
  SUPERVISED_NEEDED: { label: "Supervision Raised", color: "info" },
  LOW_CONFIDENCE: { label: "Low Confidence", color: "warning" },
};

export const getStatusConfig = (status?: string): StatusConfig => {
  if (!status) return { label: "Pending", color: "info" };

  return (
    STATUS_MAP[String(status).toUpperCase()] || {
      label: String(status)
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/^\w/, (c) => c.toUpperCase()),
      color: "info",
    }
  );
};

export type StepField = {
  name: string;
  value: unknown;
};

const parseMaybeJson = (value: unknown): unknown => {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  const looksJson =
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"));

  if (!looksJson) return value;

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
};

const toFields = (value: unknown, fallbackName: string): StepField[] => {
  const parsed = parseMaybeJson(value);

  if (parsed === null || parsed === undefined || parsed === "") return [];

  if (
    typeof parsed === "object" &&
    !Array.isArray(parsed) &&
    Object.keys(parsed).length > 0
  ) {
    return Object.entries(parsed as Record<string, unknown>).map(
      ([name, fieldValue]) => ({ name, value: fieldValue })
    );
  }

  return [{ name: fallbackName, value: parsed }];
};

export const getStepInputs = (parameters?: unknown): StepField[] =>
  toFields(parameters, "parameters");

export const getStepOutputs = (result?: unknown): StepField[] =>
  toFields(result, "result");

export type FieldBinding = {
  sourceNodeId: string;
  targetNodeId: string;
  field: string;
  adjacent: boolean;
};

export const buildFieldBindings = (graph: TimelineGraph): FieldBinding[] => {
  const order: string[] = [];
  const seen = new Set<string>();

  const walkChain = (id?: string | string[]) => {
    if (!id) return;
    const nextId = Array.isArray(id) ? id[0] : id;
    if (!nextId || seen.has(nextId)) return;

    seen.add(nextId);
    order.push(nextId);
    walkChain(graph.nodes[nextId]?.next);
  };

  graph.roots.forEach((rootId) => {
    if (seen.has(rootId)) return;
    seen.add(rootId);
    order.push(rootId);
    walkChain(graph.nodes[rootId]?.next);
  });

  const outputsByNode = new Map<string, Set<string>>();
  order.forEach((id) => {
    const names = getStepOutputs(graph.nodes[id]?.result).map((f) => f.name);
    outputsByNode.set(id, new Set(names));
  });

  const bindings: FieldBinding[] = [];

  order.forEach((targetId, index) => {
    const inputs = getStepInputs(graph.nodes[targetId]?.parameters);

    inputs.forEach(({ name }) => {
      for (let i = index - 1; i >= 0; i--) {
        const sourceId = order[i];

        if (outputsByNode.get(sourceId)?.has(name)) {
          bindings.push({
            sourceNodeId: sourceId,
            targetNodeId: targetId,
            field: name,
            adjacent: i === index - 1,
          });
          return;
        }
      }
    });
  });

  return bindings;
};

export const formatFieldValue = (
  value: unknown
): { isJson: boolean; text: string } => {
  if (value === null || value === undefined)
    return { isJson: false, text: "-" };

  const parsed = parseMaybeJson(value);

  if (typeof parsed === "object") {
    try {
      return { isJson: true, text: JSON.stringify(parsed, null, 2) };
    } catch {
      return { isJson: false, text: String(value) };
    }
  }

  return { isJson: false, text: String(parsed) };
};

export const splitAction = (action?: string) => {
  const raw = String(action || "Step");
  const [namespace, name] = raw.includes(":")
    ? raw.split(/:(.+)/)
    : [null, raw];

  const label = (name || raw)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());

  return {
    namespace: namespace ? namespace.toLowerCase() : undefined,
    label,
  };
};
