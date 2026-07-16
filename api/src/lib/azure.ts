import axios from "axios";

import { LLMMeta, logLLM } from "./llmLog";

async function generate({
  messages = [],
  temperature = 0,
  top_p = 1,
  presence_penalty = 0,
  frequency_penalty = 0,
  meta,
}: {
  messages?: { role: string; content: string }[];
  temperature?: number;
  top_p?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  meta?: LLMMeta;
}) {
  const startedAt = Date.now();
  const { data } = await axios({
    method: "POST",
    url: process.env.AZURE_ENDPOINT,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.AZURE_API_KEY}`,
    },
    data: {
      messages,
      temperature,
      top_p,
      presence_penalty,
      frequency_penalty,
    },
  });

  const {
    choices: [
      {
        message: { content },
      },
    ],
    usage: { prompt_tokens, completion_tokens, total_tokens },
  } = data;

  console.info({ prompt_tokens, completion_tokens });

  logLLM({
    provider: "azure",
    model: data.model,
    messages,
    response: data,
    inputTokens: prompt_tokens,
    outputTokens: completion_tokens,
    totalTokens: total_tokens,
    durationMs: Date.now() - startedAt,
    meta,
  });

  return JSON.parse(content);
}

export default { generate };
