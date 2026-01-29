import McpClient from "../../../mcp/McpClient";
import platform from "@canmingir/link-express";

async function connect({ name, tool }: { name: string; tool: string }) {
  const mcpClient = new McpClient({
    name,
    tool,
    version: "1.0.0",
  });

  try {
    await mcpClient.connectToServer({
      credentials: {
        clientId: process.env.GDRIVE_CLIENT_ID as string,
        clientSecret: process.env.GDRIVE_CLIENT_SECRET as string,
        redirectUris: [process.env.GDRIVE_REDIRECT_URI as string],
        refreshToken: process.env.GDRIVE_REFRESH_TOKEN as string,
      },
    });

    return mcpClient;
  } catch (error) {
    platform.logger.error(error);
    throw error;
  }
}

export default { connect };
