type FlowNode = Record<string, unknown>;

function sanitizeFlow(flow: unknown[]): FlowNode[] {
  const idSet = new Set<string>();
  const deduped: FlowNode[] = [];

  for (const node of flow) {
    if (!node || typeof node !== "object") continue;
    const n = node as FlowNode;
    const id = n.id as string;
    if (!id || idSet.has(id)) continue;
    idSet.add(id);
    deduped.push(n);
  }

  return deduped.map((n) => {
    const id = n.id as string;

    const sanitizeRefs = (refs: unknown): string[] | null => {
      if (!Array.isArray(refs)) return null;
      const filtered = refs.filter(
        (ref) => typeof ref === "string" && ref !== id && idSet.has(ref)
      );
      return filtered.length ? filtered : null;
    };

    const result: FlowNode = { ...n };

    if (Array.isArray(n.next)) {
      result.next = sanitizeRefs(n.next);
    }

    const props = n.properties as FlowNode | undefined;
    if (props) {
      const updated: FlowNode = { ...props };
      if (Array.isArray(props.true)) updated.true = sanitizeRefs(props.true);
      if (Array.isArray(props.false)) updated.false = sanitizeRefs(props.false);
      result.properties = updated;
    }

    if (Array.isArray(n.true)) result.true = sanitizeRefs(n.true);
    if (Array.isArray(n.false)) result.false = sanitizeRefs(n.false);

    return result;
  });
}

function firstString(...values: unknown[]) {
  return values.find(
    (value): value is string => typeof value === "string" && value !== ""
  );
}

function defaultIcon(type: unknown) {
  if (type === "CONDITION") return "mdi:source-branch";
  if (type === "SWITCH") return "mdi:call-split";
  return "mdi:circle-outline";
}

function restoreCosmetics(
  flow: FlowNode[],
  existingNodes?: unknown[]
): FlowNode[] {
  const previous = new Map<string, FlowNode>();

  for (const node of existingNodes ?? []) {
    const n = node as FlowNode;
    if (typeof n?.id === "string") {
      previous.set(n.id, (n.properties as FlowNode) ?? {});
    }
  }

  return flow.map((n) => {
    const props = (n.properties as FlowNode) ?? {};
    const previousProps = previous.get(n.id as string) ?? {};

    const label =
      firstString(
        props.label,
        previousProps.label,
        typeof props.action === "string"
          ? props.action.replace(/^PLATFORM:/i, "")
          : undefined
      ) ?? (n.id as string);

    const icon =
      firstString(props.icon, previousProps.icon) ?? defaultIcon(n.type);

    const description = [props.description, previousProps.description].find(
      (value): value is string => typeof value === "string"
    );

    return {
      ...n,
      properties: {
        ...props,
        label,
        icon,
        ...(description !== undefined && { description }),
      },
    };
  });
}

function normalizeFlow(flow: unknown[], existingNodes?: unknown[]) {
  return restoreCosmetics(sanitizeFlow(flow), existingNodes);
}

export { normalizeFlow };
