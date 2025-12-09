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
