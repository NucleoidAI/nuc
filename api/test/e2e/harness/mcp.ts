type ToolArgs = Record<string, unknown>;

type Reply = (args: ToolArgs) => unknown;

type Expectation = {
  args?: ToolArgs;
  reply?: Reply;
  error: boolean;
};

type ToolStub = {
  script: Expectation[];
  reply?: Reply;
  error: boolean;
  forbidden: boolean;
  calls: ToolArgs[];
};

const stubs = new Map<string, ToolStub>();

function stubFor(action: string) {
  let stub = stubs.get(action);

  if (!stub) {
    stub = { script: [], error: false, forbidden: false, calls: [] };
    stubs.set(action, stub);
  }

  return stub;
}

function asReply(value: unknown): Reply {
  return typeof value === "function" ? (value as Reply) : () => value;
}

function tool(action: string) {
  const stub = stubFor(action);

  let open: Expectation | undefined;

  const handle = {
    action,
    get calls() {
      return stub.calls;
    },
    get lastCall() {
      return stub.calls[stub.calls.length - 1];
    },
    expects(args: ToolArgs) {
      open = { args, error: false };
      stub.script.push(open);
      return handle;
    },
    expectsNoCalls() {
      stub.forbidden = true;
      return handle;
    },
    returns(value: unknown) {
      if (open) {
        open.reply = asReply(value);
        open = undefined;
      } else {
        stub.reply = asReply(value);
        stub.error = false;
      }

      return handle;
    },
    returnsOnce(value: unknown) {
      stub.script.push({ reply: asReply(value), error: false });
      return handle;
    },
    fails(value: unknown) {
      if (open) {
        open.reply = asReply(value);
        open.error = true;
        open = undefined;
      } else {
        stub.reply = asReply(value);
        stub.error = true;
      }

      return handle;
    },
  };

  return handle;
}

function verify() {
  for (const [action, stub] of stubs) {
    const { calls, script } = stub;

    if (stub.forbidden) {
      expect({ [action]: calls }).toEqual({ [action]: [] });
    }

    const expected = script.filter(({ args }) => args);

    if (!expected.length) continue;

    if (!stub.reply) {
      expect({ [`${action} calls`]: calls.length, calls }).toMatchObject({
        [`${action} calls`]: script.length,
      });
    }

    for (const [index, { args }] of script.entries()) {
      if (!args) continue;

      expect({ [`${action} #${index + 1}`]: calls[index] }).toMatchObject({
        [`${action} #${index + 1}`]: args,
      });
    }
  }
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

function init() {
  jest.mock(require.resolve("../../../src/lib/mcp"), () => mcpModule);

  beforeEach(reset);
  afterEach(verify);
}

const mcp = { init, tool, verify, reset };

export { mcp, mcpModule };
export type { Reply, ToolArgs };
