import type { DefinitionGraph } from "./helper";

export interface RawNode {
  id: string;
  type: string;
  properties?: {
    label?: string;
    action?: string;
    description?: string;
    icon?: string;
  };
  next?: string[];
  true?: string[];
  false?: string[];
}

export function definitionGraphToRawNodes(graph: DefinitionGraph): RawNode[] {
  return Object.values(graph.nodes).map((n) => ({
    id: n.id,
    type: n.nodeType,
    properties: {
      label: n.label,
      action: n.action,
      icon: n.icon,
      description: n.description,
    },
    next: n.raw?.next
      ? Array.isArray(n.raw.next)
        ? n.raw.next
        : [n.raw.next]
      : [],
    true: n.raw?.true ?? [],
    false: n.raw?.false ?? [],
  }));
}
