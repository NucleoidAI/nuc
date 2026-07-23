import { LLMMeta } from "./llmLog";

type GenerateParams = {
  model?: string;
  messages: { role: "user" | "assistant" | "system"; content: string }[];
  responseFormat?: string;
  temperature?: number;
  max_tokens?: number;
  meta?: LLMMeta;
};

type LLMAdapter = {
  generate(params: GenerateParams): Promise<Record<string, unknown>>;
};

export type { GenerateParams, LLMAdapter };
