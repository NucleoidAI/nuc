import { ActionNode } from "@canmingir/link/platform/components";
import React from "react";
import { getActionIcon } from "./helper";

export const taskChartPlugin = {
  id: "taskChart",

  style: ({ node, style }) => {
    const statusRaw = node.status || node.state;
    const status =
      typeof statusRaw === "string" ? statusRaw.toUpperCase() : statusRaw;

    const styleTokens = style || {};

    let bg = styleTokens.bg;
    let borderColor = styleTokens.borderColor;
    let shadowLevel =
      typeof styleTokens.shadowLevel === "number"
        ? styleTokens.shadowLevel
        : undefined;

    if (status === "COMPLETED") {
      borderColor = borderColor || "success.light";
      if (!styleTokens.bg) {
        bg = "success.light";
      }
      shadowLevel = shadowLevel ?? 1;
    } else if (status === "IN_PROGRESS" || status === "DOING") {
      borderColor = borderColor || "info.light";
      if (!styleTokens.bg) {
        bg = "info.light";
      }
      shadowLevel = shadowLevel ?? 2;
    } else if (status === "FAILED" || status === "BLOCKED") {
      borderColor = borderColor || "error.light";
      if (!styleTokens.bg) {
        bg = "error.light";
      }
      shadowLevel = shadowLevel ?? 2;
    } else if (status === "WAITING_FOR_USER") {
      borderColor = borderColor || "warning.light";
      if (!styleTokens.bg) {
        bg = "warning.light";
      }
      shadowLevel = shadowLevel ?? 2;
    }

    return {
      ...styleTokens,
      bg,
      borderColor,
      shadowLevel,
    };
  },

  node: ({ node, nodeStyle }) => {
    const { visible = true, delay = 0, isLoading = false } = nodeStyle;

    const action = node.action || node.title || node.label || node.id || "Task";

    const icon = getActionIcon(node.action);

    return (
      <ActionNode
        visible={visible}
        delay={delay}
        isLoading={isLoading}
        action={action}
        status={node.status || node.state}
        tooltip={node.comment}
        icon={icon}
      />
    );
  },
};
