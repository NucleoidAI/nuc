/** Shared transport for the enterprise demo APIs. Never writes to MCP stdout. */
export interface Field {
  type: "string" | "number" | "integer" | "boolean";
  description?: string;
  enum?: string[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
}
export interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, Field>;
    required: string[];
    additionalProperties: false;
  };
  handler: (
    args: Record<string, unknown>,
  ) => Promise<{ content: { type: "text"; text: string }[]; isError: boolean }>;
}
export const string = (description: string): Field => ({
  type: "string",
  minLength: 1,
  description,
});
export const amount: Field = {
  type: "integer",
  minimum: 1,
  description:
    "Positive amount in minor currency units (e.g. 1000 = USD 10.00).",
};
export function validateArgs(
  inputSchema: Tool["inputSchema"],
  args: Record<string, unknown>,
) {
  if (!args || typeof args !== "object" || Array.isArray(args))
    throw new Error("Arguments must be an object");
  for (const name of inputSchema.required)
    if (args[name] === undefined) throw new Error(`${name} is required`);
  for (const [name, value] of Object.entries(args)) {
    const field = inputSchema.properties[name];
    if (!field) throw new Error(`Unknown argument: ${name}`);
    if (
      field.type === "integer"
        ? !Number.isSafeInteger(value)
        : typeof value !== field.type
    )
      throw new Error(`Invalid ${name}: expected ${field.type}`);
    if (
      typeof value === "number" &&
      (!Number.isFinite(value) ||
        (field.minimum !== undefined && value < field.minimum) ||
        (field.maximum !== undefined && value > field.maximum))
    )
      throw new Error(`Invalid ${name}: outside allowed range`);
    if (typeof value === "string" && !value.trim())
      throw new Error(`${name} must not be empty`);
    if (field.enum && !field.enum.includes(String(value)))
      throw new Error(`Invalid ${name}: expected ${field.enum.join(", ")}`);
  }
}
export function dropBlankOptionals(
  inputSchema: Tool["inputSchema"],
  args: Record<string, unknown>,
): Record<string, unknown> {
  if (!args || typeof args !== "object" || Array.isArray(args)) return args;
  const cleaned: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(args)) {
    const blank = typeof value === "string" && !value.trim();
    if (blank && !inputSchema.required.includes(name)) continue;
    cleaned[name] = value;
  }
  return cleaned;
}
export function defineTool(config: {
  name: string;
  description: string;
  env: string;
  properties: Record<string, Field>;
  required?: string[];
  request: (args: Record<string, any>) => {
    path: string;
    method?: string;
    body?: unknown;
    query?: Record<string, unknown>;
  };
  response?: (payload: any, args: Record<string, any>) => unknown;
}): Tool {
  const inputSchema = {
    type: "object" as const,
    properties: config.properties,
    required: config.required ?? [],
    additionalProperties: false as const,
  };
  return {
    name: config.name,
    description: config.description,
    inputSchema,
    async handler(args) {
      const result = (payload: unknown, isError = false) => ({
        content: [{ type: "text" as const, text: JSON.stringify(payload) }],
        isError,
      });
      try {
        args = dropBlankOptionals(inputSchema, args);
        validateArgs(inputSchema, args);
        const base = process.env[config.env];
        if (!base) throw new Error(`${config.env} is not configured`);
        const url = new URL(base);
        if (!["http:", "https:"].includes(url.protocol))
          throw new Error(`${config.env} must be an HTTP(S) URL`);
        const request = config.request(args);
        url.pathname = url.pathname.replace(/\/$/, "") + request.path;
        url.search = "";
        url.hash = "";
        for (const [key, value] of Object.entries(request.query ?? {}))
          if (value !== undefined) url.searchParams.set(key, String(value));
        const response = await fetch(url, {
          method: request.method ?? "GET",
          headers: { "Content-Type": "application/json" },
          body:
            request.body === undefined
              ? undefined
              : JSON.stringify(request.body),
          signal: AbortSignal.timeout(15000),
        });
        const text = await response.text();
        let payload: any;
        try {
          payload = JSON.parse(text);
        } catch {
          throw new Error(
            `Mock API returned non-JSON (HTTP ${response.status})`,
          );
        }
        const trackingError = payload?.output?.completeTrackResults?.some(
          (entry: any) => entry.trackResults?.some((track: any) => track.error),
        );
        const failed = !response.ok || Boolean(trackingError);
        return result(
          !failed && config.response ? config.response(payload, args) : payload,
          failed,
        );
      } catch (error) {
        return result(
          { error: error instanceof Error ? error.message : String(error) },
          true,
        );
      }
    },
  };
}
