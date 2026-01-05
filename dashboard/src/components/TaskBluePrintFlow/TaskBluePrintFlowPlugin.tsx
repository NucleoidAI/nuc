import React from "react";
import { styled } from "@mui/material/styles";

import { Iconify, InfoNode } from "@canmingir/link/platform/components";

const AddButtonWrapper = styled("div")(({ theme }) => ({
  position: "absolute",
  top: "8px",
  right: "0px",
  transform: "translateX(-50%) scale(1)",
  width: "24px",
  height: "24px",
  borderRadius: "50%",
  backgroundColor: theme.palette?.background.paper,
  color: "#555",
  border: "1px solid rgba(0, 0, 0, 0.1)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
  zIndex: 10,
  "&:hover": {
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
    color: theme.palette?.primary.main,
  },
}));

export const TaskBluePrintFlowPlugin = {
  id: "taskBluePrintChart",

  style: ({ style }) => {
    const styleTokens = style || {};

    const bgFrom = undefined;
    const bgTo = undefined;
    const borderColor = undefined;
    const shadowLevel = 1;
    const minWidth = 300;
    const maxWidth = 300;
    const minHeight = 180;
    const maxHeight = 180;
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
      gap: styleTokens.gap ?? 6,
      levelGap: styleTokens.levelGap ?? 15,
    };
  },

  node: ({ node, nodeStyle }) => {
    const { onAdd } = nodeStyle || {};

    const handleAddClick = (e) => {
      e.stopPropagation();

      if (onAdd) {
        onAdd(node);
      }
    };

    return (
      <InfoNode node={node} nodeStyle={nodeStyle}>
        <AddButtonWrapper onClick={handleAddClick} title="Add child node">
          <Iconify icon="mdi:plus" width={16} height={16} />
        </AddButtonWrapper>
      </InfoNode>
    );
  },
};
