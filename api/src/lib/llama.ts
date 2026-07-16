import OpenAI from "openai";

import { LLMMeta, logLLM } from "./llmLog";

const llama = new OpenAI({
  apiKey: "ollama",
  baseURL: process.env.PLATFORM_LLM_URL || "http://localhost:11434/v1",
});

async function generate({
  model = process.env.PLATFORM_LLM_MODEL || "llama3.2",
  messages = [],
  meta,
}: {
  model?: string;
  messages?: { role: "user" | "assistant" | "system"; content: string }[];
  meta?: LLMMeta;
}) {
  console.log("LLAMA input messages:", messages);

  messages.push({
    role: "system",
    content:
      "\n\nIMPORTANT: You MUST respond with ONLY valid JSON that matches the format specified. Do NOT include any text before or after the JSON. Do NOT wrap the JSON in markdown code blocks. Output ONLY the raw JSON object.",
  });

  const startedAt = Date.now();
  const response = await llama.chat.completions.create({
    model,
    messages,
    stream: false,
    response_format: { type: "json_object" },
    temperature: 0,
  });

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
    provider: "llama",
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
    console.log("LLAMA output message:", content);
    return JSON.parse(content);
  } else {
    throw new Error("Llama is not responding");
  }
}

export default { generate };
