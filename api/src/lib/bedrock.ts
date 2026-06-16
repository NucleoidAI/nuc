import {
  BedrockRuntimeClient,
  ConverseCommand,
  Message,
} from "@aws-sdk/client-bedrock-runtime";

const bedrock = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

function extractJsonFormat(systemPrompts: { text: string }[]): string | null {
  for (const prompt of systemPrompts) {
    let text = prompt.text;
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === "string") text = parsed;
    } catch {
      // not JSON-stringified, use as-is
    }
    const match = text.match(/^json_format:\s*(.+)/s);
    if (match) return match[1].trim();
  }
  return null;
}

function supportsPromptCaching(modelId: string): boolean {
  return (
    /anthropic\.claude-(opus-4|sonnet-4|haiku-4|3-7-sonnet)/.test(modelId) ||
    /amazon\.nova-/.test(modelId)
  );
}

async function generate({
  model = process.env.PLATFORM_LLM_MODEL || "meta.llama3-3-70b-instruct-v1:0",
  messages = [],
  cacheable = [],
}: {
  model?: string;
  messages?: { role: "user" | "assistant" | "system"; content: string }[];
  cacheable?: { role: "system"; content: string }[];
}) {
  const cacheableContents = new Set(cacheable.map((m) => m.content));
  const systemPrompts: (
    | { text: string }
    | { cachePoint: { type: "default" } }
  )[] = [];
  const conversationMessages: Message[] = [];

  for (const c of cacheable) {
    systemPrompts.push({ text: c.content });
  }
  if (cacheable.length > 0 && supportsPromptCaching(model)) {
    systemPrompts.push({ cachePoint: { type: "default" } });
  }

  for (const msg of messages) {
    if (msg.role === "system") {
      if (cacheableContents.has(msg.content)) continue;
      systemPrompts.push({ text: msg.content });
    } else {
      conversationMessages.push({
        role: msg.role,
        content: [{ text: msg.content }],
      });
    }
  }

  const jsonFormat = extractJsonFormat(
    systemPrompts.filter((p): p is { text: string } => "text" in p),
  );

  const command = new ConverseCommand({
    modelId: model,
    system: systemPrompts,
    messages: conversationMessages,
    inferenceConfig: {
      temperature: 0,
      maxTokens: 8192,
    },
    ...(jsonFormat && {
      toolConfig: {
        tools: [
          {
            toolSpec: {
              name: "structured_output",
              description: `You MUST call this tool to return your response. The response must match this format: ${jsonFormat}`,
              inputSchema: {
                json: { type: "object" },
              },
            },
          },
        ],
        toolChoice: { auto: {} },
      },
    }),
  });

  const response = await bedrock.send(command);

  if (response.usage) {
    const {
      inputTokens,
      outputTokens,
      cacheReadInputTokens,
      cacheWriteInputTokens,
    } = response.usage as typeof response.usage & {
      cacheReadInputTokens?: number;
      cacheWriteInputTokens?: number;
    };
    console.info({
      prompt_tokens: inputTokens,
      completion_tokens: outputTokens,
      cache_read_tokens: cacheReadInputTokens ?? 0,
      cache_write_tokens: cacheWriteInputTokens ?? 0,
    });
  }

  if (response.stopReason === "max_tokens") {
    console.error("Response was truncated due to max_tokens limit");
    throw new Error(
      "LLM response was truncated. The response exceeded the maximum token limit.",
    );
  }

  const outputContent = response.output?.message?.content;
  console.debug("[bedrock] raw content:", JSON.stringify(outputContent));

  const toolUseBlock = outputContent?.find((block) => "toolUse" in block);
  if (toolUseBlock && "toolUse" in toolUseBlock) {
    return toolUseBlock.toolUse?.input;
  }

  const textBlock = outputContent?.find((block) => "text" in block);
  if (textBlock && "text" in textBlock && textBlock.text) {
    try {
      const parsed = JSON.parse(textBlock.text);
      if (parsed.type === "function" && parsed.parameters) {
        const params = unwrapSchemaValues(parsed.parameters);
        const outerKeyMatch = jsonFormat?.match(/^\{\s*(\w+)\s*:/);
        const outerKey = outerKeyMatch?.[1];
        if (outerKey && !(outerKey in params)) {
          return { [outerKey]: params };
        }
        return params;
      }
    } catch {}

    return parseJSONFromLLMResponse(textBlock.text);
  }

  throw new Error("Bedrock is not responding");
}

function unwrapSchemaValues(obj: unknown): unknown {
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    const o = obj as Record<string, unknown>;
    if ("type" in o && "value" in o) {
      return unwrapSchemaValues(o.value);
    }
    return Object.fromEntries(
      Object.entries(o).map(([k, v]) => [k, unwrapSchemaValues(v)]),
    );
  }
  if (typeof obj === "string") {
    const trimmed = obj.trim();
    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
      try {
        return unwrapSchemaValues(JSON.parse(trimmed));
      } catch {
        // not valid JSON, return as-is
      }
    }
  }
  return obj;
}

function parseJSONFromLLMResponse(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    console.error(
      "Failed to parse LLM response as JSON:",
      content.substring(0, 500),
    );
  }

  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {
      console.error(
        "Failed to parse LLM response as JSON:",
        codeBlockMatch[1].trim(),
      );
    }
  }

  const jsonMatch = content.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch {
      console.error("Failed to parse LLM response as JSON:", jsonMatch[1]);
    }
  }

  console.error(
    "Failed to parse LLM response as JSON:",
    content.substring(0, 500),
  );
  throw new SyntaxError(
    `Failed to parse LLM response as JSON. Content starts with: ${content.substring(
      0,
      100,
    )}`,
  );
}

export default { generate };
