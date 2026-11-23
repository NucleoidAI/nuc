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

export type PinOutputMode = "DEFAULT" | "MOCK";

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

export default function PinNodeDialog({
  open,
  node,
  outputFields,
  onClose,
  onSave,
  onUnpin,
}: {
  open: boolean;
  node?: {
    id: string;
    label: string;
    raw?: { properties?: Record<string, unknown> };
  };
  outputFields?: string[];
  onClose: () => void;
  onSave: (properties: PinNodeProperties) => void;
  onUnpin: () => void;
}) {
  const [mode, setMode] = useState<PinOutputMode>("DEFAULT");
  const [mockDraft, setMockDraft] = useState("");

  useEffect(() => {
    if (!open || !node) return;
    const properties = node.raw?.properties ?? {};
    setMode(properties.pinOutputMode === "MOCK" ? "MOCK" : "DEFAULT");
    setMockDraft(
      typeof properties.pinMockOutput === "string" && properties.pinMockOutput
        ? properties.pinMockOutput
        : blankMockOutput(outputFields)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, node]);

  const isMock = mode === "MOCK";
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
            onChange={(e) => setMode(e.target.value as PinOutputMode)}
          >
            <FormControlLabel
              value="DEFAULT"
              control={<Radio />}
              label="Default"
            />
            <FormControlLabel
              value="MOCK"
              control={<Radio />}
              label="Mock output"
            />
          </RadioGroup>
        </FormControl>

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
                  fontFamily:
                    '"JetBrains Mono", "SFMono-Regular", Menlo, Consolas, monospace',
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
