type ToolArgs = Record<string, unknown>;

type ToolResponse = {
  _meta: object;
  content: Array<{ type: string; text: string }>;
  isError: boolean;
};

type ToolHandler = (args: ToolArgs) => ToolResponse | Promise<ToolResponse>;

type ToolClient = {
  callTool: (action: string, params: ToolArgs) => Promise<ToolResponse>;
  close: () => Promise<void>;
};

type McpTool = {
  name: string;
  handler: ToolHandler;
};

type McpMock = {
  provider: string;
  mode: "isolated" | "partial";
  tools: Record<string, ToolHandler>;
  reset?: () => void;
};

function toolMap(tools: McpTool[]): Record<string, ToolHandler> {
  return Object.fromEntries(tools.map(({ name, handler }) => [name, handler]));
}

function respond(payload: unknown, isError = false): ToolResponse {
  return {
    _meta: {},
    content: [{ type: "text", text: JSON.stringify(payload) }],
    isError,
  };
}

function toolNotFound(): ToolResponse {
  return {
    _meta: {},
    content: [{ type: "text", text: "Tool not found." }],
    isError: true,
  };
}

export { respond, toolNotFound, toolMap };
export type {
  ToolArgs,
  ToolResponse,
  ToolHandler,
  ToolClient,
  McpTool,
  McpMock,
};
