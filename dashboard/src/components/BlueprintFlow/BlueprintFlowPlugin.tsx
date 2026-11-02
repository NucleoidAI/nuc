import FlowNodeRenderer from "./FlowNodeRenderer";
import {
  NODE_TYPE_STYLE_CONFIG,
  type NodeFields,
  maxConnectionsPanelPixelHeight,
  resolveNodeCategory,
} from "./BlueprintFlowPlugin.helpers";

export * from "./BlueprintFlowPlugin.helpers";
export * from "./BlueprintFlowPlugin.styles";
export { default as FlowNodeRenderer } from "./FlowNodeRenderer";
export type { FlowGraphNode } from "./FlowNodeRenderer";

const DECISION_ENDPOINT_LAYOUT_VARIANT: "split-icon-panel" | undefined =
  "split-icon-panel";

export const blueprintFlowPlugin = {
  id: "blueprintChart",

  style: (args) => {
    const { node, style } = args;
    const styleTokens = style || {};
    const isComplete = node?.action === "PLATFORM:complete";
    const category = resolveNodeCategory(node);
    const { bgFrom, bgTo, borderColor, isCompact, useDecisionLayout } =
      NODE_TYPE_STYLE_CONFIG[category];
    const layoutVariant = useDecisionLayout
      ? DECISION_ENDPOINT_LAYOUT_VARIANT
      : undefined;

    const borderRadius =
      node?.nodeType === "START"
        ? "40px 0 0 40px"
        : isComplete || node?.nodeType === "END"
        ? "0 40px 40px 0"
        : 16;
    const shadowLevel = 1;
    const minWidth = isCompact ? 315 : 420;
    const maxWidth = isCompact ? 315 : 420;
    const minHeight = 210;
    const maxHeight = 210;
    const shape = 16;
    const endGap = -5;
    const startGap = 3;

    return {
      ...styleTokens,
      bgFrom,
      bgTo,
      borderColor,
      shadowLevel,
      minWidth,
      maxWidth,
      minHeight,
      maxHeight,
      shape,
      borderRadius,
      layoutVariant,
      gap: styleTokens.gap ?? 6,
      levelGap: styleTokens.levelGap ?? 15,
      startGap,
      endGap,
      nodeHeight: maxHeight,
      layoutExtraSpacing: styleTokens.showConnections
        ? maxConnectionsPanelPixelHeight(
            styleTokens.nodeFields as Record<string, NodeFields> | undefined
          )
        : 0,
    };
  },

  edge: (args) => {
    const { node, child } = args;
    if (node?.nodeType === "SWITCH" && child) {
      const label = (node?.cases || []).find(
        (switchCase) => switchCase.nodeId === child.id
      )?.label;

      if (label) {
        return {
          label,
          labelStyle: {
            fontSize: "12px",
            fontWeight: 600,
            color: "#4b4e4c",
            textColor: "#5b3fd9",
          },
          labelPosition: 0.4,
          labelOffsetX: 10,
          labelOffsetY: -14,
        };
      }

      return {};
    }

    if (node?.connectorType === "decision" && child) {
      const trueNext = node?.trueNext || [];
      const falseNext = node?.falseNext || [];
      const isApproval = node?.nodeType === "APPROVAL";

      if (trueNext.includes(child.id)) {
        return {
          label: isApproval ? "approved" : "true",
          labelStyle: {
            fontSize: "12px",
            fontWeight: 600,
            color: "#4b4e4c",
            textColor: "#2e914f",
          },
          labelPosition: 0.4,
          labelOffsetX: 10,
          labelOffsetY: -20,
        };
      }

      if (falseNext.includes(child.id)) {
        return {
          label: isApproval ? "rejected" : "false",
          labelStyle: {
            fontSize: "12px",
            fontWeight: 600,
            color: "#4b4e4c",
            textColor: "#d32f2f",
          },
          labelPosition: 0.4,
          labelOffsetX: 10,
          labelOffsetY: 20,
        };
      }
    }

    return {};
  },

  node: (props) => <FlowNodeRenderer {...props} />,
};
