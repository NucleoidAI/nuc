import OpenAI from "openai";

import { logLLM } from "./llmLog";
import { parseJsonWithRepair } from "./jsonParse";
import type { GenerateParams, LLMAdapter } from "./types";

type OpenAICompatibleOptions = {
  providerLabel: string;
  client: OpenAI;
  defaultModel: string;
  jsonModeFallback?: boolean;
  forceJsonSystemPrompt?: boolean;
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
      responseFormat,
      temperature = 0,
      max_tokens,
      meta,
    }: GenerateParams) {
      const chatMessages = [
        ...messages,
        ...(responseFormat
          ? [
              {
                role: "system" as const,
                content: `Respond with ONLY valid JSON matching this format: ${responseFormat}`,
              },
            ]
          : []),
        ...(forceJsonSystemPrompt
          ? [
              {
                role: "system" as const,
                content:
                  "IMPORTANT: You MUST respond with ONLY valid JSON that matches the format specified. Do NOT include any text before or after the JSON. Do NOT wrap the JSON in markdown code blocks. Output ONLY the raw JSON object.",
              },
            ]
          : []),
      ];

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

      return parseJsonWithRepair(content, providerLabel) as Record<
        string,
        unknown
      >;
    },
  };
}

export { createOpenAICompatibleAdapter };
