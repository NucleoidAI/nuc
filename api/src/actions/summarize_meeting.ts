import { generate } from "../lib/llm";
import type { LLMMeta } from "../lib/llmLog";

const LANGUAGE_NAMES: Record<string, string> = {
  tr: "Turkish",
  en: "English",
};

function languageName(code: string): string {
  return LANGUAGE_NAMES[code.toLowerCase()] ?? code;
}

async function run({
  parameters: { transcript, language },
  meta,
}: {
  parameters: {
    transcript: string;
    language?: string;
  };
  meta?: LLMMeta;
}) {
  if (!transcript) {
    return { error: "transcript is required" };
  }

  const lang = languageName(language ?? "tr");

  const result = await generate({
    policy: {
      role: "system",
      content: `You are a meeting summarizer. Respond entirely in ${lang} - every word of your output must be in ${lang}, regardless of what language the transcript is in. Be concise and structured.`,
    },
    content: `Summarize the following meeting transcript. Include: key topics discussed, decisions made, and action items with owners.\n\n${transcript}`,
    json_format:
      '{ summary: "<overall summary>", key_topics: ["<topic>"], decisions: ["<decision>"], action_items: [{ owner: "<name>", task: "<task>" }] }',
    max_tokens: 4096,
    meta,
  });

  return result as {
    summary: string;
    key_topics: string[];
    decisions: string[];
    action_items: { owner: string; task: string }[];
  };
}

export default { run };
