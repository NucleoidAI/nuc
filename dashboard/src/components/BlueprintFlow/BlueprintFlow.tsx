import { BlueprintFlowProps } from "./BlueprintFlow.types";
import DiffButton from "./DiffPanel/DiffButton";
import { Flow } from "@canmingir/link/platform/components";
import JSONDiffPanel from "./DiffPanel/JSONDiffPanel";
import SuccessSnackbar from "./Validation/SuccessSnackbar";
import ValidationButtons from "./Validation/ValidationButtons";
import ValidationErrorView from "./Validation/ValidationErrorView";
import { blueprintFlowPlugin } from "./BlueprintFlowPlugin";

import { Box, Button, alpha } from "@mui/material";

export default function BlueprintFlow({
  graphData,
  enrichedGraphData,
  drawerOpen,
  hasLocalChanges,
  hasDifferences,
  validationErrors,
  showDiffPanel,
  showValidationErrors,
  saveSuccess,
  baselineNodes,
  onFlowChange,
  onAddNodeClick,
  onSave,
  onShowDiff,
  onCloseDiff,
  onShowValidationErrors,
  onSaveSuccessChange,
}: BlueprintFlowProps) {
  const getFlowDimensions = () => {
    return { width: "100%", height: "100%" };
  };

  const flowDimensions = getFlowDimensions();

  return (
    <Box
      sx={{
        width: flowDimensions.width,
        height: flowDimensions.height,
        position: "relative",
      }}
    >
      {baselineNodes.length > 0 &&
        (hasLocalChanges || hasDifferences) &&
        !drawerOpen && (
          <DiffButton
            onShowDiff={onShowDiff}
            validationErrors={validationErrors}
          />
        )}

      <Flow
        data={enrichedGraphData}
        plugin={blueprintFlowPlugin}
        editable
        onChange={onFlowChange}
        style={() => ({
          direction: "horizontal",
          onAdd: onAddNodeClick,
        })}
      />

      {hasLocalChanges && !drawerOpen && (
        <ValidationButtons
          validationErrors={validationErrors}
          setShowValidationErrors={onShowValidationErrors}
          handleSaveFlow={onSave}
        />
      )}

      {showValidationErrors && (
        <ValidationErrorView
          validationErrors={validationErrors}
          setShowValidationErrors={onShowValidationErrors}
        />
      )}

      <JSONDiffPanel
        savedNodes={baselineNodes}
        aiGeneratedFlow={null}
        currentGraphData={graphData}
        open={showDiffPanel}
        onClose={onCloseDiff}
      />

      <SuccessSnackbar
        saveSuccess={saveSuccess}
        setSaveSuccess={onSaveSuccessChange}
      />
    </Box>
  );
}
