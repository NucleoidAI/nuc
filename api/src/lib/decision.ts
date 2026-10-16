import { choice, noul, score } from "@typesafe-ai/sdk";
import type { EntryType, Questions } from "@typesafe-ai/sdk";

import { inferSource } from "@canmingir/link-express/llm";
import type { LLMMeta } from "@canmingir/link-express/llm";
import type { DecisionAdapter, DecisionAnswers } from "./types";

type ProviderKey = "TYPESAFE" | "CLOUDFLARE" | "OPENROUTER" | "LAYA";

const PROVIDER_LOADERS: Record<
  ProviderKey,
  () => Promise<{ default: DecisionAdapter }>
> = {
  TYPESAFE: () => import("./typesafe"),
  CLOUDFLARE: () => import("./cloudflare"),
  OPENROUTER: () => import("./openrouterDecision"),
  LAYA: () => import("./laya"),
};

function parseProviderModel(raw: string): {
  provider: ProviderKey;
  model?: string;
} {
  const slashIdx = raw.indexOf("/");
  const providerPart = slashIdx === -1 ? raw : raw.slice(0, slashIdx);
  const modelPart = slashIdx === -1 ? undefined : raw.slice(slashIdx + 1);
  const provider = providerPart.trim().toUpperCase() as ProviderKey;

  if (!(provider in PROVIDER_LOADERS)) {
    throw new Error(
      `Unknown decision provider "${providerPart}" in PLATFORM_DECISION="${raw}". ` +
        `Expected "<provider>/<model>" (or just "<provider>") where provider is one of: ` +
        Object.keys(PROVIDER_LOADERS).join(", ")
    );
  }

  return { provider, model: modelPart };
}

const { provider, model: configuredModel } = parseProviderModel(
  process.env.PLATFORM_DECISION || "typesafe"
);

let adapterPromise: Promise<DecisionAdapter> | null = null;

function getAdapter(): Promise<DecisionAdapter> {
  if (!adapterPromise) {
    adapterPromise = PROVIDER_LOADERS[provider]().then((mod) => mod.default);
  }
  return adapterPromise;
}

async function ask<const Q extends Questions>({
  model,
  state,
  questions,
  meta,
}: {
  model?: string;
  state: EntryType;
  questions: Q;
  meta?: LLMMeta;
}): Promise<DecisionAnswers<Q>> {
  const resolvedSource = meta?.source ? undefined : inferSource(ask);

  const adapter = await getAdapter();

  return await adapter.ask({
    model: model ?? configuredModel,
    state,
    questions,
    meta: resolvedSource ? { ...meta, source: resolvedSource } : meta,
  });
}

export { ask, choice, noul, score };
