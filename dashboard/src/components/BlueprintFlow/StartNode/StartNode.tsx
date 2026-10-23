import { Flow } from "@canmingir/link/platform/components";
import React from "react";
import { blueprintFlowPlugin } from "../BlueprintFlowPlugin";

const STARTER_GRAPH = {
  nodes: {
    starter: {
      id: "starter",
      icon: "mdi:play",
      label: "Start",
      action: "PLATFORM:start_node",
      description: "Define the starting point of your Blueprint",
      nodeType: "START" as const,
      connectorType: "default" as const,
      raw: {
        id: "starter",
        type: "START",
      },
    },
  },
  roots: ["starter"],
};

const SampleNode = ({
  handleStarterNodeClick,
}: {
  handleStarterNodeClick: () => void;
}) => {
  return (
    <Flow
      data={STARTER_GRAPH}
      plugin={blueprintFlowPlugin}
      editable
      height="100%"
      fitViewOnMount
      fitViewOnNodesChange
      fitViewOnResize
      fitViewMinZoom={0.8}
      fitViewAlign="start"
      variant="horizontal"
      layout="dag"
      style={() => ({
        direction: "horizontal",
        onAdd: handleStarterNodeClick,
      })}
    />
  );
};

export default SampleNode;
