import CloseIcon from "@mui/icons-material/Close";
import CodeBlock from "../CodeBlock/CodeBlock";
import InfoCard from "../InfoCard/InfoCard";
import { ResultTable } from "../ResultTable/ResultTable";
import { parseJsonResult } from "../../utils/formatters";

import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import React, { useCallback, useState } from "react";
import { StepField, getStatusConfig } from "./helper";

const paneSx = {
  position: "relative",
  flex: 1,
  minWidth: 0,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  "& .MuiFormControl-root": {
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
  },
  "& .MuiFormLabel-root": {
    flexShrink: 0,
  },
};

const scrollBoxSx = {
  flex: 1,
  minHeight: 0,
  overflow: "auto",
  "& code": {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
};

const MetaRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <Stack direction="row" spacing={1}>
    <Typography
      variant="body2"
      sx={{ width: 84, flexShrink: 0, color: "text.disabled" }}
    >
      {label}
    </Typography>
    {typeof value === "string" ? (
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 0 }}>
        {value}
      </Typography>
    ) : (
      value
    )}
  </Stack>
);

const TaskFlowStepDialog = ({
  open,
  onClose,
  step,
}: {
  open: boolean;
  onClose: () => void;
  step: {
    label: string;
    action?: string;
    status?: string;
    comment?: string;
    createdAt?: string;
    inputs: StepField[];
    outputs: StepField[];
    parameters?: unknown;
    result?: unknown;
  } | null;
}) => {
  const [paramViewMode, setParamViewMode] = useState("table");
  const [viewMode, setViewMode] = useState("table");

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === "table" ? "text" : "table"));
  }, []);
  const toggleParamViewMode = useCallback(() => {
    setParamViewMode((prev) => (prev === "table" ? "text" : "table"));
  }, []);

  if (!step) return null;

  const { label: statusLabel, color } = getStatusConfig(step.status);

  const { isJson, parsedResult } = parseJsonResult(step.result);

  const renderResult = () => {
    if (!isJson)
      return (
        <Typography variant="body1">{String(parsedResult ?? "")}</Typography>
      );

    return viewMode === "table" ? (
      <ResultTable data={parsedResult} />
    ) : (
      <CodeBlock>{JSON.stringify(parsedResult, null, 2)}</CodeBlock>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      sx={{ zIndex: (theme) => theme.zIndex.modal + 3 }}
      slotProps={{
        paper: {
          sx: {
            height: "50vh",
            borderRadius: 2,
            backgroundImage: "none",
            bgcolor: "background.default",
          },
        },
      }}
    >
      <DialogTitle
        sx={{ px: 3, py: 2, borderBottom: "1px solid", borderColor: "divider" }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
              {step.label}
            </Typography>

            {step.action && (
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  color: "text.disabled",
                  fontFamily: "monospace",
                }}
              >
                {step.action}
              </Typography>
            )}

            <Stack spacing={0.25} sx={{ mt: 1 }}>
              <MetaRow label="Comment" value={step.comment || "-"} />
              <MetaRow
                label="Status"
                value={
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: `${color}.main`,
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ color: `${color}.main`, fontWeight: 600 }}
                    >
                      {statusLabel}
                    </Typography>
                  </Stack>
                }
              />
              <MetaRow
                label="Created At"
                value={
                  step.createdAt
                    ? new Date(step.createdAt).toLocaleString()
                    : "-"
                }
              />
            </Stack>
          </Box>

          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent
        sx={{
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1,
          overflow: "hidden",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={3}
          divider={<Divider orientation="vertical" flexItem />}
          sx={{ flex: 1, mt: 1 }}
        >
          <InfoCard
            label="Input"
            sx={paneSx}
            value={
              step.parameters && typeof step.parameters === "object" ? (
                <>
                  <Switch
                    checked={paramViewMode === "table"}
                    onChange={toggleParamViewMode}
                    sx={{
                      position: "absolute",
                      top: -5,
                      right: -12,
                      transform: "scale(0.8)",
                    }}
                  />
                  <Typography
                    variant="body2"
                    color={
                      paramViewMode === "table"
                        ? "text.disabled"
                        : "text.primary"
                    }
                    sx={{
                      position: "absolute",
                      top: 3,
                      right: 33,
                      transform: "scale(0.8)",
                    }}
                  >
                    JSON
                  </Typography>
                  <Box sx={scrollBoxSx}>
                    {paramViewMode === "table" ? (
                      <ResultTable data={{ ...step.parameters }} />
                    ) : (
                      <CodeBlock>
                        {JSON.stringify(step.parameters, null, 2)}
                      </CodeBlock>
                    )}
                  </Box>
                </>
              ) : (
                "-"
              )
            }
          />
          <InfoCard
            label="Output"
            sx={paneSx}
            value={
              <>
                {isJson && (
                  <>
                    <Switch
                      checked={viewMode === "table"}
                      onChange={toggleViewMode}
                      sx={{
                        position: "absolute",
                        top: -5,
                        right: -12,
                        transform: "scale(0.8)",
                      }}
                    />
                    <Typography
                      variant="body2"
                      color={
                        viewMode === "table" ? "text.disabled" : "text.primary"
                      }
                      sx={{
                        position: "absolute",
                        top: 3,
                        right: 33,
                        transform: "scale(0.8)",
                      }}
                    >
                      JSON
                    </Typography>
                  </>
                )}
                <Box sx={scrollBoxSx}>{renderResult()}</Box>
              </>
            }
          />
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default TaskFlowStepDialog;
