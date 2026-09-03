import McpClient from "../../../mcp/McpClient";
import mcpServer from "../functions/mcpServer";
import platform from "@canmingir/link-express";

async function connect({
  name,
  tool,
  teamId,
  agentId,
}: {
  name: string;
  tool: string;
  teamId?: string | null;
  agentId?: string | null;
}) {
  const mcpClient = new McpClient({
    name,
    tool,
    version: "1.0.0",
  });

  let env: Record<string, string> = {};

  try {
    env = await mcpServer.resolveEnv({ serverId: name, teamId, agentId });
  } catch (error) {
    platform.logger.warn(
      `Failed to resolve env for MCP server "${name}": ${error}`
    );
  }

  try {
    await mcpClient.connectToServer({ env });

    return mcpClient;
  } catch (error) {
    platform.logger.error(error);
    throw error;
  }
}

export default { connect };
