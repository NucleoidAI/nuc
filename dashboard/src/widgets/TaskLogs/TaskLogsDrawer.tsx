import { DrawerLayout } from "@canmingir/link/layouts";
import { Iconify } from "@canmingir/link/platform/components";
import { alpha } from "@mui/material/styles";
import useTask from "../../hooks/useTask";
import { useTheme } from "@mui/material/styles";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  type LogLevel,
  type LogLine,
  type TaskLogs,
  durationOf,
  formatTime,
  formatTimeFull,
  toLines,
  toText,
} from "./logLines";
import { useCallback, useEffect, useMemo, useState } from "react";

type Filter = "ALL" | "INFO" | "DONE" | "WARN" | "ERROR";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "INFO", label: "Info" },
  { value: "DONE", label: "Done" },
  { value: "WARN", label: "Warning" },
  { value: "ERROR", label: "Error" },
];

const LEVEL_COLOR: Record<LogLevel, "info" | "success" | "warning" | "error"> =
  {
    INFO: "info",
    DONE: "success",
    WARN: "warning",
    ERROR: "error",
  };

const STATUS = {
  IN_PROGRESS: { label: "Running", color: "info" },
  COMPLETED: { label: "Completed", color: "success" },
  FAILED: { label: "Failed", color: "error" },
} as const;

const POLL_INTERVAL = 2000;
const COLUMNS = {
  xs: "1fr",
  sm: "88px 72px minmax(140px, 240px) minmax(0, 1fr)",
};
const MONO = '"JetBrains Mono", "SFMono-Regular", Menlo, Consolas, monospace';

const matchesFilter = (level: LogLevel, filter: Filter) =>
  filter === "ALL" || level === filter;

const LogRow = ({
  line,
  open,
  onToggle,
}: {
  line: LogLine;
  open: boolean;
  onToggle: () => void;
}) => {
  const color = LEVEL_COLOR[line.level];
  const expandable = line.details.length > 0;
  const tinted = line.level === "ERROR";

  return (
    <Box
      sx={(theme) => ({
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
        bgcolor: tinted ? alpha(theme.palette.error.main, 0.08) : "transparent",
      })}
    >
      <Box
        role={expandable ? "button" : undefined}
        tabIndex={expandable ? 0 : undefined}
        onClick={expandable ? onToggle : undefined}
        onKeyDown={(event) => {
          if (expandable && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            onToggle();
          }
        }}
        sx={(theme) => ({
          display: "grid",
          gridTemplateColumns: COLUMNS,
          rowGap: 1,
          columnGap: 2,
          px: 2,
          py: 0.75,
          fontSize: 12,
          lineHeight: 1.6,
          cursor: expandable ? "pointer" : "default",
          "&:hover": expandable
            ? { bgcolor: alpha(theme.palette.text.primary, 0.04) }
            : undefined,
        })}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ minWidth: 0 }}
        >
          <Box
            title={formatTimeFull(line.time)}
            sx={{ fontFamily: MONO, color: "text.disabled", flexShrink: 0 }}
          >
            {formatTime(line.time)}
          </Box>
        </Stack>
        <Chip
          label={line.level}
          size="small"
          sx={(theme) => ({
            display: { xs: "none", sm: "inline-flex" },
            height: 20,
            fontSize: 11,
            fontWeight: 600,
            fontFamily: MONO,
            color: theme.palette[color].main,
            bgcolor: alpha(theme.palette[color].main, 0.12),
            "& .MuiChip-label": { px: 0.75 },
            "&:hover": {
              bgcolor: alpha(theme.palette[color].main, 0.12),
            },
          })}
        />
        <Box
          sx={{
            color: "text.primary",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={line.step}
        >
          {line.step}
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 0.75,
            minWidth: 0,
            color:
              line.level === "ERROR"
                ? "error.main"
                : line.level === "WARN"
                ? "warning.main"
                : "text.primary",
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0, wordBreak: "break-word" }}>
            {line.message}
          </Box>
          {expandable && (
            <Iconify
              icon={
                open
                  ? "eva:arrow-ios-upward-fill"
                  : "eva:arrow-ios-downward-fill"
              }
              sx={{ width: 14, height: 14, mt: 0.25, color: "text.disabled" }}
            />
          )}
        </Box>
      </Box>

      {open && expandable && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: COLUMNS,
            columnGap: 2,
            px: 2,
            pb: 1.25,
          }}
        >
          <Box
            sx={(theme) => ({
              gridColumn: { xs: "1 / 2", sm: "3 / 5" },
              display: "grid",
              gridTemplateColumns: "72px minmax(0, 1fr)",
              rowGap: 0.75,
              columnGap: 1.5,
              p: 1,
              m: 1,
              borderRadius: 1,
              bgcolor: alpha(theme.palette.background.default, 0.6),
              border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
            })}
          >
            {line.details.map(({ label, value, error }) => (
              <Box key={label} sx={{ display: "contents" }}>
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", lineHeight: 1.8 }}
                >
                  {label}
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    m: 0,
                    maxHeight: 320,
                    overflow: "auto",
                    fontFamily: MONO,
                    fontSize: 11.5,
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    color: error ? "error.main" : "text.primary",
                  }}
                >
                  {value}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

const TaskLogsDrawer = ({
  taskId,
  onClose,
}: {
  taskId: string | null;
  onClose: () => void;
}) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [toggled, setToggled] = useState<Record<string, boolean>>({});

  const theme = useTheme();
  const { getTaskLogs } = useTask(taskId ?? "");

  const { logs: fetchedLogs, error: fetchError, fetch: load } = getTaskLogs();

  const logs = fetchedLogs as TaskLogs | null;
  const error = fetchError ? "Failed to load logs" : null;

  useEffect(() => {
    setSearch("");
    setFilter("ALL");
    setToggled({});
  }, [taskId]);

  const running = logs?.task.status === "IN_PROGRESS";

  useEffect(() => {
    if (!taskId || !running) return;
    const timer = setInterval(load, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [taskId, running, load]);

  const lines = useMemo(() => (logs ? toLines(logs) : []), [logs]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();

    return lines.filter((line) => {
      if (!matchesFilter(line.level, filter)) return false;
      if (!query) return true;

      return [
        line.step,
        line.message,
        line.level,
        ...line.details.map(({ value }) => value),
      ].some((value) => value.toLowerCase().includes(query));
    });
  }, [lines, filter, search]);

  const errors = lines.filter(({ level }) => level === "ERROR").length;
  const warnings = lines.filter(({ level }) => level === "WARN").length;
  const duration = durationOf(lines, running);

  const isOpen = (line: LogLine) => toggled[line.id] ?? line.level === "ERROR";

  const handleDownload = useCallback(() => {
    if (!logs) return;
    const blob = new Blob([toText(lines)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${
      logs.number ? `exe-${logs.number}` : `task-${logs.task.id.slice(0, 8)}`
    }.log`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [logs, lines]);

  const status = logs ? STATUS[logs.task.status] : null;

  return (
    <DrawerLayout
      open={Boolean(taskId)}
      onClose={onClose}
      mode="wide"
      sx={{ zIndex: (theme) => theme.zIndex.modal + 5 }}
      contentSx={{
        p: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          px: 2.5,
          pt: 2,
          pb: 1.5,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.25}
          sx={{ pr: 5 }}
        >
          <Iconify
            icon={
              logs?.task.debug ? "solar:bug-bold" : "solar:document-text-linear"
            }
            sx={{
              width: 20,
              height: 20,
              color: logs?.task.debug ? "warning.main" : "text.primary",
            }}
          />
          <Typography variant="h6" sx={{ fontSize: 17 }}>
            {logs?.task.debug ? "Debug logs" : "Logs"}
          </Typography>
          {logs?.task.description && (
            <Typography
              noWrap
              title={logs.task.description}
              sx={{ fontSize: 13, color: "text.secondary", minWidth: 0 }}
            >
              {logs.task.description}
            </Typography>
          )}
          {status && (
            <Box
              component="span"
              sx={(theme) => ({
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                px: 0.75,
                fontSize: 11,
                fontWeight: 600,
                lineHeight: "20px",
                borderRadius: 1,
                color: theme.palette[status.color].main,
                bgcolor: alpha(theme.palette[status.color].main, 0.12),
              })}
            >
              <Box
                component="span"
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  bgcolor: `${status.color}.main`,
                }}
              />
              {status.label}
            </Box>
          )}
          <Box sx={{ flex: 1 }} />
        </Stack>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={1.5}
          sx={{ mt: 1.25 }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontFamily: MONO, flex: 1, minWidth: 0 }}
            noWrap
          >
            {logs
              ? [
                  `Started ${formatTime(logs.task.createdAt)}`,
                  running ? "running" : duration,
                  logs.task.sessionId && `session ${logs.task.sessionId}`,
                ]
                  .filter(Boolean)
                  .join(" · ")
              : "Loading…"}
          </Typography>
          <TextField
            size="small"
            placeholder="Search logs"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            sx={{ width: { xs: "100%", sm: 240 } }}
            InputProps={{
              sx: { fontSize: 13 },
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify
                    icon="eva:search-fill"
                    sx={{ width: 16, height: 16, color: "text.disabled" }}
                  />
                </InputAdornment>
              ),
            }}
          />
          <Stack direction="row" spacing={0.5}>
            {FILTERS.map(({ value, label }) => {
              const active = filter === value;

              return (
                <Chip
                  key={value}
                  label={label}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    color: active
                      ? theme.palette.primary.main
                      : theme.palette.text.secondary,
                    bgcolor: active
                      ? alpha(theme.palette.primary.main, 0.12)
                      : "transparent",
                    border: `1px solid ${
                      active
                        ? alpha(theme.palette.primary.main, 0.24)
                        : theme.palette.divider
                    }`,
                    "&:hover": {
                      bgcolor: active
                        ? alpha(theme.palette.primary.main, 0.16)
                        : theme.palette.action.hover,
                    },
                  }}
                  onClick={() => setFilter(value)}
                />
              );
            })}
          </Stack>
        </Stack>
      </Box>

      <Box
        sx={(theme) => ({
          display: { xs: "none", sm: "grid" },
          gridTemplateColumns: COLUMNS,
          columnGap: 2,
          px: 2,
          py: 0.75,
          fontSize: 11,
          fontWeight: 600,
          color: "text.secondary",
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: alpha(theme.palette.background.default, 0.5),
          position: "sticky",
          top: 0,
          zIndex: 1,
        })}
      >
        <span>Time</span>
        <span>Level</span>
        <span>Step</span>
        <span>Message</span>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto" }}>
        {error ? (
          <Typography
            variant="body2"
            color="error"
            sx={{ px: 2, py: 4, textAlign: "center" }}
          >
            {error}
          </Typography>
        ) : !logs ? (
          <Stack alignItems="center" sx={{ py: 8 }}>
            <CircularProgress size={24} />
          </Stack>
        ) : visible.length ? (
          <>
            {visible.map((line) => (
              <LogRow
                key={line.id}
                line={line}
                open={isOpen(line)}
                onToggle={() =>
                  setToggled((prev) => ({ ...prev, [line.id]: !isOpen(line) }))
                }
              />
            ))}
            {running && (
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ px: 2, py: 1, color: "text.secondary" }}
              >
                <CircularProgress size={10} />
                <Typography variant="caption" sx={{ fontFamily: MONO }}>
                  waiting for new events…
                </Typography>
              </Stack>
            )}
          </>
        ) : (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ px: 2, py: 6, textAlign: "center" }}
          >
            No log lines match.
          </Typography>
        )}
      </Box>

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2.5, py: 1.25, borderTop: 1, borderColor: "divider" }}
      >
        <Typography variant="caption" color="text.secondary">
          {visible.length === lines.length
            ? `${lines.length} events`
            : `${visible.length} of ${lines.length} events`}{" "}
          · {errors} {errors === 1 ? "error" : "errors"} · {warnings}{" "}
          {warnings === 1 ? "warning" : "warnings"}
        </Typography>
        <Button
          size="small"
          disabled={!logs}
          onClick={handleDownload}
          startIcon={
            <Iconify icon="eva:download-fill" sx={{ width: 16, height: 16 }} />
          }
        >
          Download logs
        </Button>
      </Stack>
    </DrawerLayout>
  );
};

export default TaskLogsDrawer;
