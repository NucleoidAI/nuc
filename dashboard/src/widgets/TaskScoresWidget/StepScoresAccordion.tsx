import { Iconify } from "@canmingir/link/platform/components";
import ScoreCard from "../../components/TaskScores/ScoreCard";
import useLoading from "../../hooks/useLoading";
import useTaskScores from "../../hooks/useTaskScores";

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import React, { useState } from "react";

const STEP_STATUS_COLOR: Record<string, string> = {
  COMPLETED: "success.main",
  FAILED: "error.main",
  IN_PROGRESS: "primary.main",
  SUPERVISED_NEEDED: "warning.main",
  WAITING_FOR_USER: "info.main",
  WAITING_FOR_APPROVAL: "warning.main",
  LOW_CONFIDENCE: "warning.dark",
};

function StepScoresAccordion({
  step,
  readOnly = false,
}: {
  step: {
    id: string;
    action: string;
    comment: string | null;
    status: string;
    createdAt: string;
  };
  readOnly?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const { getScoresByStep, updateSuperviseScore, deleteSuperviseScore } =
    useTaskScores();
  const { scores, loading } = getScoresByStep(expanded ? step.id : "");
  const isLoading = useLoading(loading);

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, isExpanded) => setExpanded(isExpanded)}
      disableGutters
      elevation={0}
      sx={{
        borderBottom: "1px solid",
        borderColor: "divider",
        "&:before": { display: "none" },
        bgcolor: "transparent",
      }}
    >
      <AccordionSummary
        expandIcon={<Iconify icon="eva:chevron-down-fill" width={18} />}
        sx={{
          px: 1,
          py: { xs: 0.75, sm: 0 },
          minHeight: 48,
          "&.Mui-expanded": { minHeight: 48 },
          "& .MuiAccordionSummary-content": { my: 0.75 },
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={{ xs: 0.5, sm: 1.5 }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          sx={{ flex: 1, minWidth: 0, mr: 1 }}
        >
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{ flex: 1, minWidth: 0, width: "100%" }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: STEP_STATUS_COLOR[step.status] ?? "text.disabled",
                flexShrink: 0,
              }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  textOverflow: "ellipsis",
                }}
              >
                {step.comment || step.action}
              </Typography>
              <Typography variant="caption" color="text.disabled">
                {new Date(step.createdAt).toLocaleString()}
              </Typography>
            </Box>
          </Stack>
          <Chip
            size="small"
            label={step.status.replace(/_/g, " ")}
            sx={{
              fontSize: 10,
              fontWeight: 800,
              bgcolor: STEP_STATUS_COLOR[step.status] ?? "text.disabled",
              color: "common.white",
              "& .MuiChip-label": { px: 0.75 },
              flexShrink: 0,
              ml: { xs: "24px !important", sm: 0 },
            }}
          />
        </Stack>
      </AccordionSummary>

      <AccordionDetails sx={{ p: 1, pt: 0 }}>
        {isLoading ? (
          <Stack spacing={1.5}>
            {[...Array(2)].map((_, i) => (
              <Skeleton
                key={i}
                variant="rounded"
                height={100}
                sx={{ borderRadius: 1 }}
              />
            ))}
          </Stack>
        ) : scores.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 2 }}>
            <Iconify
              icon="solar:document-text-line-duotone"
              width={36}
              sx={{ color: "text.disabled", mb: 0.5 }}
            />
            <Typography variant="body2" color="text.disabled">
              No scores for this step
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1}>
            {scores.map((score) => (
              <ScoreCard
                key={score.id}
                score={score}
                onScoreChange={updateSuperviseScore}
                onScoreDelete={deleteSuperviseScore}
                readOnly={readOnly}
              />
            ))}
          </Stack>
        )}
      </AccordionDetails>
    </Accordion>
  );
}

export default StepScoresAccordion;
