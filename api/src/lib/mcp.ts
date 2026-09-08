import McpClient from "../../../mcp/McpClient";
import mcpServer from "../functions/mcpServer";
import platform from "@canmingir/link-express";

async function connect({
  name,
  teamId,
  agentId,
}: {
  name: string;
  teamId?: string | null;
  agentId?: string | null;
}) {
  const mcpClient = new McpClient({
    name,
    version: "1.0.0",
  });

  let env: Record<string, string> = {};

  try {
    env = await mcpServer.resolveEnv({ serverId: name, teamId, agentId });
  } catch (error) {
    platform.logger.error(
      `Failed to resolve env for MCP server "${name}": ${error}`
    );
    throw error;
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
