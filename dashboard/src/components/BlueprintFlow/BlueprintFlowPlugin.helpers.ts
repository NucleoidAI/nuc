import type { ApiField } from "../ApiNode/apiNodes";

export function isApiNode(node?: { nodeType?: string }) {
  return node?.nodeType === "START" || node?.nodeType === "END";
}

export type NodeCategory =
  | "APPROVAL"
  | "DECISION"
  | "SWITCH"
  | "REQUEST_RESPONSE"
  | "COMPLETE"
  | "DEFAULT";

export type NodeTypeStyleConfig = {
  bgFrom?: string;
  bgTo?: string;
  borderColor: string;
  isCompact: boolean;
  useDecisionLayout: boolean;
};

export const NODE_TYPE_STYLE_CONFIG: Record<NodeCategory, NodeTypeStyleConfig> =
  {
    APPROVAL: {
      bgFrom: undefined,
      bgTo: undefined,
      borderColor: "linear-gradient(135deg, #c684ff33, #078dee4d)",
      isCompact: false,
      useDecisionLayout: true,
    },
    DECISION: {
      bgFrom: "#4A4F54",
      bgTo: "#2E3136",
      borderColor: "linear-gradient(135deg, #4A4F54, #2E3136)",
      isCompact: true,
      useDecisionLayout: true,
    },
    SWITCH: {
      bgFrom: "#4A4F54",
      bgTo: "#2E3136",
      borderColor: "linear-gradient(135deg, #4A4F54, #2E3136)",
      isCompact: true,
      useDecisionLayout: true,
    },
    REQUEST_RESPONSE: {
      bgFrom: "#4A4F54",
      bgTo: "#2E3136",
      borderColor: "linear-gradient(135deg, #4A4F54, #2E3136)",
      isCompact: true,
      useDecisionLayout: true,
    },
    COMPLETE: {
      bgFrom: "#4A4F54",
      bgTo: "#2E3136",
      borderColor: "linear-gradient(135deg, #4A4F54, #2E3136)",
      isCompact: true,
      useDecisionLayout: true,
    },
    DEFAULT: {
      bgFrom: undefined,
      bgTo: undefined,
      borderColor: "linear-gradient(135deg, #c684ff33, #078dee4d)",
      isCompact: false,
      useDecisionLayout: false,
    },
  };

export function resolveNodeCategory(node?: {
  nodeType?: string;
  connectorType?: string;
  action?: string;
}): NodeCategory {
  const isApproval = node?.nodeType === "APPROVAL";
  const isSwitch = node?.nodeType === "SWITCH";
  const isApi = isApiNode(node);
  const isDecision = isApproval || node?.connectorType === "decision";
  const isComplete = node?.action === "PLATFORM:complete";
  const isEndpoint =
    node?.nodeType === "START" || node?.nodeType === "END" || isComplete;

  if (isApproval) return "APPROVAL";
  if (isDecision) return "DECISION";
  if (isSwitch) return "SWITCH";
  if (isApi) return "REQUEST_RESPONSE";
  if (isEndpoint) return "COMPLETE";
  return "DEFAULT";
}

export type NodeFields = {
  inputs: string[];
  outputs: string[];
  inputProperties?: Record<
    string,
    { type: string; description?: string; nullable?: boolean }
  >;
  apiFields?: ApiField[];
};

export const FIELDS_PANEL_ROW_HEIGHT = 21;
export const FIELDS_PANEL_ROW_GAP = 2;
export const FIELDS_PANEL_CHROME = 20 + 16 + 2;

export function connectionsPanelPixelHeight(fields?: NodeFields) {
  if (!fields) return 0;
  const rows = Math.max(fields.inputs.length, fields.outputs.length);
  if (rows === 0) return 0;
  return (
    rows * FIELDS_PANEL_ROW_HEIGHT +
    (rows - 1) * FIELDS_PANEL_ROW_GAP +
    FIELDS_PANEL_CHROME
  );
}

export function maxConnectionsPanelPixelHeight(
  nodeFields?: Record<string, NodeFields>
) {
  return Math.max(
    0,
    ...Object.values(nodeFields ?? {}).map(connectionsPanelPixelHeight)
  );
}

export const DECISION_DESCRIPTION_MAX_LENGTH = 60;

export function truncateDescription(description?: string) {
  if (!description) return description;
  if (description.length <= DECISION_DESCRIPTION_MAX_LENGTH) return description;
  return `${description.slice(0, DECISION_DESCRIPTION_MAX_LENGTH).trimEnd()}…`;
}
