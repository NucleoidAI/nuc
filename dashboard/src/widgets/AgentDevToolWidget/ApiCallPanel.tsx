import { alpha } from "@mui/material/styles";

import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import StepTimeline, { type TimelineStep } from "./StepTimeline";

export type ApiStep = TimelineStep;

export type ApiCall = {
  request: Record<string, unknown>;
  response?: unknown;
  failed?: boolean;
  steps: ApiStep[];
  done: boolean;
  taskName?: string;
};

const MONO = '"JetBrains Mono", "SFMono-Regular", Menlo, Consolas, monospace';

const Label = ({
  children,
  aside,
}: {
  children: React.ReactNode;
  aside?: React.ReactNode;
}) => (
  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.75 }}>
    <Typography
      sx={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.8,
        textTransform: "uppercase",
        color: "text.secondary",
      }}
    >
      {children}
    </Typography>
    {aside}
  </Stack>
);

const Code = ({ text, error }: { text: string; error?: boolean }) => (
  <Box
    component="pre"
    sx={(theme) => ({
      m: 0,
      p: 1.25,
      maxHeight: 260,
      overflow: "auto",
      borderRadius: 1.5,
      fontFamily: MONO,
      fontSize: 11.5,
      lineHeight: 1.65,
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
      color: error ? "error.light" : "text.primary",
      bgcolor: alpha(theme.palette.common.black, 0.28),
      border: `1px solid ${alpha(
        error ? theme.palette.error.main : theme.palette.common.white,
        error ? 0.35 : 0.06
      )}`,
    })}
  >
    {text}
  </Box>
);

const Waiting = () => (
  <Stack
    direction="row"
    alignItems="center"
    spacing={1}
    sx={(theme) => ({
      p: 1.25,
      borderRadius: 1.5,
      color: "text.disabled",
      border: `1px dashed ${alpha(theme.palette.common.white, 0.12)}`,
    })}
  >
    <CircularProgress size={12} color="inherit" />
    <Typography sx={{ fontFamily: MONO, fontSize: 11.5 }}>waiting…</Typography>
  </Stack>
);

const ApiCallPanel = ({
  call,
  onResume,
  resumingStepId,
}: {
  call: ApiCall | null;
  onResume?: (step: ApiStep) => void;
  resumingStepId?: string | null;
}) => {
  if (!call) return null;

  const pending = !call.done;

  return (
    <Stack spacing={2.25}>
      <Box>
        <Label>Request</Label>
        <Code text={JSON.stringify(call.request, null, 2)} />
      </Box>

      <Box>
        <Label
          aside={
            <>
              {call.steps.length > 0 && (
                <Typography
                  sx={{
                    fontFamily: MONO,
                    fontSize: 11,
                    color: "text.disabled",
                  }}
                >
                  {call.steps.length}
                </Typography>
              )}
              {pending && (
                <CircularProgress size={10} sx={{ color: "text.disabled" }} />
              )}
            </>
          }
        >
          Steps
        </Label>
        {call.steps.length ? (
          <StepTimeline
            steps={call.steps}
            onResume={onResume}
            resumingStepId={resumingStepId}
          />
        ) : pending ? (
          <Waiting />
        ) : (
          <Code text="[]" />
        )}
      </Box>

      <Box>
        <Label>Response</Label>
        {call.response === undefined ? (
          <Waiting />
        ) : (
          <Code
            text={JSON.stringify(call.response, null, 2)}
            error={call.failed}
          />
        )}
      </Box>
    </Stack>
  );
};

export default ApiCallPanel;
