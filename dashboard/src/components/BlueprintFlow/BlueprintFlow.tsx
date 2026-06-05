import { BlueprintFlowProps } from "./BlueprintFlow.types";
import DiffButton from "./DiffPanel/DiffButton";
import { Flow } from "@canmingir/link/platform/components";
import { FlowMiniMap } from "./FlowMiniMap";
import JSONDiffPanel from "./DiffPanel/JSONDiffPanel";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import SuccessSnackbar from "./Validation/SuccessSnackbar";
import ValidationButtons from "./Validation/ValidationButtons";
import ValidationErrorView from "./Validation/ValidationErrorView";
import { blueprintFlowPlugin } from "./BlueprintFlowPlugin";
import { Box, Chip, Tooltip } from "@mui/material";

import React, { useRef } from "react";

export default function BlueprintFlow({
  graphData,
  enrichedGraphData,
  drawerOpen,
  readOnly = false,
  hasLocalChanges,
  hasDifferences,
  validationErrors,
  showDiffPanel,
  showValidationErrors,
  saveSuccess,
  baselineNodes,
  onFlowChange,
  onAddNodeClick,
  onEditNodeClick,
  onSwapBranchClick,
  onDeleteNodeClick,
  onSave,
  onShowDiff,
  onCloseDiff,
  onShowValidationErrors,
  onSaveSuccessChange,
  isSubmitting,
  isSuperviseFlow = false,
  blocking = true,
  onBlockingChange,
}: BlueprintFlowProps) {
  const flowContainerRef = useRef<HTMLDivElement>(null);

  return (
    <Box
      ref={flowContainerRef}
      sx={{
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    >
      {!isSuperviseFlow && !readOnly && onBlockingChange && (
        <Box
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 10,
          }}
        >
          <Tooltip
            title={
              blocking
                ? "Blocking: errors escalate to supervisor"
                : "Non-blocking: errors are skipped and flow continues"
            }
            placement="left"
          >
            <Chip
              size="small"
              icon={
                blocking ? (
                  <LockIcon fontSize="small" />
                ) : (
                  <LockOpenIcon fontSize="small" />
                )
              }
              label={blocking ? "Blocking" : "Non-blocking"}
              color={blocking ? "warning" : "success"}
              variant="outlined"
              onClick={() => onBlockingChange(!blocking)}
              sx={{ cursor: "pointer", backdropFilter: "blur(8px)" }}
            />
          </Tooltip>
        </Box>
      )}

      {!readOnly &&
        baselineNodes.length > 0 &&
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
        editable={!readOnly}
        height={isSuperviseFlow ? "50%" : "100%"}
        onChange={readOnly ? undefined : onFlowChange}
        variant="horizontal"
        style={() => ({
          direction: "horizontal",
          onAdd: readOnly ? undefined : onAddNodeClick,
          onEdit: readOnly ? undefined : onEditNodeClick,
          onSwapBranch: readOnly ? undefined : onSwapBranchClick,
          onDelete: readOnly ? undefined : onDeleteNodeClick,
        })}
      />

      {!isSuperviseFlow && (
        <FlowMiniMap
          graphData={graphData}
          flowContainerRef={flowContainerRef}
        />
      )}

      {!readOnly && hasLocalChanges && !drawerOpen && (
        <ValidationButtons
          validationErrors={validationErrors}
          setShowValidationErrors={onShowValidationErrors}
          handleSaveFlow={onSave}
          isSubmitting={isSubmitting}
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
