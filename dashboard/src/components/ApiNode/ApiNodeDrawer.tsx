import ApiFieldList from "./ApiFieldList";
import { DrawerLayout } from "@canmingir/link/layouts";
import config from "../../../config";

import {
  API_TIMEOUT_DEFAULT,
  API_TIMEOUT_MAX,
  type ApiField,
  apiFieldErrors,
} from "./apiNodes";
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

type ApiNodeProperties = {
  label?: string;
  fields?: ApiField[];
  strict?: boolean;
  timeout?: number;
};

export default function ApiNodeDrawer({
  open,
  node,
  blueprintId,
  onClose,
  onSave,
}: {
  open: boolean;
  node?: {
    id: string;
    nodeType: string;
    raw?: { properties?: ApiNodeProperties };
  };
  blueprintId?: string;
  onClose: () => void;
  onSave: (properties: ApiNodeProperties) => void;
}) {
  const isStart = node?.nodeType === "START";
  const [label, setLabel] = useState("");
  const [fields, setFields] = useState<ApiField[]>([]);
  const [strict, setStrict] = useState(false);
  const [timeoutDraft, setTimeoutDraft] = useState(String(API_TIMEOUT_DEFAULT));

  useEffect(() => {
    if (!open || !node) return;
    const properties = node.raw?.properties ?? {};
    setLabel(properties.label ?? "");
    setFields(properties.fields ?? []);
    setStrict(Boolean(properties.strict));
    setTimeoutDraft(String(properties.timeout ?? API_TIMEOUT_DEFAULT));
  }, [open, node]);

  const timeoutValue = Number(timeoutDraft);
  const timeoutInvalid =
    !Number.isInteger(timeoutValue) ||
    timeoutValue < 1 ||
    timeoutValue > API_TIMEOUT_MAX;
  const errors = apiFieldErrors(fields);
  const endpoint = `${config.api}/execute/${blueprintId ?? ":blueprintId"}`;

  return (
    <DrawerLayout
      open={open}
      onClose={onClose}
      mode="narrow"
      sx={{ zIndex: (theme) => theme.zIndex.modal + 2 }}
      title={
        <Typography variant="h6">
          {isStart ? "Request Schema" : "Response Schema"}
        </Typography>
      }
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Stack spacing={2} sx={{ flex: 1, overflowY: "auto", pt: 1, pb: 2 }}>
          <TextField
            size="small"
            label="Label"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            fullWidth
          />

          {isStart ? (
            <>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Endpoint
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontFamily: "monospace", wordBreak: "break-all" }}
                >
                  POST {endpoint}
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={strict}
                    onChange={(event) => setStrict(event.target.checked)}
                  />
                }
                label="Reject unknown fields"
              />
              <Typography variant="caption" color="text.secondary">
                {strict
                  ? "Requests with fields that are not in the schema fail with 400."
                  : "Fields that are not in the schema are dropped before the task starts."}
              </Typography>
              <TextField
                size="small"
                type="number"
                label="Timeout (seconds)"
                value={timeoutDraft}
                onChange={(event) => setTimeoutDraft(event.target.value)}
                error={timeoutInvalid}
                helperText={
                  timeoutInvalid
                    ? `Enter a whole number between 1 and ${API_TIMEOUT_MAX}`
                    : "The request returns 504 if the task is still running after this."
                }
                inputProps={{ min: 1, max: API_TIMEOUT_MAX, step: 1 }}
              />
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Fill each response field from the flow with parameter connections,
              the same way tool inputs are bound.
            </Typography>
          )}

          <Typography variant="subtitle2">Fields</Typography>
          <ApiFieldList fields={fields} onChange={setFields} />

          {errors.length > 0 && (
            <Alert severity="warning">
              {errors.map((error) => (
                <div key={error}>{error}</div>
              ))}
            </Alert>
          )}
        </Stack>

        <Box sx={{ pt: 2, borderTop: 1, borderColor: "divider" }}>
          <Button
            size="large"
            variant="contained"
            fullWidth
            disabled={
              !label || errors.length > 0 || (isStart && timeoutInvalid)
            }
            onClick={() =>
              onSave(
                isStart
                  ? { label, fields, strict, timeout: timeoutValue }
                  : { label, fields }
              )
            }
          >
            Save Schema
          </Button>
        </Box>
      </Box>
    </DrawerLayout>
  );
}
