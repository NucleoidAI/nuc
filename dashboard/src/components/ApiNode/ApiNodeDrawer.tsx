import ApiFieldList from "./ApiFieldList";
import { DrawerLayout } from "@canmingir/link/layouts";
import EndpointCard from "./EndpointCard";
import config from "../../../config";

import {
  API_TIMEOUT_DEFAULT,
  API_TIMEOUT_MAX,
  type ApiField,
  apiFieldErrors,
  curlCommand,
} from "./apiNodes";
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  Stack,
  Switch,
  Tab,
  Tabs,
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
  const [activeTab, setActiveTab] = useState<"node" | "fields" | "settings">(
    "node"
  );

  useEffect(() => {
    if (!open || !node) return;
    const properties = node.raw?.properties ?? {};
    setLabel(properties.label ?? "");
    setFields(properties.fields ?? []);
    setStrict(Boolean(properties.strict));
    setTimeoutDraft(String(properties.timeout ?? API_TIMEOUT_DEFAULT));
    setActiveTab("node");
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
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="Node" value="node" />
          <Tab
            label={`Fields (${fields.length})`}
            value="fields"
            sx={errors.length ? { color: "warning.main" } : undefined}
          />
          {isStart && (
            <Tab
              label="Settings"
              value="settings"
              sx={timeoutInvalid ? { color: "warning.main" } : undefined}
            />
          )}
        </Tabs>

        <Box sx={{ flex: 1, overflowY: "auto", pb: 2 }}>
          <Box sx={{ display: activeTab === "node" ? "block" : "none" }}>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                size="small"
                label="Label"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                fullWidth
              />
              {isStart ? (
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mb: 0.75 }}
                  >
                    Endpoint
                  </Typography>
                  <EndpointCard
                    endpoint={endpoint}
                    curl={curlCommand(endpoint, fields)}
                  />
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Fill each response field from the flow with parameter
                  connections, the same way tool inputs are bound.
                </Typography>
              )}
            </Stack>
          </Box>

          <Box sx={{ display: activeTab === "fields" ? "block" : "none" }}>
            <Stack spacing={2}>
              <ApiFieldList fields={fields} onChange={setFields} />
              {errors.length > 0 && (
                <Alert severity="warning">
                  {errors.map((error) => (
                    <div key={error}>{error}</div>
                  ))}
                </Alert>
              )}
            </Stack>
          </Box>

          {isStart && (
            <Box sx={{ display: activeTab === "settings" ? "block" : "none" }}>
              <Stack spacing={2} sx={{ pt: 1 }}>
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={strict}
                        onChange={(event) => setStrict(event.target.checked)}
                      />
                    }
                    label="Reject unknown fields"
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block" }}
                  >
                    {strict
                      ? "Requests with fields that are not in the schema fail with 400."
                      : "Fields that are not in the schema are dropped before the task starts."}
                  </Typography>
                </Box>
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
              </Stack>
            </Box>
          )}
        </Box>

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
