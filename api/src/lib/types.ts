import type { EntryType, Questions, SystemOneResult } from "@typesafe-ai/sdk";
import type { LLMMeta } from "@canmingir/link-express/llm";

type DecisionParams<Q extends Questions> = {
  provider?: string;
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
  DecisionParams,
  DecisionAnswers,
  DecisionAdapter,
};
