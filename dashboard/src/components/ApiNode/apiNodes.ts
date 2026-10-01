export type ApiFieldType =
  | "string"
  | "number"
  | "boolean"
  | "enum"
  | "array"
  | "object";

export type ApiType = {
  type: ApiFieldType;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: "email" | "url" | "uuid" | "datetime";
  min?: number;
  max?: number;
  integer?: boolean;
  values?: string[];
  items?: ApiType;
  minItems?: number;
  maxItems?: number;
  fields?: ApiField[];
};

export type ApiField = ApiType & {
  name: string;
  description?: string;
  required?: boolean;
};

type FlowNode = {
  id: string;
  type: string;
  next?: string[] | null;
  true?: string[] | null;
  false?: string[] | null;
  properties?: Record<string, unknown>;
  [key: string]: unknown;
};

export const API_TIMEOUT_DEFAULT = 60;
export const API_TIMEOUT_MAX = 300;

const API_START_NODE_ID = "api-start";
const API_END_NODE_ID = "api-end";
const FIELD_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function isApiNodeType(type?: string) {
  return type === "START" || type === "END";
}

export function defaultApiType(type: ApiFieldType): ApiType {
  if (type === "enum") return { type, values: [] };
  if (type === "array") return { type, items: { type: "string" } };
  if (type === "object") return { type, fields: [] };
  return { type };
}

export function toInputProperty(field: ApiType & { description?: string }) {
  const type =
    field.type === "enum"
      ? "string"
      : field.type === "number" && field.integer
      ? "integer"
      : field.type;

  return { type, description: field.description };
}

function boundErrors(path: string, type: ApiType) {
  const pairs: [keyof ApiType, keyof ApiType][] = [
    ["minLength", "maxLength"],
    ["min", "max"],
    ["minItems", "maxItems"],
  ];

  return pairs.flatMap(([lower, upper]) => {
    const low = type[lower];
    const high = type[upper];
    return typeof low === "number" && typeof high === "number" && low > high
      ? [`${path}: ${lower} must not be greater than ${upper}`]
      : [];
  });
}

function typeErrors(path: string, type: ApiType): string[] {
  const errors = boundErrors(path, type);

  if (type.type === "enum") {
    const values = type.values ?? [];
    if (!values.length) errors.push(`${path}: add at least one enum value`);
    if (new Set(values).size !== values.length)
      errors.push(`${path}: enum values must be unique`);
  }

  if (type.type === "string" && type.pattern) {
    try {
      new RegExp(type.pattern);
    } catch {
      errors.push(`${path}: pattern is not a valid regular expression`);
    }
  }

  if (type.type === "array" && type.items) {
    errors.push(...typeErrors(`${path}[]`, type.items));
  }

  if (type.type === "object") {
    errors.push(...apiFieldErrors(type.fields ?? [], `${path}.`));
  }

  return errors;
}

export function apiFieldErrors(fields: ApiField[], prefix = ""): string[] {
  const names = fields.map((field) => field.name);

  return fields.flatMap((field, index) => {
    const path = `${prefix}${field.name || `#${index + 1}`}`;
    const errors: string[] = [];

    if (!FIELD_NAME.test(field.name)) {
      errors.push(
        `${path}: name must start with a letter or underscore and use only letters, digits and underscores`
      );
    } else if (names.indexOf(field.name) !== index) {
      errors.push(`${path}: duplicate field name`);
    }

    return [...errors, ...typeErrors(path, field)];
  });
}

function successorIds(node: FlowNode): string[] {
  return [...(node.next ?? []), ...(node.true ?? []), ...(node.false ?? [])];
}

export function withApiNodes(nodes: FlowNode[]): FlowNode[] {
  const body = nodes.filter((node) => !isApiNodeType(node.type));

  const end: FlowNode = nodes.find((node) => node.type === "END") ?? {
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

  const referenced = new Set(wired.flatMap(successorIds));
  const roots = wired.map((n) => n.id).filter((id) => !referenced.has(id));
  const entry = roots.length ? roots : [end.id];
  const existingStart = nodes.find((node) => node.type === "START");

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
  const removed = new Set(
    nodes.filter((node) => isApiNodeType(node.type)).map((node) => node.id)
  );
  if (!removed.size) return nodes;

  const prune = (refs?: string[] | null) => {
    if (!Array.isArray(refs)) return refs;
    const kept = refs.filter((id) => !removed.has(id));
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
