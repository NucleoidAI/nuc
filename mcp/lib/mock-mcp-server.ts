import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { Tool } from "./mock-api-tool";
export async function startMockServer(name: string, tools: Tool[]) {
  const server = new Server(
    { name, version: "1.0.0-mock" },
    { capabilities: { tools: {} } }
  );
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map(({ name, description, inputSchema }) => ({
      name,
      description,
      inputSchema,
    })),
  }));
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = tools.find((tool) => tool.name === request.params.name);
    if (!tool)
      return {
        content: [{ type: "text", text: "Tool not found." }],
        isError: true,
      };
    return tool.handler(request.params.arguments ?? {});
  });
  await server.connect(new StdioServerTransport());
  return server;
}
