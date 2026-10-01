import type { EntryType, Questions, SystemOneResult } from "@typesafe-ai/sdk";
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

type DecisionParams<Q extends Questions> = {
  model?: string;
  state: EntryType;
  questions: Q;
  meta?: LLMMeta;
};

type DecisionAnswers<Q extends Questions> = SystemOneResult<Q>["answers"];

type DecisionAdapter = {
  ask<const Q extends Questions>(
    params: DecisionParams<Q>,
  ): Promise<DecisionAnswers<Q>>;
};

export type {
  GenerateParams,
  LLMAdapter,
  DecisionParams,
  DecisionAnswers,
  DecisionAdapter,
};
