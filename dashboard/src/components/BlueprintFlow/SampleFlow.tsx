import { Flow } from "@canmingir/link/platform/components";
import React from "react";
import { blueprintFlowPlugin } from "./BlueprintFlowPlugin";
import { buildDefinitionGraph } from "./helper";

import { Box, Typography } from "@mui/material";

const SAMPLE_FLOW = {
  nodes: [
    {
      id: "example-start",
      type: "NORMAL",
      properties: {
        label: "Start Process",
        icon: "mdi:play-circle-outline",
        action: "PLATFORM:start",
        description: "Beginning of the workflow",
      },
      next: ["example-condition"],
    },
    {
      id: "example-condition",
      type: "CONDITION",
      properties: {
        label: "Check Condition",
        icon: "mdi:help-circle-outline",
        action: "PLATFORM:decision",
        description: "Evaluate if condition is met",
      },
      true: ["example-true-action"],
      false: ["example-false-action"],
    },
    {
      id: "example-true-action",
      type: "NORMAL",
      properties: {
        label: "Action if True",
        icon: "mdi:check-circle-outline",
        action: "PLATFORM:action",
        description: "Execute when condition is true",
      },
      next: ["example-end"],
    },
    {
      id: "example-false-action",
      type: "NORMAL",
      properties: {
        label: "Action if False",
        icon: "mdi:close-circle-outline",
        action: "PLATFORM:action",
        description: "Execute when condition is false",
      },
      next: ["example-end"],
    },
    {
      id: "example-end",
      type: "NORMAL",
      properties: {
        label: "End Process",
        icon: "mdi:stop-circle-outline",
        action: "PLATFORM:end",
        description: "Workflow completion",
      },
    },
  ],
};

const SampleFlow = () => {
  const exampleGraphData = buildDefinitionGraph(SAMPLE_FLOW);

  return (
    <Box sx={{ height: "100%", width: "100%", position: "relative" }}>
      <Box
        sx={{
          position: "absolute",
          top: 16,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          backgroundColor: "background.paper",
          padding: 2,
          borderRadius: 2,
          boxShadow: 3,
          maxWidth: "90%",
        }}
      >
        <Typography variant="body2" color="text.secondary" align="center">
          💡 This is an example flow. Start by typing your scenario in the chat
          box, or use the editor to build your own workflow.
        </Typography>
      </Box>
      <Flow
        plugin={blueprintFlowPlugin}
        data={exampleGraphData}
        style={{
          onAdd: () => {},
          direction: "horizontal",
        }}
        editable={false}
        readOnly={true}
        onChange={() => {}}
      />
    </Box>
  );
};

export default SampleFlow;
