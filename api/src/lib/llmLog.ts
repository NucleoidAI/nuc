import LLMLog from "../models/LLMLog";
import type { LLMMeta } from "@canmingir/link-express/llm";

function logLLM({
  provider,
  model = null,
  messages,
  response = null,
  inputTokens = null,
  outputTokens = null,
  totalTokens = null,
  cost = null,
  durationMs = null,
  error = null,
  meta = {},
}: {
  provider: string;
  model?: string | null;
  messages: unknown;
  response?: unknown;
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
  cost?: number | null;
  durationMs?: number | null;
  error?: string | null;
  meta?: LLMMeta;
}): void {
  LLMLog.create({
    provider,
    model,
    messages,
    response,
    inputTokens,
    outputTokens,
    totalTokens:
      totalTokens ??
      (inputTokens != null && outputTokens != null
        ? inputTokens + outputTokens
        : null),
    cost,
    durationMs,
    error,
    source: meta.source ?? null,
    agentId: meta.agentId ?? null,
    sessionId: meta.sessionId ?? null,
    taskId: meta.taskId ?? null,
    teamId: meta.teamId ?? null,
  }).catch((err) => {
    console.error("Failed to write LLMLog:", err);
  });
}

export { logLLM };
