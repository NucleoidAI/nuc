import type { ToolArgs, ToolStub } from "./types";

const stubs = new Map<string, ToolStub>();

function stubFor(action: string) {
  let stub = stubs.get(action);

  if (!stub) {
    stub = { script: [], error: false, forbidden: false, calls: [] };
    stubs.set(action, stub);
  }

  return stub;
}

function reset() {
  stubs.clear();
}

async function callTool(action: string, args: ToolArgs) {
  const stub = stubFor(action);

  const step = stub.script[stub.calls.length];

  stub.calls.push(args);

  const reply = step?.reply ?? stub.reply;
  const error = step?.reply ? step.error : stub.error;

  const payload = reply
    ? await reply(args)
    : {
        error:
          `[e2e] no stub for "${action}" call #${stub.calls.length} ` +
          `(called with ${JSON.stringify(args)}). Declare one with ` +
          `mcp.tool("${action}").returns(...).`,
      };

  return {
    _meta: {},
    content: [{ type: "text", text: JSON.stringify(payload) }],
    isError: reply ? error : true,
  };
}

const mcpModule = {
  __esModule: true,
  default: {
    connect: async () => ({
      callTool: (action: string, args?: ToolArgs) =>
        callTool(action, args ?? {}),
      close: async () => {},
    }),
  },
};

export { callTool, mcpModule, reset, stubFor, stubs };
