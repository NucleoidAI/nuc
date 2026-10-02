import { validateArgs, type Field, type Tool } from "./mock-api-tool";

export function defineLocalTool(config: {
  name: string;
  description: string;
  properties: Record<string, Field>;
  required?: string[];
  run: (args: Record<string, any>) => Promise<unknown>;
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
        validateArgs(inputSchema, args);
        return result(await config.run(args));
      } catch (error: any) {
        const name = error?.name;
        const message =
          error instanceof Error ? error.message : String(error ?? "Unknown");
        return result(
          name && name !== "Error"
            ? { error: message, code: name }
            : { error: message },
          true,
        );
      }
    },
  };
}
