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
    return nextIds[0];
  }

  return nextIds[0];
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

  for (const step of completedSteps) {
    if (!currentNode) break;

    const stepMatchesNode = step.nodeId
      ? step.nodeId === currentNode.id
      : currentNode.properties?.action === step.action;
    if (!stepMatchesNode) break;

    if (currentNode.type === "CONDITION" || currentNode.type === "APPROVAL") {
      const tookTrue =
        currentNode.type === "APPROVAL"
          ? step.result === "APPROVED"
          : tookTrueBranch(step);
      const nextIds = tookTrue
        ? currentNode.true || []
        : currentNode.false || [];
      currentNode = nextIds.length
        ? nodes.find((n) => nextIds.includes(n.id))
        : undefined;
    } else if (currentNode.type === "SWITCH") {
      const nextIds = nextIdsOf(currentNode);
      const selected = nextIds.length
        ? selectedSwitchId(step, nextIds)
        : undefined;
      currentNode = selected ? nodes.find((n) => n.id === selected) : undefined;
    } else {
      const nextIds = nextIdsOf(currentNode);
      currentNode = nextIds.length
        ? nodes.find((n) => nextIds.includes(n.id))
        : undefined;
    }
  }

  return currentNode;
}
