import grey from "./servers/grey";
import order from "./servers/order";
import type { McpMock, ToolArgs } from "./protocol";

const mocks: McpMock[] = [order, grey];

const mcpCalls: Array<{
  provider: string;
  action: string;
  args: ToolArgs;
}> = [];

function mockFor(provider: string) {
  return mocks.find((mock) => mock.provider === provider);
}

function recordCall(provider: string, action: string, args: ToolArgs) {
  mcpCalls.push({ provider, action, args });
}

function callsFor(action: string) {
  return mcpCalls.filter((call) => call.action === action);
}

function resetMcpMocks() {
  mcpCalls.length = 0;

  for (const mock of mocks) mock.reset?.();
}

export { mocks, mcpCalls, mockFor, recordCall, callsFor, resetMcpMocks };
