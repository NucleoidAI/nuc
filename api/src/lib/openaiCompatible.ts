import OpenAI from "openai";

import { logLLM } from "./llmLog";
import { parseJsonContent } from "./jsonParse";
import type { GenerateParams, LLMAdapter } from "./types";

type OpenAICompatibleOptions = {
  providerLabel: string;
  client: OpenAI;
  defaultModel: string;
  // OpenRouter proxies models that don't all support response_format —
  // retry once without it instead of failing the call.
  jsonModeFallback?: boolean;
  // Some local/self-hosted models ignore response_format entirely and need
  // the JSON instruction spelled out in a system message instead.
  forceJsonSystemPrompt?: boolean;
  // OpenRouter reports request cost in `usage.cost`; the other providers don't.
  extractCost?: boolean;
};

function isResponseFormatError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return (
    message.includes("response_format") ||
    message.includes("json_object") ||
    (err as { status?: number })?.status === 400
  );
}

function createOpenAICompatibleAdapter(
  options: OpenAICompatibleOptions,
): LLMAdapter {
  const {
    providerLabel,
    client,
    defaultModel,
    jsonModeFallback = false,
    forceJsonSystemPrompt = false,
    extractCost = false,
  } = options;

  return {
    async generate({
      model = defaultModel,
      messages = [],
      temperature = 0,
      max_tokens,
      meta,
    }: GenerateParams) {
      const chatMessages = forceJsonSystemPrompt
        ? [
            ...messages,
            {
              role: "system" as const,
              content:
                "IMPORTANT: You MUST respond with ONLY valid JSON that matches the format specified. Do NOT include any text before or after the JSON. Do NOT wrap the JSON in markdown code blocks. Output ONLY the raw JSON object.",
            },
          ]
        : messages;

      const baseParams: Parameters<typeof client.chat.completions.create>[0] = {
        model,
        messages: chatMessages as OpenAI.ChatCompletionMessageParam[],
        stream: false,
        temperature,
        ...(max_tokens && { max_tokens }),
      };

      const startedAt = Date.now();
      let response: OpenAI.ChatCompletion;
      try {
        response = (await client.chat.completions.create({
          ...baseParams,
          response_format: { type: "json_object" },
        })) as OpenAI.ChatCompletion;
      } catch (err) {
        if (jsonModeFallback && isResponseFormatError(err)) {
          console.warn(
            `Model ${model} does not support response_format, retrying without it.`,
          );
          response = (await client.chat.completions.create(
            baseParams,
          )) as OpenAI.ChatCompletion;
        } else {
          throw err;
        }
      }

      console.debug(`[${providerLabel}] response:`, JSON.stringify(response));

      const content = response.choices[0].message.content;
      const usage = response.usage as
        | (OpenAI.CompletionUsage & { cost?: number })
        | undefined;

      if (usage) {
        const { prompt_tokens, completion_tokens } = usage;
        console.info({ prompt_tokens, completion_tokens });
      }

      logLLM({
        provider: providerLabel,
        model: response.model || model,
        messages: chatMessages,
        response,
        inputTokens: usage?.prompt_tokens,
        outputTokens: usage?.completion_tokens,
        totalTokens: usage?.total_tokens,
        cost: extractCost ? usage?.cost : undefined,
        durationMs: Date.now() - startedAt,
        meta,
      });

      if (!content) {
        throw new Error(`${providerLabel} is not responding`);
      }

      return parseJsonContent(content, providerLabel) as Record<
        string,
        unknown
      >;
    },
  };
}

export { createOpenAICompatibleAdapter };
