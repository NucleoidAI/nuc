import { generate } from "../lib/llm";

async function run({
  parameters: { transcript, language },
}: {
  parameters: {
    transcript: string;
    language?: string;
  };
}) {
  if (!transcript) {
    return { error: "transcript is required" };
  }

  const lang = language ?? "tr";

  const result = await generate({
    policy: {
      role: "system",
      content: `You are a meeting summarizer. Produce the summary in ${lang}. Be concise and structured.`,
    },
    content: `Summarize the following meeting transcript. Include: key topics discussed, decisions made, and action items with owners.\n\n${transcript}`,
    json_format:
      '{ summary: "<overall summary>", key_topics: ["<topic>"], decisions: ["<decision>"], action_items: [{ owner: "<name>", task: "<task>" }] }',
    max_tokens: 4096,
  });

  return result as {
    summary: string;
    key_topics: string[];
    decisions: string[];
    action_items: { owner: string; task: string }[];
  };
}

export default { run };
