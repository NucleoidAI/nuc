type MCP = {
  id: string;
  action: string;
  label: string;
  provider: string;
  description: string;
  icon?: string;
  direction?: string;
  lib?: string;
  mock?: boolean;
  inputSchema?: {
    type?: string;
    properties?: Record<string, unknown>;
    required?: string[];
    additionalProperties?: unknown;
  };
  outputSchema?: Record<string, unknown>;
  oauth?: {
    scope?: string;
    tokenUrl?: string;
    clientId?: string;
    clientSecret?: string;
    redirectUri?: string;
    authUrl?: string;
    clientScript?: string;
  };
};

let current: MCP[] = [];

function list() {
  return current;
}

function find(action: string) {
  return current.find((mcp) => mcp.action === action);
}

function bind(mcps: MCP[]) {
  current = mcps;
}

function unbind() {
  current = [];
}

export type { MCP };
export default { list, find, bind, unbind };
