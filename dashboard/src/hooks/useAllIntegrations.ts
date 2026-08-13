import { isValidIntegration } from "../widgets/NodeEditorWidget/helper";
import useMCPs from "./useMCPs";

export type IntegrationSchema = {
  type?: string;
  properties?: Record<
    string,
    { type: string; description?: string; nullable?: boolean }
  >;
};

export type Integration = {
  id: string;
  action: string;
  provider: string;
  label?: string;
  description: string;
  icon: string;
  direction: string;
  lib: string;
  inputSchema: IntegrationSchema;
  outputSchema?: IntegrationSchema;
};

function useAllIntegrations(): Integration[] {
  const { getMCPs, getActions } = useMCPs();
  const { mcps } = getMCPs();
  const { actions } = getActions();

  const transformedActions: Integration[] = Array.isArray(
    actions?.content?.actions
  )
    ? actions.content.actions
        .filter((action) => action.action !== "PLATFORM:decision")
        .map((action) => ({
          id: action.action,
          action: action.action,
          provider: "PLATFORM",
          label: action.label,
          description:
            action.description || action.action.replace("PLATFORM:", ""),
          icon: action.icon || "",
          direction: "internal",
          lib: action.lib || "",
          inputSchema: action.inputSchema || {
            type: "object",
            properties: {},
          },
          outputSchema: action.outputSchema || {
            type: "object",
            properties: {},
          },
        }))
    : [];

  const integrationsList: Integration[] = Array.isArray(mcps?.content.mcps)
    ? mcps.content.mcps.filter(isValidIntegration)
    : [];

  return [...transformedActions, ...integrationsList];
}

export default useAllIntegrations;
