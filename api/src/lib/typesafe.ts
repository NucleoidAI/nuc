import { TypeSafeClient } from "@typesafe-ai/sdk";
import type { Questions } from "@typesafe-ai/sdk";

import { logLLM } from "./llmLog";
import type { DecisionAdapter, DecisionParams } from "./types";

let client: TypeSafeClient | null = null;

function getClient(): TypeSafeClient {
  if (!client) {
    client = new TypeSafeClient({
      timeout: Number(process.env.TYPESAFE_TIMEOUT_MS) || 30000,
    });
  }
  return client;
}

async function ask<const Q extends Questions>({
  model,
  state,
  questions,
  meta,
}: DecisionParams<Q>) {
  const startedAt = Date.now();

  try {
    const result = await getClient().systemOne({
      state,
      questions,
      ...(model ? { model } : {}),
    });

    logLLM({
      provider: "typesafe",
      model: result.model,
      messages: { state, questions },
      response: result.answers,
      inputTokens: result.usage.input_tokens,
      outputTokens: result.usage.output_tokens,
      durationMs: Date.now() - startedAt,
      meta,
    });

    return result.answers;
  } catch (error) {
    logLLM({
      provider: "typesafe",
      model: model ?? null,
      messages: { state, questions },
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
      meta,
    });

    throw error;
  }
}

export default { ask } satisfies DecisionAdapter;
