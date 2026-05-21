import { Iconify } from "@canmingir/link/platform/components";
import ScoreBar from "./ScoreBar";

import {
  Box,
  Card,
  Chip,
  Divider,
  IconButton,
  Slider,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useState } from "react";

const STATUS_COLOR = {
  COMPLETED: "success.main",
  FAILED: "error.main",
  SUPERVISED: "warning.main",
};

function LogCard({
  log,
  onScoreChange,
  onScoreDelete,
}: {
  log: {
    id: string;
    parameters: object | null;
    output: string | null;
    hallucinationScore: number | null;
    knowledgeScore: number | null;
    superviseScore: number | null;
    resultScore: number | null;
    status: "COMPLETED" | "FAILED" | "SUPERVISED";
    createdAt: string;
  };
  onScoreChange: (logId: string, score: number) => void;
  onScoreDelete: (logId: string) => void;
}) {
  const [hasScore, setHasScore] = useState(log.superviseScore !== null);
  const [localScore, setLocalScore] = useState<number>(
    log.superviseScore ?? 0.5
  );
  const [dirty, setDirty] = useState(false);

  const handleConfirm = () => {
    onScoreChange(log.id, localScore);
    setHasScore(true);
    setDirty(false);
  };

  const handleDelete = () => {
    onScoreDelete(log.id);
    setHasScore(false);
    setLocalScore(0.5);
    setDirty(false);
  };

  return (
    <Card
      variant="outlined"
      sx={{
        p: 1,
        borderRadius: 2,
        borderColor: "divider",
      }}
    >
      <Stack spacing={1.5}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="caption" color="text.disabled">
            {new Date(log.createdAt).toLocaleString()}
          </Typography>
          <Chip
            size="small"
            label={log.status}
            sx={{
              fontWeight: 800,
              fontSize: 11,
              bgcolor: STATUS_COLOR[log.status],
              color: "common.white",
              "& .MuiChip-label": { px: 1 },
            }}
          />
        </Stack>

        {log.parameters && (
          <Box>
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, color: "text.secondary" }}
            >
              Parameters
            </Typography>
            <Box
              component="pre"
              sx={{
                mt: 0.5,
                p: 1,
                bgcolor: "action.hover",
                borderRadius: 1,
                fontSize: 11,
                overflow: "auto",
                maxHeight: 120,
                fontFamily: "monospace",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              {JSON.stringify(log.parameters, null, 2)}
            </Box>
          </Box>
        )}

        {log.output && (
          <Box>
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, color: "text.secondary" }}
            >
              Output
            </Typography>
            <Box
              sx={{
                mt: 0.5,
                p: 1,
                bgcolor: "action.hover",
                borderRadius: 1,
                fontSize: 12,
                overflow: "auto",
                maxHeight: 120,
                fontFamily: "monospace",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              {log.output}
            </Box>
          </Box>
        )}

        <Divider />

        <Stack spacing={0.75}>
          <ScoreBar
            label="Knowledge"
            value={log.knowledgeScore}
            color="primary.main"
          />
          <ScoreBar
            label="Hallucination"
            value={log.hallucinationScore}
            color={
              (log.hallucinationScore ?? 0) > 0.6
                ? "error.main"
                : (log.hallucinationScore ?? 0) > 0.3
                ? "warning.main"
                : "success.main"
            }
          />
          <ScoreBar label="Result" value={log.resultScore} color="info.main" />
          <Divider />
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ minWidth: 0 }}
          >
            <Typography
              variant="caption"
              sx={{
                width: 110,
                flexShrink: 0,
                color: "text.secondary",
              }}
            >
              Supervise
            </Typography>
            <Slider
              size="small"
              min={0}
              max={1}
              step={0.01}
              value={localScore}
              onChange={(_e, val) => {
                const next = Array.isArray(val) ? val[0] : val;
                if (!hasScore) setHasScore(true);
                setLocalScore(next);
                setDirty(next !== (log.superviseScore ?? 0));
              }}
              sx={{
                flex: 1,
                color: !hasScore
                  ? "text.disabled"
                  : localScore > 0.6
                  ? "success.main"
                  : localScore > 0.3
                  ? "warning.main"
                  : "error.main",
                py: 0,
                "& .MuiSlider-rail": { height: 6, borderRadius: 3 },
                "& .MuiSlider-track": { height: 6, borderRadius: 3 },
                "& .MuiSlider-thumb": {
                  width: 12,
                  height: 12,
                  "&:hover": {
                    boxShadow: "none",
                  },
                },
              }}
            />
            <Typography
              variant="caption"
              sx={{
                width: 36,
                textAlign: "right",
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {hasScore ? localScore.toFixed(2) : "—"}
            </Typography>
            <Stack direction="row" spacing={0} sx={{ flexShrink: 0 }}>
              <Tooltip title="Confirm">
                <span>
                  <IconButton
                    size="small"
                    disabled={!dirty}
                    onClick={handleConfirm}
                    sx={{ color: dirty ? "success.main" : undefined }}
                  >
                    <Iconify icon="eva:checkmark-fill" width={14} />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Delete score">
                <span>
                  <IconButton
                    size="small"
                    disabled={!hasScore}
                    onClick={handleDelete}
                    sx={{ color: hasScore ? "error.main" : undefined }}
                  >
                    <Iconify icon="solar:trash-bin-trash-bold" width={14} />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Card>
  );
}

export default LogCard;
