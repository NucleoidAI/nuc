import type { Questions } from "@typesafe-ai/sdk";

import { logLLM } from "./llmLog";
import type { DecisionAdapter, DecisionAnswers, DecisionParams } from "./types";

function credentialFor(provider?: string): string | undefined {
  const env = process.env;

  switch (provider) {
    case "typesafe":
      return env.TYPESAFE_API_KEY;
    case "openrouter":
      return env.OPENROUTER_DECISION_API_KEY || env.OPENROUTER_API_KEY;
    case "cloudflare":
      return env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_AUTH_TOKEN
        ? `${env.CLOUDFLARE_ACCOUNT_ID}:${env.CLOUDFLARE_AUTH_TOKEN}`
        : undefined;
    default:
      return undefined;
  }
}

type RouterResponse<Q extends Questions> = {
  answers?: DecisionAnswers<Q>;
  model?: string | null;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    cost?: number;
  } | null;
  error?: string;
};

async function ask<const Q extends Questions>({
  provider,
  model,
  state,
  questions,
  meta,
}: DecisionParams<Q>): Promise<DecisionAnswers<Q>> {
  const url = process.env.PLATFORM_ROUTER_URL;

  if (!url) {
    throw new Error(
      "Dataset few-shots are served by the router. Set PLATFORM_ROUTER_URL.",
    );
  }

  const key = credentialFor(provider);

  const startedAt = Date.now();

  try {
    const response = await fetch(`${url.replace(/\/+$/, "")}/decide`, {
      method: "POST",
      headers: {
        ...(key && { Authorization: `Bearer ${key}` }),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        provider,
        model,
        state,
        questions,
        source: meta?.source,
      }),
    });
    const body = (await response.json().catch(() => ({}))) as RouterResponse<Q>;

    if (!response.ok || !body.answers) {
      throw new Error(
        `router request failed (${response.status}): ${
          body.error ?? response.statusText
        }`,
      );
    }

    logLLM({
      provider: "router",
      model: body.model ?? null,
      messages: { state, questions },
      response: body.answers,
      inputTokens: body.usage?.input_tokens ?? null,
      outputTokens: body.usage?.output_tokens ?? null,
      cost: body.usage?.cost ?? null,
      durationMs: Date.now() - startedAt,
      meta,
    });

    return body.answers;
  } catch (error) {
    logLLM({
      provider: "router",
      model: null,
      messages: { state, questions },
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
      meta,
    });

    throw error;
  }
}

export default { ask } satisfies DecisionAdapter;
