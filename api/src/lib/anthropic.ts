import { Anthropic } from "@anthropic-ai/sdk";
import { MessageParam } from "@anthropic-ai/sdk/resources/messages/messages.mjs";

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey || apiKey.trim() === "") {
  throw new Error(
    "Missing ANTHROPIC_API_KEY environment variable. Please set it to your Anthropic API key."
  );
}
const anthropic = new Anthropic({
  apiKey,
});

async function generate({
  model = "claude-haiku-4-5-20251001",
  messages = [],
  temperature = 0,
  max_tokens = 4096,
}: {
  model?: string;
  messages?: { role: "USER" | "ASSISTANT" | "SYSTEM"; content: string }[];
  temperature?: number;
  max_tokens?: number;
}) {
  const systemMessages = messages.filter((msg) => msg.role === "SYSTEM");
  const conversationMessages = messages.filter((msg) => msg.role !== "SYSTEM");

  let systemPrompt =
    systemMessages.length > 0
      ? systemMessages.map((msg) => msg.content).join("\n\n")
      : undefined;

  // TODO: Find a better way to handle json_output enforcement for Claude responses.
  const lastSystemMsg = systemMessages[systemMessages.length - 1];
  if (lastSystemMsg && lastSystemMsg.content.includes("json_format:")) {
    systemPrompt =
      systemPrompt +
      "\n\nIMPORTANT: You MUST respond with ONLY valid JSON that matches the format specified. Do NOT include any text before or after the JSON. Do NOT wrap the JSON in markdown code blocks. Output ONLY the raw JSON object.";
  }

  const roleMap: Record<string, MessageParam["role"]> = {
    USER: "user",
    SYSTEM: "system",
    ASSISTANT: "assistant",
  };

  const normalizedConversationMessages: MessageParam[] =
    conversationMessages.map(({ role, content }) => ({
      role: roleMap[role] ?? "assistant",
      content,
    }));

  const params = {
    model,
    messages: normalizedConversationMessages,
    temperature,
    max_tokens,
    ...(systemPrompt && { system: systemPrompt }),
  };

  const { usage, content } = await anthropic.messages.create(params);

  if (usage) {
    const { input_tokens, output_tokens } = usage;
    console.info({ input_tokens, output_tokens });
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
          textContent
      );
    }
  } else {
    throw new Error("Claude is not responding");
  }
}

export default { generate };
