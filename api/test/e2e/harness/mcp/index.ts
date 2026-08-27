import { mockFor, recordCall } from "./registry";
import { toolNotFound } from "./protocol";
import type { ToolArgs, ToolClient } from "./protocol";

async function connectReal(name: string, tool: string): Promise<ToolClient> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mcp = require("../../../../src/lib/mcp").default;

  return mcp.connect({ name, tool });
}

async function connect({
  name,
  tool,
}: {
  name: string;
  tool: string;
}): Promise<ToolClient> {
  const mock = mockFor(name);

  if (!mock) return connectReal(name, tool);

  let real: ToolClient | null = null;

  return {
    async callTool(action: string, params: ToolArgs) {
      const args = params ?? {};

      recordCall(name, action, args);

      const handler = mock.tools[action];

      if (handler) return handler(args);

      if (mock.mode === "isolated") return toolNotFound();

      if (!real) real = await connectReal(name, tool);

      return real.callTool(action, args);
    },
    async close() {
      await real?.close();
    },
  };
}

export default { connect };
