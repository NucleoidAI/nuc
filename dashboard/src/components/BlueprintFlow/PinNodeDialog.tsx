import HistoryIcon from "@mui/icons-material/History";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

const FALLBACK_MOCK_OUTPUT = `{
  "result": ""
}`;

const MONO_FONT =
  '"JetBrains Mono", "SFMono-Regular", Menlo, Consolas, monospace';

export type PinOutputMode = "DEFAULT" | "STORED" | "MOCK";

export type PinNodeProperties = {
  pinned: true;
  pinOutputMode: PinOutputMode;
  pinMockOutput?: string;
};

function blankMockOutput(outputFields?: string[]) {
  if (!outputFields?.length) return FALLBACK_MOCK_OUTPUT;

  const skeleton = Object.fromEntries(outputFields.map((field) => [field, ""]));
  return JSON.stringify(skeleton, null, 2);
}

function formatCapturedAt(createdAt: string) {
  try {
    return new Date(createdAt).toLocaleString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return createdAt;
  }
}

export default function PinNodeDialog({
  open,
  node,
  outputFields,
  lastOutput,
  loadingStoredOutput,
  onClose,
  onSave,
  onUnpin,
  onModeChange,
}: {
  open: boolean;
  node?: {
    id: string;
    label: string;
    raw?: { properties?: Record<string, unknown> };
  };
  outputFields?: string[];
  lastOutput?: { result: string | null; createdAt: string } | null;
  loadingStoredOutput?: boolean;
  onClose: () => void;
  onSave: (properties: PinNodeProperties) => void;
  onUnpin: () => void;
  onModeChange?: (mode: PinOutputMode) => void;
}) {
  const [mode, setMode] = useState<PinOutputMode>("DEFAULT");
  const [mockDraft, setMockDraft] = useState("");

  const updateMode = (next: PinOutputMode) => {
    setMode(next);
    onModeChange?.(next);
  };

  useEffect(() => {
    if (!open || !node) return;
    const properties = node.raw?.properties ?? {};
    const savedMode = properties.pinOutputMode;
    updateMode(
      savedMode === "MOCK" || savedMode === "STORED" ? savedMode : "DEFAULT"
    );
    setMockDraft(
      typeof properties.pinMockOutput === "string" && properties.pinMockOutput
        ? properties.pinMockOutput
        : blankMockOutput(outputFields)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, node]);

  const isMock = mode === "MOCK";
  const isStored = mode === "STORED";
  let jsonError: string | undefined;
  if (isMock) {
    try {
      JSON.parse(mockDraft);
    } catch {
      jsonError = "Invalid JSON";
    }
  }

  const isPinned = Boolean(node?.raw?.properties?.pinned);

  const handleSave = () => {
    onSave({
      pinned: true,
      pinOutputMode: mode,
      ...(isMock ? { pinMockOutput: mockDraft } : {}),
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      type="small"
      sx={{ zIndex: (theme) => theme.zIndex.modal + 3 }}
      slotProps={{
        paper: { sx: { borderRadius: 2 } },
      }}
    >
      <DialogTitle>Pin node: {node?.label}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          {isMock ? (
            <>
              Test runs skip this step and return your mock JSON. Production
              execution is not affected.
            </>
          ) : isStored ? (
            <>
              Test runs skip this step and return its last stored output.
              Production execution is not affected.
            </>
          ) : (
            <>
              Test runs execute this node normally, using its real output.
              Production execution is not affected.
            </>
          )}
        </DialogContentText>

        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Output source
        </Typography>
        <FormControl>
          <RadioGroup
            row
            value={mode}
            onChange={(e) => updateMode(e.target.value as PinOutputMode)}
          >
            <FormControlLabel
              value="DEFAULT"
              control={<Radio />}
              label="Default"
            />
            <FormControlLabel
              value="STORED"
              control={<Radio />}
              label="Stored output"
            />
            <FormControlLabel
              value="MOCK"
              control={<Radio />}
              label="Mock output"
            />
          </RadioGroup>
        </FormControl>

        {isStored && !loadingStoredOutput && (
          <Box sx={{ mt: 1.5 }}>
            {lastOutput?.result ? (
              <>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    mb: 1,
                  }}
                >
                  <Typography variant="subtitle2">
                    Stored output (last execution)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Captured {formatCapturedAt(lastOutput.createdAt)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: "action.hover",
                    fontFamily: MONO_FONT,
                    fontSize: 13,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    maxHeight: 320,
                    overflow: "auto",
                  }}
                >
                  {lastOutput.result}
                </Box>
              </>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: 1,
                  py: 4,
                  px: 2,
                  border: "1px dashed",
                  borderColor: "divider",
                  borderRadius: 1,
                }}
              >
                <HistoryIcon color="disabled" />
                <Typography variant="subtitle2">
                  No stored output yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This step hasn&apos;t run yet. Run a test once to capture its
                  output, or use Mock output instead.
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {isMock && (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Mock output (JSON)
            </Typography>
            <TextField
              autoFocus
              fullWidth
              multiline
              minRows={6}
              maxRows={16}
              value={mockDraft}
              onChange={(e) => setMockDraft(e.target.value)}
              error={Boolean(jsonError)}
              helperText={jsonError}
              inputProps={{
                "aria-label": "Mock output JSON",
                style: {
                  fontFamily: MONO_FONT,
                  fontSize: 13,
                },
              }}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: "space-between", px: 3, pb: 2 }}>
        {isPinned ? (
          <Button color="error" onClick={onUnpin}>
            Unpin
          </Button>
        ) : (
          <Box />
        )}
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="contained"
            disabled={isMock && Boolean(jsonError)}
            onClick={handleSave}
          >
            Save
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
