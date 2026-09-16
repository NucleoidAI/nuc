import MarkdownRenderer from "../MarkdownRenderer/MarkdownRenderer";
import { getInputError } from "../NodeEditor/NodeInputValues";
import { isRefValue } from "./helper";
import { useState } from "react";
import {
  Box,
  Button,
  ButtonBase,
  Popover,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

type InputSchema = { type: string; description?: string; nullable?: boolean };

export default function NodeInputOverride({
  field,
  schema,
  parameters,
  onChange,
}: {
  field: string;
  schema: InputSchema;
  parameters: Record<string, unknown>;
  onChange: (value: unknown) => void;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [draft, setDraft] = useState("");
  const [dirty, setDirty] = useState(false);
  const [editingText, setEditingText] = useState(false);
  const isNumber = schema.type === "number" || schema.type === "integer";
  const isBoolean = schema.type === "boolean";
  const isJson = schema.type === "object" || schema.type === "array";
  let parsed: unknown = draft;
  if (isNumber && draft.trim()) parsed = Number(draft);
  else if (isBoolean || isJson) {
    try {
      parsed = JSON.parse(draft);
    } catch {
      /* Keep invalid drafts editable. */
    }
  }
  const error = getInputError({
    parameters: { [field]: parsed },
    field,
    schema,
  });
  const updateDraft = (value: string) => {
    setDraft(value);
    setDirty(true);
  };
  const hasValue = Object.prototype.hasOwnProperty.call(parameters, field);
  const status = !hasValue
    ? "Automatic"
    : isRefValue(parameters[field])
    ? "Connected"
    : "Fixed";

  return (
    <>
      <ButtonBase
        aria-label={`Override ${field}`}
        aria-haspopup="dialog"
        aria-expanded={Boolean(anchor)}
        title={`${field} · ${status} — click to override`}
        onClick={(event) => {
          event.stopPropagation();
          const value = parameters[field];
          setDraft(
            !hasValue || isRefValue(value)
              ? ""
              : typeof value === "string"
              ? value
              : JSON.stringify(value, null, 2)
          );
          setDirty(false);
          setEditingText(!hasValue || isRefValue(value) || value === "");
          setAnchor(event.currentTarget);
        }}
        sx={{
          width: "100%",
          minWidth: 0,
          justifyContent: "space-between",
          gap: 0.5,
          textAlign: "left",
          borderRadius: 0.5,
        }}
      >
        <Box
          component="span"
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {field}
        </Box>
        <Typography
          component="span"
          sx={{
            fontSize: 9,
            color: hasValue ? "primary.main" : "text.disabled",
            flexShrink: 0,
          }}
        >
          {status}
        </Typography>
      </ButtonBase>
      <Popover
        sx={{ zIndex: (theme) => theme.zIndex.modal + 3 }}
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
        slotProps={{
          paper: {
            sx: {
              p: 2,
              width: isNumber || isBoolean ? 280 : 420,
              maxWidth: "calc(100vw - 32px)",
              maxHeight: "70vh",
              overflowY: "auto",
            },
          },
        }}
      >
        <Box role="dialog" aria-label={`Override ${field}`}>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            {field}
          </Typography>
          {isBoolean ? (
            <ToggleButtonGroup
              exclusive
              fullWidth
              size="small"
              value={draft}
              aria-label={`${field} value`}
              onChange={(_, value) => {
                if (value !== null) updateDraft(value);
              }}
            >
              <ToggleButton value="true">true</ToggleButton>
              <ToggleButton value="false">false</ToggleButton>
            </ToggleButtonGroup>
          ) : isNumber || isJson || editingText ? (
            <TextField
              autoFocus
              fullWidth
              size="small"
              type={isNumber ? "number" : "text"}
              multiline={!isNumber}
              minRows={isNumber ? undefined : 4}
              maxRows={isNumber ? undefined : 16}
              value={draft}
              inputProps={{
                "aria-label": `${field} value`,
                ...(isNumber
                  ? { step: schema.type === "integer" ? 1 : "any" }
                  : {}),
              }}
              placeholder={
                isJson ? (schema.type === "array" ? "[]" : "{}") : undefined
              }
              error={dirty && Boolean(error)}
              helperText={dirty ? error : undefined}
              onChange={(event) => updateDraft(event.target.value)}
              onBlur={() => {
                if (!isNumber && !isJson) setEditingText(false);
              }}
            />
          ) : (
            <Box
              role="button"
              tabIndex={0}
              aria-label={`Edit ${field} value`}
              onClick={(event) => {
                event.preventDefault();
                setEditingText(true);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setEditingText(true);
                }
              }}
              sx={{
                cursor: "text",
                minHeight: 80,
                maxHeight: "45vh",
                overflow: "auto",
                p: 1,
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
                "&:focus-visible": {
                  outline: "2px solid",
                  outlineColor: "primary.main",
                },
              }}
            >
              <MarkdownRenderer sx={{ overflowWrap: "anywhere" }}>
                {draft || "Click to enter text"}
              </MarkdownRenderer>
            </Box>
          )}
          <Stack
            direction="row"
            spacing={1}
            justifyContent="space-between"
            sx={{ mt: 1.5 }}
          >
            <Button
              size="small"
              disabled={!hasValue}
              onClick={() => {
                onChange(undefined);
                setAnchor(null);
              }}
            >
              Reset
            </Button>
            <Button
              size="small"
              variant="contained"
              disabled={!dirty || Boolean(error)}
              onClick={() => {
                onChange(parsed);
                setAnchor(null);
              }}
            >
              Apply
            </Button>
          </Stack>
        </Box>
      </Popover>
    </>
  );
}
