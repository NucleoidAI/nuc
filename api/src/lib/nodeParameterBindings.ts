type InputSchema = {
  properties?: Record<string, unknown>;
  required?: string[];
  additionalProperties?: unknown;
};

type Node = {
  type?: string;
  properties?: {
    action?: string;
    force?: boolean;
    parameters?: Record<string, unknown>;
  };
};

type ContextMessage = {
  role: "user" | "system" | "assistant";
  content: object | string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function getBoundNodeStep({
  node,
  inputSchema,
}: {
  node?: Node;
  inputSchema?: InputSchema;
}) {
  const action = node?.properties?.action;
  const parameters = node?.properties?.parameters;
  if (
    node?.type !== "NORMAL" ||
    !node.properties?.force ||
    !action ||
    !parameters ||
    !Object.keys(parameters).length ||
    !inputSchema?.properties ||
    (inputSchema.additionalProperties !== undefined &&
      inputSchema.additionalProperties !== false)
  ) {
    return undefined;
  }
  const fields = new Set([
    ...Object.keys(inputSchema.properties),
    ...(inputSchema.required ?? []),
  ]);
  if (
    !fields.size ||
    [...fields].some(
      (field) =>
        !Object.prototype.hasOwnProperty.call(parameters, field) ||
        parameters[field] === undefined
    )
  )
    return undefined;

  return {
    next_step: {
      action,
      parameters: {},
      comment: "Executing blueprint node with configured input values.",
    },
    result_score: undefined,
  };
}

export function getLiteNodeStep({
  node,
  inputSchema,
}: {
  node?: Node;
  inputSchema?: InputSchema;
}) {
  const action = node?.properties?.action;
  if (!action) return undefined;

  const decidesInAction = node.type === "CONDITION" || node.type === "SWITCH";
  const takesNoInput =
    inputSchema !== undefined &&
    !Object.keys(inputSchema.properties ?? {}).length;

  if (!decidesInAction && !takesNoInput) return undefined;

  return {
    next_step: {
      action,
      parameters: {},
      comment: "Executing blueprint node without generated parameters.",
    },
    result_score: undefined,
  };
}

export function getParameterGenerationContext({
  context,
  node,
}: {
  context: ContextMessage[];
  node?: Node;
}): ContextMessage[] {
  const action = node?.properties?.action;
  const parameters = node?.properties?.parameters ?? {};
  const boundFields = Object.keys(parameters);
  if (!action || !boundFields.length) return context;

  return context.map((message) => {
    if (!isRecord(message.content)) return message;
    const content = { ...message.content };
    for (const key of ["actions", "mcp_tools"]) {
      const definitions = content[key];
      if (!Array.isArray(definitions)) continue;
      content[key] = definitions.map((definition) => {
        if (
          !isRecord(definition) ||
          definition.action !== action ||
          !isRecord(definition.inputSchema)
        )
          return definition;
        const schema = definition.inputSchema;
        return {
          ...definition,
          inputSchema: {
            ...schema,
            ...(isRecord(schema.properties) && {
              properties: Object.fromEntries(
                Object.entries(schema.properties).filter(
                  ([field]) => !boundFields.includes(field)
                )
              ),
            }),
            ...(Array.isArray(schema.required) && {
              required: schema.required.filter(
                (field) => !boundFields.includes(field)
              ),
            }),
          },
        };
      });
    }
    return { ...message, content };
  });
}

export function getForcedActionContext({
  context,
  action,
}: {
  context: ContextMessage[];
  action?: string;
}): ContextMessage[] {
  if (!action) return context;

  return context.map((message) => {
    if (!isRecord(message.content)) return message;
    const content = { ...message.content };
    for (const key of ["actions", "mcp_tools"]) {
      const definitions = content[key];
      if (!Array.isArray(definitions)) continue;
      content[key] = definitions.filter(
        (definition) => isRecord(definition) && definition.action === action
      );
    }
    return { ...message, content };
  });
}

export function mergeNodeParameters({
  node,
  action,
  generated,
}: {
  node?: Node;
  action: string;
  generated?: Record<string, unknown>;
}): Record<string, unknown> {
  if (node?.properties?.action !== action) return generated ?? {};
  return { ...generated, ...node.properties.parameters };
}
