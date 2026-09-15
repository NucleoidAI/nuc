import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";

class McpClient {
  private name: string;
  private version: string;
  private mcp!: Client;
  private transport!: StdioClientTransport;
  private isConnected = false;

  constructor({ name, version }: { name: string; version: string }) {
    this.name = name;
    this.version = version;
  }

  async connectToServer({ env = {} }: { env?: Record<string, string> } = {}) {
    try {
      if (!/^[a-zA-Z0-9_-]+$/.test(this.name)) {
        throw new Error(`Invalid MCP server name: ${this.name}`);
      }

      const serversRoot = path.resolve(
        path.dirname(process.cwd()),
        "mcp",
        "servers",
      );
      const serverPath = path.resolve(serversRoot, this.name, "index.ts");

      if (!serverPath.startsWith(serversRoot + path.sep)) {
        throw new Error(`Invalid MCP server path: ${this.name}`);
      }

      this.transport = new StdioClientTransport({
        command: "bun",
        args: [serverPath],
        env: { ...(process.env as Record<string, string>), ...env },
      });

      this.mcp = new Client({ name: this.name, version: this.version });
      await this.mcp.connect(this.transport);
      this.isConnected = true;

      const toolsResult = await this.mcp.listTools();
      const tools = toolsResult.tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.inputSchema,
      }));
      console.log(
        "Connected to server with tools:",
        tools.map(({ name }) => name),
      );
    } catch (e) {
      this.isConnected = false;
      console.log("Failed to connect to MCP server: ", e);
      throw e;
    }
  }

  private ensureConnected() {
    if (!this.isConnected || !this.mcp) {
      throw new Error("Not connected to MCP server");
    }
  }

  async listResource(params, options = undefined) {
    this.ensureConnected();
    return this.mcp.listResources(params, options);
  }

  async readResource(params, options = undefined) {
    this.ensureConnected();
    return this.mcp.readResource(params, options);
  }

  async callTool(toolName: string, params: any) {
    this.ensureConnected();
    return this.mcp.callTool(
      {
        name: toolName,
        arguments: params,
      },
      CallToolResultSchema,
      { timeout: 10 * 60_000 },
    );
  }

  async listTools(params = undefined, options = undefined) {
    this.ensureConnected();
    return this.mcp.listTools(params, options);
  }

  async close() {
    if (this.mcp) {
      await this.mcp.close();
      this.isConnected = false;
    }
  }
}

export default McpClient;
