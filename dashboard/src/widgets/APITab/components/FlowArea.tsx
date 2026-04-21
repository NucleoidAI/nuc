import BlueprintFlow from "../../../components/BlueprintFlow/BlueprintFlow";
import { DefinitionGraph } from "../../../components/BlueprintFlow/helper";
import { Iconify } from "@canmingir/link/platform/components";
import React from "react";

import { Box, Stack, Typography } from "@mui/material";
import { Endpoint, NodeEditorState } from "../types";

type FlowAreaProps = {
  flowGraphData: DefinitionGraph | null;
  activeResourcePath: string | null;
  nodeEditor: NodeEditorState;
  api: Endpoint[];
  handleFlowChange: (updatedGraph: DefinitionGraph) => void;
  handleAddNodeClick: (node: { id: string }) => void;
  handleEditNodeClick: (node: { id: string }) => void;
};

const FlowArea = ({
  flowGraphData,
  activeResourcePath,
  nodeEditor,
  api,
  handleFlowChange,
  handleAddNodeClick,
  handleEditNodeClick,
}: FlowAreaProps) => {
  return (
    <Box sx={{ flex: 1, minHeight: 400 }}>
      {flowGraphData && activeResourcePath ? (
        <Box sx={{ width: "100%", height: "100%" }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {activeResourcePath}
          </Typography>
          <Box
            key={activeResourcePath}
            sx={{
              height: 450,
            }}
          >
            <BlueprintFlow
              graphData={flowGraphData}
              enrichedGraphData={flowGraphData}
              drawerOpen={nodeEditor.open}
              hasLocalChanges={false}
              hasDifferences={false}
              validationErrors={[]}
              showDiffPanel={false}
              showValidationErrors={false}
              saveSuccess={false}
              baselineNodes={[]}
              onFlowChange={handleFlowChange}
              onAddNodeClick={handleAddNodeClick}
              onEditNodeClick={handleEditNodeClick}
              onSave={() => {}}
              onShowDiff={() => {}}
              onCloseDiff={() => {}}
              onShowValidationErrors={() => {}}
              onSaveSuccessChange={() => {}}
            />
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            color: "text.secondary",
          }}
        >
          <Stack alignItems="center" spacing={2}>
            <Iconify icon="mdi:api" width={64} sx={{ opacity: 0.3 }} />
            <Typography variant="body1" color="text.secondary">
              {api.length === 0
                ? "Add endpoints to visualize the API blueprint"
                : "Select a resource path in the tree to view its flow"}
            </Typography>
          </Stack>
        </Box>
      )}
    </Box>
  );
};

export default FlowArea;
