import { Box, Stack, Typography } from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";

export type TimelineStep = {
  id: string;
  action: string;
  status: string;
  comment: string | null;
  createdAt: string;
};

const MONO = '"JetBrains Mono", "SFMono-Regular", Menlo, Consolas, monospace';

const STEP_COLORS: Record<string, "success" | "error" | "info"> = {
  COMPLETED: "success",
  FAILED: "error",
  IN_PROGRESS: "info",
};

const enter = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: none; }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
`;

const StepRow = ({ step, last }: { step: TimelineStep; last: boolean }) => {
  const color = STEP_COLORS[step.status] ?? "warning";
  const running = step.status === "IN_PROGRESS";

  return (
    <Stack
      direction="row"
      spacing={1.25}
      sx={{ animation: `${enter} 240ms ease-out` }}
    >
      <Stack alignItems="center" sx={{ width: 10, pt: 0.6 }}>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            flexShrink: 0,
            bgcolor: `${color}.main`,
            ...(running && { animation: `${pulse} 1.2s ease-in-out infinite` }),
          }}
        />
        {!last && (
          <Box
            sx={(theme) => ({
              flex: 1,
              width: "1px",
              mt: 0.5,
              bgcolor: alpha(theme.palette.common.white, 0.12),
            })}
          />
        )}
      </Stack>
      <Box sx={{ flex: 1, minWidth: 0, pb: last ? 0 : 1.25 }}>
        <Stack direction="row" alignItems="baseline" spacing={1}>
          <Typography
            noWrap
            sx={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, flex: 1 }}
            title={step.action}
          >
            {step.action}
          </Typography>
          <Typography
            sx={{
              fontFamily: MONO,
              fontSize: 10.5,
              fontWeight: 600,
              color: `${color}.main`,
            }}
          >
            {step.status.replace(/_/g, " ").toLowerCase()}
          </Typography>
        </Stack>
        {step.comment && (
          <Typography
            sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.5 }}
          >
            {step.comment}
          </Typography>
        )}
      </Box>
    </Stack>
  );
};

const StepTimeline = ({ steps }: { steps: TimelineStep[] }) => (
  <Box
    sx={(theme) => ({
      p: 1.25,
      borderRadius: 1.5,
      bgcolor: alpha(theme.palette.common.black, 0.18),
      border: `1px solid ${alpha(theme.palette.common.white, 0.06)}`,
    })}
  >
    {steps.map((step, index) => (
      <StepRow key={step.id} step={step} last={index === steps.length - 1} />
    ))}
  </Box>
);

export default StepTimeline;
