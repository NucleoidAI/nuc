import { basename } from "node:path";
import type { LLMMeta } from "./llmLog";
import type { LLMAdapter } from "./types";

type ProviderKey =
  | "OPENAI"
  | "ANTHROPIC"
  | "OPENROUTER"
  | "BEDROCK"
  | "LOCAL"
  | "MOCK";

const PROVIDER_LOADERS: Record<
  ProviderKey,
  () => Promise<{ default: LLMAdapter }>
> = {
  OPENAI: () => import("./openai"),
  ANTHROPIC: () => import("./anthropic"),
  OPENROUTER: () => import("./openrouter"),
  BEDROCK: () => import("./bedrock"),
  LOCAL: () => import("./local"),
  MOCK: () => import("./mock"),
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
      `Unknown LLM provider "${providerPart}" in PLATFORM_LLM="${raw}". ` +
        `Expected "<provider>/<model>" (or just "<provider>") where provider is one of: ` +
        Object.keys(PROVIDER_LOADERS).join(", "),
    );
  }

  return { provider, model: modelPart };
}

const { provider, model: configuredModel } = parseProviderModel(
  process.env.PLATFORM_LLM || "local",
);

let llmPromise: Promise<LLMAdapter> | null = null;

function getLLM(): Promise<LLMAdapter> {
  if (!llmPromise) {
    llmPromise = PROVIDER_LOADERS[provider]().then((mod) => mod.default);
  }
  return llmPromise;
}

function toContentString(content: string | object | object[]): string {
  return typeof content === "string" ? content : JSON.stringify(content);
}

function inferSource(
  entry: (...args: never[]) => unknown,
): string | undefined {
  const originalPrepareStackTrace = Error.prepareStackTrace;
  try {
    const holder: { stack?: NodeJS.CallSite[] } = {};
    Error.prepareStackTrace = (_err, stack) =>
      stack as unknown as NodeJS.CallSite[];
    Error.captureStackTrace(holder, entry);
    const caller = holder.stack?.[0];
    if (!caller) return undefined;

    const fnName = caller.getFunctionName() ?? caller.getMethodName() ?? null;
    const fileName = caller.getFileName();
    const fileLabel = fileName
      ? basename(fileName).replace(/\.[cm]?[jt]sx?$/, "")
      : null;

    if (fileLabel && fnName) return `${fileLabel}:${fnName}`;
    return fnName ?? fileLabel ?? undefined;
  } catch {
    return undefined;
  } finally {
    Error.prepareStackTrace = originalPrepareStackTrace;
  }
}

async function generate({
  model,
  dataset,
  policy,
  context = [],
  content,
  json_format,
  temperature = 0,
  max_tokens,
  meta,
}: {
  model?: string;
  policy?: {
    role: "system";
    content: string;
  };
  dataset?: {
    role: "system";
    content: string;
  };
  context?: {
    role: "user" | "system" | "assistant";
    content: string | object | object[];
  }[];
  content: string | object;
  json_format: string;
  temperature?: number;
  max_tokens?: number;
  meta?: LLMMeta;
}) {
  const resolvedSource = meta?.source ? undefined : inferSource(generate);

  const messages = [
    ...context.map(({ role, content }) => ({
      role,
      content: toContentString(content),
    })),
    { role: "user" as const, content: toContentString(content) },
  ];

  if (dataset) {
    messages.unshift(dataset);
  }

  if (policy) {
    messages.unshift(policy);
  }

  const llm = await getLLM();

  return await llm.generate({
    model: model ?? configuredModel,
    messages,
    responseFormat: json_format,
    temperature,
    max_tokens,
    meta: resolvedSource ? { ...meta, source: resolvedSource } : meta,
  });
}

export { generate, inferSource };
