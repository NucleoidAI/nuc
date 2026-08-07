import { generate } from "../lib/llm";
import type { LLMMeta } from "../lib/llmLog";

async function run({
  parameters: { text },
  meta,
}: {
  parameters: {
    text: string;
  };
  meta?: LLMMeta;
}) {
  if (!text) {
    return { error: "text is required" };
  }

  const result = await generate({
    policy: {
      role: "system",
      content:
        "You are a professional translator. Translate the given text into Turkish, English, and Spanish. Preserve meaning, tone, and formatting. Do not add commentary or notes. If the text is already in one of these languages, still return that language's field with the original (or lightly cleaned-up) text.",
    },
    content: text,
    json_format:
      '{ tr: "<Turkish translation>", en: "<English translation>", es: "<Spanish translation>" }',
    max_tokens: 4096,
    meta,
  });

  return result as {
    tr: string;
    en: string;
    es: string;
  };
}

export default { run };
