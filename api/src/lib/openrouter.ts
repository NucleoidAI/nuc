import OpenAI from "openai";

const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || "",
  baseURL: process.env.PLATFORM_LLM_URL || "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "",
    "X-Title": process.env.OPENROUTER_SITE_NAME || "GreyCollar",
  },
});

function parseJsonContent(content: string): unknown {
  const cleaned = content
    .trim()
    .replace(/^```(?:json|JSON)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error(
      "Failed to parse OpenRouter response as JSON: " +
        (err instanceof Error ? err.message : String(err)) +
        "\nResponse content:\n" +
        cleaned,
    );
  }
}

async function generate({
  model = process.env.PLATFORM_LLM_MODEL || "openai/gpt-4o-mini",
  messages = [],
  temperature = 0,
  max_tokens,
}: {
  model?: string;
  messages?: { role: string; content: string }[];
  temperature?: number;
  max_tokens?: number;
}) {
  const params: Parameters<typeof openrouter.chat.completions.create>[0] = {
    model,
    messages: messages as OpenAI.ChatCompletionMessageParam[],
    stream: false,
    temperature,
    ...(max_tokens && { max_tokens }),
  };

  // Try with json_object response_format first; not all models support it.
  let content: string | null = null;
  try {
    const response = await openrouter.chat.completions.create({
      ...params,
      response_format: { type: "json_object" },
    });
    const choice = response.choices[0];
    content = choice.message.content;
    if (response.usage) {
      const { prompt_tokens, completion_tokens } = response.usage;
      console.info({ prompt_tokens, completion_tokens });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    // Fall back for models that don't support response_format
    if (
      message.includes("response_format") ||
      message.includes("json_object") ||
      (err as { status?: number })?.status === 400
    ) {
      console.warn(
        `Model ${model} does not support response_format, retrying without it.`,
      );
      const response = await openrouter.chat.completions.create(params);
      const choice = response.choices[0];
      content = choice.message.content;
      if (response.usage) {
        const { prompt_tokens, completion_tokens } = response.usage;
        console.info({ prompt_tokens, completion_tokens });
      }
    } else {
      throw err;
    }
  }

  if (content) {
    return parseJsonContent(content);
  } else {
    throw new Error("OpenRouter is not responding");
  }
}

export default { generate };
