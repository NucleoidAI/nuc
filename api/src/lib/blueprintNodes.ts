export type SwitchCase = {
  nodeId: string;
  label?: string;
  description?: string;
};

function tookTrueBranch(step: { result?: string }) {
  if (step.result === "true" || step.result === "false")
    return step.result === "true";

  try {
    const parsed = JSON.parse(step.result ?? "");
    if (parsed?.result === true || parsed?.result === "true") return true;
    if (parsed?.result === false || parsed?.result === "false") return false;
  } catch {
    return false;
  }

  return false;
}

function nextIdsOf(node: any): string[] {
  return Array.isArray(node?.next) ? node.next : node?.next ? [node.next] : [];
}

export function conditionBranch(ids: string[] | undefined, nodes: any[]) {
  return (ids ?? []).flatMap((id) => {
    const target = nodes.find((n) => n.id === id);
    if (!target) return [];

    return [
      {
        nodeId: target.id,
        action: target.properties?.action,
        label: target.properties?.label,
        description: target.properties?.description,
      },
    ];
  });
}

export function switchCases(node: any, nodes?: any[]): SwitchCase[] {
  const declared = Array.isArray(node?.properties?.cases)
    ? (node.properties.cases as SwitchCase[])
    : [];

  const byNodeId = new Map(
    declared.filter((c) => c?.nodeId).map((c) => [c.nodeId, c]),
  );

  return nextIdsOf(node).map((nodeId) => {
    const declaredCase = byNodeId.get(nodeId);
    const target = nodes?.find((n) => n.id === nodeId);

    return {
      nodeId,
      label:
        declaredCase?.label || target?.properties?.label || (nodeId as string),
      ...(declaredCase?.description
        ? { description: declaredCase.description }
        : target?.properties?.description
        ? { description: target.properties.description }
        : {}),
    };
  });
}

function selectedSwitchId(step: { result?: string }, nextIds: string[]) {
  if (step.result && nextIds.includes(step.result)) return step.result;

  try {
    const parsed = JSON.parse(step.result ?? "");
    if (typeof parsed?.nodeId === "string" && nextIds.includes(parsed.nodeId))
      return parsed.nodeId;
  } catch {
    return undefined;
  }

  return undefined;
}

export function isForcedNode(node: any) {
  return node?.properties?.force === true;
}

function successorIdsOf(node: any): string[] {
  return [...nextIdsOf(node), ...(node.true || []), ...(node.false || [])];
}

export function findNodeAhead(
  nodes: any[],
  currentNode: any,
  matches: (node: any) => boolean,
) {
  if (matches(currentNode)) return currentNode;
  if (isForcedNode(currentNode)) return undefined;

  const seen = new Set<string>([currentNode.id]);
  const queue = successorIdsOf(currentNode);

  while (queue.length) {
    const id = queue.shift() as string;
    if (seen.has(id)) continue;
    seen.add(id);

    const node = nodes.find((n) => n.id === id);
    if (!node || isForcedNode(node)) continue;
    if (matches(node)) return node;

    queue.push(...successorIdsOf(node));
  }

  return undefined;
}

function nodeAfter(
  nodes: any[],
  node: any,
  step: { result?: string },
) {
  if (node.type === "CONDITION" || node.type === "APPROVAL") {
    const tookTrue =
      node.type === "APPROVAL"
        ? step.result === "APPROVED"
        : tookTrueBranch(step);
    const nextIds = tookTrue ? node.true || [] : node.false || [];
    return nextIds.length
      ? nodes.find((n) => nextIds.includes(n.id))
      : undefined;
  }

  const nextIds = nextIdsOf(node);

  if (node.type === "SWITCH") {
    const selected = nextIds.length
      ? selectedSwitchId(step, nextIds)
      : undefined;
    return selected ? nodes.find((n) => n.id === selected) : undefined;
  }

  return nextIds.length
    ? nodes.find((n) => nextIds.includes(n.id))
    : undefined;
}

export function resolveCurrentNode(
  nodes: any[],
  completedSteps: { action: string; result?: string; nodeId?: string | null }[],
) {
  const allNextIds = new Set(
    nodes.flatMap((n) => [
      ...nextIdsOf(n),
      ...(n.true || []),
      ...(n.false || []),
    ]),
  );
  let currentNode = nodes.find((n) => !allNextIds.has(n.id));

  if (
    currentNode?.type === "START" &&
    !completedSteps.some((step) => step.nodeId === currentNode.id)
  ) {
    currentNode = nodeAfter(nodes, currentNode, {});
  }

  for (const step of completedSteps) {
    if (!currentNode) break;

    const matched = findNodeAhead(nodes, currentNode, (node) =>
      step.nodeId
        ? node.id === step.nodeId
        : node.properties?.action === step.action,
    );
    if (!matched) continue;

    currentNode = nodeAfter(nodes, matched, step);
  }

  return currentNode;
}
