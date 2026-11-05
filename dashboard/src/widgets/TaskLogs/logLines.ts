import dayjs from "dayjs";

export type LogLevel = "INFO" | "DONE" | "WARN" | "ERROR";

export type LogDetail = { label: string; value: string; error?: boolean };

export type LogLine = {
  id: string;
  time: string;
  level: LogLevel;
  step: string;
  message: string;
  details: LogDetail[];
};

type StepEntry = {
  type: "STEP";
  id: string;
  action: string;
  status: string;
  comment: string | null;
  parameters: unknown;
  result: string | null;
  createdAt: string;
};

type LLMEntry = {
  type: "LLM";
  id: string;
  provider: string;
  model: string | null;
  source: string | null;
  messages: unknown;
  response: unknown;
  inputTokens: number | null;
  outputTokens: number | null;
  cost: number | null;
  durationMs: number | null;
  error: string | null;
  createdAt: string;
};

export type TaskLogs = {
  task: {
    id: string;
    description: string;
    status: "IN_PROGRESS" | "COMPLETED" | "FAILED";
    result: string | null;
    comment: string | null;
    sessionId: string | null;
    blueprintId: string | null;
    debug?: boolean;
    createdAt: string;
  };
  number: number | null;
  totals: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost: number;
    calls: number;
  };
  entries: (StepEntry | LLMEntry)[];
};

const STEP_LEVELS: Record<string, LogLevel> = {
  COMPLETED: "DONE",
  FAILED: "ERROR",
  IN_PROGRESS: "INFO",
};

function raw(value: unknown) {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "string") {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }

  return JSON.stringify(value, null, 2);
}

function details(items: (LogDetail | { label: string; value: unknown })[]) {
  return items.flatMap((item) => {
    const value = raw(item.value);
    return value ? [{ ...item, value }] : [];
  });
}

function stepLine(entry: StepEntry): LogLine {
  return {
    id: `STEP-${entry.id}`,
    time: entry.createdAt,
    level: STEP_LEVELS[entry.status] ?? "WARN",
    step: entry.action,
    message: [entry.status, entry.comment].filter(Boolean).join(" · "),
    details: details([
      { label: "Input", value: entry.parameters },
      {
        label: "Output",
        value: entry.result,
        error: entry.status === "FAILED",
      },
    ]),
  };
}

function llmLine(entry: LLMEntry): LogLine {
  const model = [entry.provider, entry.model].filter(Boolean).join("/");
  const usage = [
    `${entry.inputTokens ?? 0}→${entry.outputTokens ?? 0} tok`,
    typeof entry.durationMs === "number" &&
      `${(entry.durationMs / 1000).toFixed(2)}s`,
    typeof entry.cost === "number" && `$${entry.cost.toFixed(4)}`,
  ].filter(Boolean);

  return {
    id: `LLM-${entry.id}`,
    time: entry.createdAt,
    level: entry.error ? "ERROR" : "INFO",
    step: `LLM ${entry.source ?? "call"}`,
    message: entry.error
      ? `${model} · ${entry.error}`
      : [model, ...usage].join(" · "),
    details: details([
      { label: "Error", value: entry.error, error: true },
      { label: "Messages", value: entry.messages },
      { label: "Response", value: entry.response },
    ]),
  };
}

function toLines({ task, entries }: TaskLogs): LogLine[] {
  const body = entries.map((entry) =>
    entry.type === "STEP" ? stepLine(entry) : llmLine(entry)
  );

  const start: LogLine = {
    id: "TASK-START",
    time: task.createdAt,
    level: "INFO",
    step: "Task",
    message: [
      "Task created",
      task.debug ? "debug" : "live",
      task.sessionId && `session ${task.sessionId}`,
    ]
      .filter(Boolean)
      .join(" · "),
    details: details([{ label: "Request", value: task.description }]),
  };

  if (task.status === "IN_PROGRESS") return [start, ...body];

  const failed = task.status === "FAILED";
  const end: LogLine = {
    id: "TASK-END",
    time: body.length ? body[body.length - 1].time : task.createdAt,
    level: failed ? "ERROR" : "DONE",
    step: "Execution",
    message: [failed ? "Finished with errors" : "Finished", task.comment]
      .filter(Boolean)
      .join(" · "),
    details: details([
      { label: "Result", value: task.result },
      { label: "Comment", value: task.comment, error: failed },
    ]),
  };

  return [start, ...body, end];
}

function formatTime(time: string) {
  return dayjs(time).format("HH:mm:ss");
}

function formatTimeFull(time: string) {
  return dayjs(time).format("D MMM YYYY, HH:mm:ss.SSS");
}

function durationOf(lines: LogLine[], running: boolean) {
  if (running || lines.length < 2) return null;
  const ms =
    new Date(lines[lines.length - 1].time).getTime() -
    new Date(lines[0].time).getTime();
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
}

function toText(lines: LogLine[]) {
  return lines
    .map((line) => {
      const head = [
        formatTime(line.time),
        line.level.padEnd(5),
        line.step,
        line.message,
      ].join("  ");
      const body = line.details.map(
        ({ label, value }) =>
          `    ${label}:\n${value
            .split("\n")
            .map((row) => `      ${row}`)
            .join("\n")}`
      );
      return [head, ...body].join("\n");
    })
    .join("\n");
}

export { durationOf, formatTime, formatTimeFull, toLines, toText };
