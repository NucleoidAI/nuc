import MCPs from "../mcps/mcps";
import { NotFoundError } from "@canmingir/link-express/error";

function list() {
  if (!MCPs || MCPs.length === 0) {
    throw new NotFoundError();
  }

  const mcps = MCPs.map((provider) => ({
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
