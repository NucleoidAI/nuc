import { BlueprintFlowProps } from "./BlueprintFlow.types";
import { Box } from "@mui/material";
import DiffButton from "./DiffPanel/DiffButton";
import { Flow } from "@canmingir/link/platform/components";
import JSONDiffPanel from "./DiffPanel/JSONDiffPanel";
import SuccessSnackbar from "./Validation/SuccessSnackbar";
import ValidationButtons from "./Validation/ValidationButtons";
import ValidationErrorView from "./Validation/ValidationErrorView";
import { blueprintFlowPlugin } from "./BlueprintFlowPlugin";

import React, { useEffect, useRef } from "react";

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
  onEditNodeClick,
  onSave,
  onShowDiff,
  onCloseDiff,
  onShowValidationErrors,
  onSaveSuccessChange,
}: BlueprintFlowProps) {
  const flowContainerRef = useRef<HTMLDivElement>(null);
  const hasCenteredRef = useRef(false);

  useEffect(() => {
    if (
      !enrichedGraphData?.nodes ||
      Object.keys(enrichedGraphData.nodes).length === 0
    )
      return;
    if (hasCenteredRef.current) return;

    const timer = setTimeout(() => {
      const container = flowContainerRef.current;
      if (!container) return;

      const node = container.querySelector("[data-node-id]") as HTMLElement;
      if (!node) return;

      const cRect = container.getBoundingClientRect();
      const nRect = node.getBoundingClientRect();

      const cx = cRect.left + cRect.width / 2;
      const cy = cRect.top + cRect.height / 2;
      const dx = cx - (nRect.left + nRect.width / 2);
      const dy = cy - (nRect.top + nRect.height / 2);

      if (Math.abs(dx) < 30 && Math.abs(dy) < 30) {
        hasCenteredRef.current = true;
        return;
      }

      let vp: HTMLElement | null = node.parentElement;
      while (vp && vp !== container) {
        if (getComputedStyle(vp).overflow === "hidden") break;
        vp = vp.parentElement;
      }
      if (!vp || vp === container) return;

      const evt = (type: string, opts = {}) =>
        new MouseEvent(type, { bubbles: true, cancelable: true, ...opts });

      vp.dispatchEvent(
        evt("mousedown", { clientX: cx, clientY: cy, button: 0 })
      );
      window.dispatchEvent(
        evt("mousemove", { clientX: cx + dx, clientY: cy + dy })
      );
      window.dispatchEvent(evt("mouseup"));

      hasCenteredRef.current = true;
    }, 300);

    return () => clearTimeout(timer);
  }, [enrichedGraphData]);

  return (
    <Box
      ref={flowContainerRef}
      sx={{
        width: "100%",
        height: "100%",
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
          onEdit: onEditNodeClick,
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
