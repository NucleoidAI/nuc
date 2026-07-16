import OpenAI from "openai";

import { LLMMeta, logLLM } from "./llmLog";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  baseURL: process.env.PLATFORM_LLM_URL,
});

async function generate({
  model = process.env.PLATFORM_LLM_MODEL || "gpt-5-chat-latest",
  messages = [],
  meta,
}: {
  model?: string;
  messages?: OpenAI.ChatCompletionMessageParam[];
  meta?: LLMMeta;
}) {
  const startedAt = Date.now();
  const response = await openai.chat.completions.create({
    model,
    messages,
    stream: false,
    response_format: { type: "json_object" },
  });

  console.debug("[openai] response:", JSON.stringify(response));

  const {
    choices: [
      {
        message: { content },
      },
    ],
    usage,
  } = response;

  if (usage) {
    const { prompt_tokens, completion_tokens } = usage;
    console.info({ prompt_tokens, completion_tokens });
  }

  logLLM({
    provider: "openai",
    model: response.model || model,
    messages,
    response,
    inputTokens: usage?.prompt_tokens,
    outputTokens: usage?.completion_tokens,
    totalTokens: usage?.total_tokens,
    durationMs: Date.now() - startedAt,
    meta,
  });

  if (content) {
    return JSON.parse(content);
  } else {
    throw new Error("OpenAI is not responding");
  }
}

export default { generate };
