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

function unwrapToolResult(result: unknown): string | undefined {
  if (!result || typeof result !== "object") return undefined;

  const { content } = result as { content?: unknown };
  if (!Array.isArray(content)) return undefined;

  const texts = content
    .filter(
      (block): block is { type: string; text: string } =>
        Boolean(block) &&
        typeof block === "object" &&
        (block as { type?: unknown }).type === "text" &&
        typeof (block as { text?: unknown }).text === "string"
    )
    .map((block) => block.text);

  if (texts.length === 0) return undefined;

  return texts.length === 1 ? texts[0] : JSON.stringify(texts);
}

export { unwrapToolResult };
export default { connect };
