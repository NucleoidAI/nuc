import { InfoNode } from "@canmingir/link/platform/components";
import React from "react";

export const responsibilityChartPlugin = {
  id: "responsibilityChart",

  resolveStyle: ({ style }) => {
    const styleTokens = style || {};

    const bgFrom = undefined;
    const bgTo = undefined;
    const borderColor = undefined;
    const shadowLevel = 1;
    const minWidth = 200;
    const maxWidth = 200;
    const minHeight = 120;
    const maxHeight = 120;
    const shape = 16;

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
      connectorType: "default",
      gap: styleTokens.gap ?? 6,
      levelGap: styleTokens.levelGap ?? 3,
    };
  },

  renderNode: ({ node, nodeStyle }) => {
    return <InfoNode node={node} nodeStyle={nodeStyle} />;
  },
};
