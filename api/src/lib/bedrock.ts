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

async function generate({
  model = process.env.PLATFORM_LLM_MODEL || "meta.llama3-3-70b-instruct-v1:0",
  messages = [],
}: {
  model?: string;
  messages?: { role: "user" | "assistant" | "system"; content: string }[];
}) {
  const systemPrompts: { text: string }[] = [];
  const conversationMessages: Message[] = [];

  for (const msg of messages) {
    if (msg.role === "system") {
      systemPrompts.push({ text: msg.content });
    } else {
      conversationMessages.push({
        role: msg.role,
        content: [{ text: msg.content }],
      });
    }
  }

  const jsonFormat = extractJsonFormat(systemPrompts);
  const isQwen = model.startsWith("qwen.");

  const useToolConfig = jsonFormat && !isQwen;

  if (isQwen && jsonFormat) {
    systemPrompts.push({
      text: `You MUST respond with ONLY valid RFC 8259 JSON (all keys double-quoted) matching this exact format, no explanation, no markdown: ${jsonFormat}`,
    });
  }

  const command = new ConverseCommand({
    modelId: model,
    system: systemPrompts,
    messages: conversationMessages,
    inferenceConfig: {
      temperature: 0,
      maxTokens: 8192,
    },
    ...(useToolConfig && {
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

  let response;
  try {
    response = await bedrock.send(command);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("http2") || msg.includes("did not get a response")) {
      const freshClient = new BedrockRuntimeClient({
        region: process.env.AWS_REGION || "us-east-1",
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
        },
      });
      response = await freshClient.send(command);
    } else {
      throw err;
    }
  }

  if (response.usage) {
    const { inputTokens, outputTokens } = response.usage;
    console.info({
      prompt_tokens: inputTokens,
      completion_tokens: outputTokens,
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
  // Attempt 1: direct parse
  try {
    return JSON.parse(content);
  } catch {
    /* fall through */
  }

  // Attempt 2: JSON inside a code block
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {
      /* fall through */
    }
  }

  // Attempt 3: extract first JSON-like object/array, then try quoting unquoted keys
  const jsonMatch = content.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch {
      /* fall through */
    }

    try {
      const quoted = jsonMatch[1].replace(
        /([{,]\s*)([a-zA-Z_$][\w$]*)(\s*:)/g,
        '$1"$2"$3',
      );
      return JSON.parse(quoted);
    } catch {
      /* fall through */
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
