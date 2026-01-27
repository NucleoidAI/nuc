type NodeType = {
  id: string;
  type: string;
  properties?: {
    label?: string;
    icon?: string;
    action?: string;
    description?: string;
    [key: string]: unknown;
  };
  next?: string[] | null;
  true?: string[] | null;
  false?: string[] | null;
  createdAt?: string;
};

export interface DiffStats {
  added: number;
  removed: number;
  modified: number;
  total: number;
}

export interface NodeChangeInfo {
  id: string;
  changeType: "added" | "modified" | "removed" | "unchanged";
}

function normalizeNode(node: NodeType): NodeType {
  const normalized: NodeType = {
    id: node.id,
    type: node.type,
  };

  if (node.properties) {
    normalized.properties = { ...node.properties };
  }

  if (node.next !== undefined) {
    normalized.next = node.next;
  }

  if (node.true !== undefined) {
    normalized.true = node.true;
  }

  if (node.false !== undefined) {
    normalized.false = node.false;
  }

  if (node.createdAt) {
    normalized.createdAt = node.createdAt;
  }

  return normalized;
}

function areNodesDifferent(node1: NodeType, node2: NodeType): boolean {
  const n1 = normalizeNode(node1);
  const n2 = normalizeNode(node2);

  return JSON.stringify(n1) !== JSON.stringify(n2);
}

export function calculateDiffStats(
  savedNodes: NodeType[] = [],
  currentNodes: NodeType[] = []
): DiffStats {
  const savedMap = new Map(savedNodes.map((node) => [node.id, node]));
  const currentMap = new Map(currentNodes.map((node) => [node.id, node]));

  let added = 0;
  let removed = 0;
  let modified = 0;

  currentNodes.forEach((currentNode) => {
    const savedNode = savedMap.get(currentNode.id);
    if (!savedNode) {
      added++;
    } else if (areNodesDifferent(savedNode, currentNode)) {
      modified++;
    }
  });

  savedNodes.forEach((savedNode) => {
    if (!currentMap.has(savedNode.id)) {
      removed++;
    }
  });

  return {
    added,
    removed,
    modified,
    total: added + removed + modified,
  };
}

export function calculateNodeChanges(
  savedNodes: NodeType[] = [],
  currentNodes: NodeType[] = []
): Map<string, NodeChangeInfo> {
  const changeMap = new Map<string, NodeChangeInfo>();
  const savedMap = new Map(savedNodes.map((node) => [node.id, node]));
  const currentMap = new Map(currentNodes.map((node) => [node.id, node]));

  currentNodes.forEach((currentNode) => {
    const savedNode = savedMap.get(currentNode.id);
    if (!savedNode) {
      changeMap.set(currentNode.id, {
        id: currentNode.id,
        changeType: "added",
      });
    } else if (areNodesDifferent(savedNode, currentNode)) {
      changeMap.set(currentNode.id, {
        id: currentNode.id,
        changeType: "modified",
      });
    } else {
      changeMap.set(currentNode.id, {
        id: currentNode.id,
        changeType: "unchanged",
      });
    }
  });

  savedNodes.forEach((savedNode) => {
    if (!currentMap.has(savedNode.id)) {
      changeMap.set(savedNode.id, {
        id: savedNode.id,
        changeType: "removed",
      });
    }
  });

  return changeMap;
}

export function normalizeJSON(nodes: NodeType[]): string {
  const sortedNodes = [...nodes].sort((a, b) => a.id.localeCompare(b.id));

  const normalizedNodes = sortedNodes.map(normalizeNode);

  return JSON.stringify(normalizedNodes, null, 2);
}

type FlowInput = NodeType[] | { nodes: NodeType[] } | null | undefined;

export function extractNodesFromFlow(flow: FlowInput): NodeType[] {
  if (!flow) return [];

  if (Array.isArray(flow)) {
    return flow;
  }

  if (
    typeof flow === "object" &&
    "nodes" in flow &&
    Array.isArray(flow.nodes)
  ) {
    return flow.nodes;
  }

  return [];
}
