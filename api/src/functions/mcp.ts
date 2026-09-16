import MCPs from "../mcps/mcps";
import { NotFoundError } from "@canmingir/link-express/error";
import mcpServer from "./mcpServer";

type Scope = {
  teamId?: string | null;
  agentId?: string | null;
};

function serverIdOf(action: string) {
  return action.split(":")[0].toLowerCase();
}

async function list(scope: Scope = {}) {
  if (!MCPs || MCPs.length === 0) {
    throw new NotFoundError();
  }

  const { teamId, agentId } = scope;

  let catalog = MCPs;

  if (teamId || agentId) {
    const assigned = await mcpServer.listAssignedServerIds({
      teamId,
      agentId,
    });

    catalog = MCPs.filter((provider) =>
      assigned.has(serverIdOf(provider.action))
    );
  }

  const mcps = catalog.map((provider) => ({
    id: provider.id,
    provider: provider.provider,
    label: provider.label,
    description: provider.description,
    action: provider.action,
    icon: provider.icon,
    direction: provider.direction,
    lib: provider.lib,
    inputSchema: provider.inputSchema,
    outputSchema: provider.outputSchema,
    oauth: provider.oauth
      ? {
          scope: provider.oauth.scope,
          tokenUrl: provider.oauth.tokenUrl,
          clientId: provider.oauth.clientId,
          redirectUri: provider.oauth.redirectUri,
          authUrl: provider.oauth.authUrl,
          clientScript: provider.oauth.clientScript,
        }
      : null,
  }));

  return {
    role: "system",
    content: { mcps },
  } as {
    role: "user" | "system" | "assistant";
    content: object;
  };
}

export default { list };
