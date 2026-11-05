import { Iconify } from "@canmingir/link/platform/components";
import TaskLogsDrawer from "../TaskLogs";
import { alpha } from "@mui/material/styles";
import dayjs from "dayjs";
import http from "@canmingir/link/platform/http";

import {
  Box,
  Chip,
  CircularProgress,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";

export type Execution = {
  id: string;
  number: number;
  description: string;
  status: "IN_PROGRESS" | "COMPLETED" | "FAILED";
  debug: boolean;
  createdAt: string;
  durationMs: number | null;
};

type Filter = "ALL" | "DEBUG" | "LIVE";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "DEBUG", label: "Debug" },
  { value: "LIVE", label: "Live" },
];

const STATUS = {
  IN_PROGRESS: { label: "Running", color: "info" },
  COMPLETED: { label: "Completed", color: "success" },
  FAILED: { label: "Failed", color: "error" },
} as const;

const POLL_INTERVAL = 5000;

function formatStartedAt(createdAt: string) {
  const date = dayjs(createdAt);
  const today = dayjs().startOf("day");

  if (date.isAfter(today)) return `Today, ${date.format("HH:mm")}`;
  if (date.isAfter(today.subtract(1, "day")))
    return `Yesterday, ${date.format("HH:mm")}`;
  if (date.year() === today.year()) return date.format("D MMM, HH:mm");
  return date.format("D MMM YYYY, HH:mm");
}

function formatDuration(durationMs: number | null) {
  if (durationMs === null) return "—";
  if (durationMs < 1000) return `${durationMs}ms`;

  const seconds = durationMs / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;

  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${Math.round(seconds % 60)}s`;
}

const StatusBadge = ({ status }: { status: Execution["status"] }) => {
  const { label, color } = STATUS[status];

  return (
    <Box
      component="span"
      sx={(theme) => ({
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        px: 0.75,
        py: 0.125,
        borderRadius: 1,
        fontSize: "0.7rem",
        fontWeight: 600,
        color: theme.palette[color].main,
        bgcolor: alpha(theme.palette[color].main, 0.12),
      })}
    >
      <Box
        component="span"
        sx={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          bgcolor: `${color}.main`,
        }}
      />
      {label}
    </Box>
  );
};

const ModeBadge = ({ debug }: { debug: boolean }) => (
  <Box
    component="span"
    sx={(theme) => ({
      px: 0.75,
      borderRadius: 1,
      fontSize: "0.68rem",
      fontWeight: 600,
      lineHeight: "18px",
      border: `1px solid ${
        debug ? theme.palette.divider : alpha(theme.palette.secondary.main, 0.3)
      }`,
      color: debug ? "text.secondary" : theme.palette.secondary.light,
      bgcolor: debug
        ? "transparent"
        : alpha(theme.palette.secondary.main, 0.12),
    })}
  >
    {debug ? "Debug" : "Live"}
  </Box>
);

const ExecutionRow = ({
  execution,
  selected,
  onSelect,
}: {
  execution: Execution;
  selected: boolean;
  onSelect: (execution: Execution) => void;
}) => (
  <Box
    role="button"
    tabIndex={0}
    onClick={() => onSelect(execution)}
    onKeyDown={(event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onSelect(execution);
      }
    }}
    sx={(theme) => ({
      display: "flex",
      alignItems: "center",
      gap: 1.5,
      px: 2,
      py: 1.25,
      cursor: "pointer",
      borderBottom: `1px solid ${theme.palette.divider}`,
      borderLeft: `2px solid ${
        selected ? theme.palette.primary.main : "transparent"
      }`,
      bgcolor: selected
        ? alpha(theme.palette.primary.main, 0.08)
        : "transparent",
      "&:hover": {
        bgcolor: alpha(theme.palette.primary.main, selected ? 0.12 : 0.04),
      },
      "&:focus-visible": {
        outline: `2px solid ${theme.palette.primary.main}`,
        outlineOffset: -2,
      },
    })}
  >
    <Iconify
      icon={
        execution.debug
          ? "solar:bug-bold"
          : "solar:checklist-minimalistic-linear"
      }
      sx={{
        width: 20,
        height: 20,
        color: execution.debug ? "warning.main" : "text.secondary",
        flexShrink: 0,
      }}
    />
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography
          variant="subtitle2"
          noWrap
          title={execution.description}
          sx={{ minWidth: 0 }}
        >
          {execution.description}
        </Typography>
        <ModeBadge debug={execution.debug} />
      </Stack>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
        <StatusBadge status={execution.status} />
        <Typography variant="caption" color="text.secondary" noWrap>
          {formatStartedAt(execution.createdAt)} ·{" "}
          {formatDuration(execution.durationMs)}
        </Typography>
      </Stack>
    </Box>
    <Iconify
      icon="eva:arrow-ios-forward-fill"
      sx={{ width: 18, height: 18, color: "text.disabled", flexShrink: 0 }}
    />
  </Box>
);

const EmptyState = ({ filtered }: { filtered: boolean }) => (
  <Stack
    alignItems="center"
    justifyContent="center"
    spacing={1}
    sx={{ flex: 1, px: 4, py: 8, textAlign: "center" }}
  >
    <Iconify
      icon="solar:clock-circle-linear"
      sx={{ width: 32, height: 32, color: "text.disabled" }}
    />
    <Typography variant="subtitle2">
      {filtered ? "No matching executions" : "No executions yet"}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {filtered
        ? "Try a different search or filter."
        : "Executions started from this blueprint will appear here, both debug and live."}
    </Typography>
  </Stack>
);

const BlueprintExecutions = ({
  blueprintId,
  onSelect,
}: {
  blueprintId: string;
  onSelect?: (execution: Execution) => void;
}) => {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await http.get<Execution[]>(
        `/blueprints/${blueprintId}/executions`
      );
      setExecutions(data);
      setError(null);
    } catch {
      setError("Failed to load executions");
    } finally {
      setLoading(false);
    }
  }, [blueprintId]);

  useEffect(() => {
    setLoading(true);
    setExecutions([]);
    setSelectedId(null);
    setOpenId(null);
    load();
  }, [load]);

  const running = executions.some(({ status }) => status === "IN_PROGRESS");

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(load, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [running, load]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();

    return executions.filter((execution) => {
      if (filter === "DEBUG" && !execution.debug) return false;
      if (filter === "LIVE" && execution.debug) return false;
      if (!query) return true;

      return [execution.description, STATUS[execution.status].label].some(
        (value) => value.toLowerCase().includes(query)
      );
    });
  }, [executions, filter, search]);

  const handleSelect = useCallback(
    (execution: Execution) => {
      setSelectedId(execution.id);
      setOpenId(execution.id);
      onSelect?.(execution);
    },
    [onSelect]
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ px: 2, pb: 1.5 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Search executions"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify
                  icon="eva:search-fill"
                  sx={{ width: 18, height: 18, color: "text.disabled" }}
                />
              </InputAdornment>
            ),
          }}
        />
        <Stack direction="row" spacing={0.75} sx={{ mt: 1.25 }}>
          {FILTERS.map(({ value, label }) => (
            <Chip
              key={value}
              label={label}
              size="small"
              clickable
              variant={filter === value ? "filled" : "outlined"}
              color={filter === value ? "primary" : "default"}
              onClick={() => setFilter(value)}
            />
          ))}
        </Stack>
      </Box>

      <Box
        sx={(theme) => ({
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          borderTop: `1px solid ${theme.palette.divider}`,
        })}
      >
        {loading ? (
          <Stack alignItems="center" sx={{ py: 8 }}>
            <CircularProgress size={24} />
          </Stack>
        ) : error ? (
          <Typography
            variant="body2"
            color="error"
            sx={{ px: 2, py: 4, textAlign: "center" }}
          >
            {error}
          </Typography>
        ) : visible.length ? (
          visible.map((execution) => (
            <ExecutionRow
              key={execution.id}
              execution={execution}
              selected={execution.id === selectedId}
              onSelect={handleSelect}
            />
          ))
        ) : (
          <EmptyState filtered={executions.length > 0} />
        )}
      </Box>
      <TaskLogsDrawer taskId={openId} onClose={() => setOpenId(null)} />
    </Box>
  );
};

export default BlueprintExecutions;
