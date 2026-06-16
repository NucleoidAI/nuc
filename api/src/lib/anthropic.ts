import { Anthropic } from "@anthropic-ai/sdk";
import { MessageParam } from "@anthropic-ai/sdk/resources/messages/messages.mjs";

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey || apiKey.trim() === "") {
  throw new Error(
    "Missing ANTHROPIC_API_KEY environment variable. Please set it to your Anthropic API key.",
  );
}
const anthropic = new Anthropic({
  apiKey,
});

async function generate({
  model = "claude-haiku-4-5-20251001",
  messages = [],
  cacheable = [],
  temperature = 0,
  max_tokens = 4096,
}: {
  model?: string;
  messages?: { role: "user" | "assistant" | "system"; content: string }[];
  cacheable?: { role: "system"; content: string }[];
  temperature?: number;
  max_tokens?: number;
}) {
  const cacheableContents = new Set(cacheable.map((m) => m.content));
  const otherSystemMessages = messages.filter(
    (msg) => msg.role === "system" && !cacheableContents.has(msg.content),
  );
  const conversationMessages = messages.filter((msg) => msg.role !== "system");

  const systemBlocks: {
    type: "text";
    text: string;
    cache_control?: { type: "ephemeral" };
  }[] = [];

  cacheable.forEach((m, i) => {
    const isLast = i === cacheable.length - 1;
    systemBlocks.push({
      type: "text",
      text: m.content,
      ...(isLast ? { cache_control: { type: "ephemeral" } } : {}),
    });
  });

  for (const m of otherSystemMessages) {
    systemBlocks.push({ type: "text", text: m.content });
  }

  // TODO: Find a better way to handle json_output enforcement for Claude responses.
  const lastOtherSystem = otherSystemMessages[otherSystemMessages.length - 1];
  if (lastOtherSystem && lastOtherSystem.content.includes("json_format:")) {
    systemBlocks.push({
      type: "text",
      text: "IMPORTANT: You MUST respond with ONLY valid JSON that matches the format specified. Do NOT include any text before or after the JSON. Do NOT wrap the JSON in markdown code blocks. Output ONLY the raw JSON object.",
    });
  }

  const params = {
    model,
    messages: conversationMessages as MessageParam[],
    temperature,
    max_tokens,
    ...(systemBlocks.length > 0 ? { system: systemBlocks } : {}),
  };

  const { usage, content } = await anthropic.messages.create(params);

  if (usage) {
    const {
      input_tokens,
      output_tokens,
      cache_creation_input_tokens,
      cache_read_input_tokens,
    } = usage;
    console.info({
      input_tokens,
      output_tokens,
      cache_write_tokens: cache_creation_input_tokens ?? 0,
      cache_read_tokens: cache_read_input_tokens ?? 0,
    });
  }

  if (content) {
    let textContent = content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();

    textContent = textContent
      .replace(/^```(?:json|JSON)?\s*\n?/i, "")
      .replace(/\n?```\s*$/i, "")
      .trim();

    try {
      return JSON.parse(textContent);
    } catch (err) {
      throw new Error(
        "Failed to parse Claude response as JSON: " +
          (err instanceof Error ? err.message : String(err)) +
          "\nResponse content:\n" +
          textContent,
      );
    }
  } else {
    throw new Error("Claude is not responding");
  }
}

export default { generate };
