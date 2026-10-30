import React from "react";
import TaskFlowNode from "./TaskFlowNode";

import {
  getActionIcon,
  getStepInputs,
  getStepOutputs,
  splitAction,
} from "./util";

export const taskChartPlugin = {
  id: "taskChart",

  style: (args) => {
    const { style } = args;
    const styleTokens = style || {};

    const isHorizontal = styleTokens.direction === "horizontal";
    const connectionsGap = styleTokens.showConnections ? 20 : 0;

    return {
      ...styleTokens,
      gap: (styleTokens.gap ?? 6) + (isHorizontal ? connectionsGap : 0),
      levelGap:
        (styleTokens.levelGap ?? 15) + (isHorizontal ? 0 : connectionsGap),
      startGap: 3,
      endGap: -5,
    };
  },

  node: (args) => {
    const { node, nodeStyle } = args;
    const {
      showConnections,
      onNodeClick,
      boundInputsByNode,
      hiddenFieldsByNode,
      onFieldHover,
    } = nodeStyle || {};

    const raw = node.action || node.title || node.label || node.id || "Task";
    const { label } = splitAction(raw);

    const inputs = getStepInputs(node.parameters);
    const outputs = getStepOutputs(node.result);

    return (
      <TaskFlowNode
        nodeId={node.id}
        action={label}
        rawAction={node.action}
        description={node.comment}
        status={node.status || node.state}
        icon={getActionIcon(node.action)}
        inputs={inputs}
        outputs={outputs}
        boundInputs={boundInputsByNode?.[node.id]}
        hiddenFields={hiddenFieldsByNode?.[node.id]}
        showConnections={showConnections}
        onFieldHover={onFieldHover}
        onClick={
          onNodeClick
            ? () =>
                onNodeClick({
                  label,
                  action: node.action,
                  status: node.status || node.state,
                  comment: node.comment,
                  createdAt: node.createdAt,
                  inputs,
                  outputs,
                  parameters: node.parameters,
                  result: node.result,
                })
            : undefined
        }
      />
    );
  },
};
