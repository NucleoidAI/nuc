import { mcpModule, reset, stubFor, stubs } from "./mcp";

import type { Expectation, Reply, ToolArgs } from "./types";

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

function init() {
  jest.mock(require.resolve("../../../../src/lib/mcp"), () => mcpModule);

  beforeEach(reset);
  afterEach(verify);
}

export { init, tool, verify };
