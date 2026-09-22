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

export function resolveCurrentNode(
  nodes: any[],
  completedSteps: { action: string; result?: string; nodeId?: string | null }[],
) {
  const allNextIds = new Set(
    nodes.flatMap((n) => [
      ...(Array.isArray(n.next) ? n.next : n.next ? [n.next] : []),
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
    } else {
      const nextIds = Array.isArray(currentNode.next)
        ? currentNode.next
        : currentNode.next
        ? [currentNode.next]
        : [];
      currentNode = nextIds.length
        ? nodes.find((n) => nextIds.includes(n.id))
        : undefined;
    }
  }

  return currentNode;
}
