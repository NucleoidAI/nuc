import anthropic from "./anthropic";
import azure from "./azure";
import llama from "./llama";
import openai from "./openai";
import bedrock from "./bedrock";
import mock from "./mock";
import openrouter from "./openrouter";

let llm;

if (process.env.PLATFORM_LLM === "OPENAI") {
  llm = openai;
} else if (process.env.PLATFORM_LLM === "AZURE") {
  llm = azure;
} else if (process.env.PLATFORM_LLM === "ANTHROPIC") {
  llm = anthropic;
} else if (process.env.PLATFORM_LLM === "OPENROUTER") {
  llm = openrouter;
} else if (process.env.PLATFORM_LLM === "MOCK") {
  llm = mock;
} else if (
  process.env.PLATFORM_LLM === "LLAMA" &&
  process.env.LLM_PROVIDER === "BEDROCK"
) {
  llm = bedrock;
} else {
  llm = llama;
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
}) {
  const messages = [
    ...context.map(({ role, content }) => ({
      role,
      content: JSON.stringify(content),
    })),
    { role: "user", content: JSON.stringify(content) },
    {
      role: "system",
      content: `json_format: ${json_format}`,
    },
  ].map(({ role, content }) => ({
    role,
    content: JSON.stringify(content),
  }));

  if (dataset) {
    messages.unshift(dataset);
  }

  if (policy) {
    messages.unshift(policy);
  }

  return await llm.generate({
    model,
    messages,
    temperature,
    max_tokens,
  });
}

export { generate };
