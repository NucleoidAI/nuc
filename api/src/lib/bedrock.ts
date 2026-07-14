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
    const parsed = parseWithBraceRepair(textBlock.text);
    if (
      parsed &&
      typeof parsed === "object" &&
      (parsed as { type?: unknown }).type === "function" &&
      (parsed as { parameters?: unknown }).parameters
    ) {
      const params = unwrapSchemaValues(
        (parsed as { parameters: unknown }).parameters,
      );
      const outerKeyMatch = jsonFormat?.match(/^\{\s*(\w+)\s*:/);
      const outerKey = outerKeyMatch?.[1];
      if (
        outerKey &&
        params &&
        typeof params === "object" &&
        !(outerKey in params)
      ) {
        return { [outerKey]: params };
      }
      return params;
    }

    return parseJSONFromLLMResponse(textBlock.text);
  }

  throw new Error("Bedrock is not responding");
}

// Llama on Bedrock occasionally drops the final closing brace(s) when it
// emits its fake tool-call JSON as plain text. This repairs unbalanced
// braces/brackets (tracked outside of string literals) before re-parsing.
function repairUnbalancedJSON(content: string): string | null {
  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (const ch of content) {
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\" && inString) {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (ch === "{" || ch === "[") stack.push(ch);
    else if (ch === "}" && stack[stack.length - 1] === "{") stack.pop();
    else if (ch === "]" && stack[stack.length - 1] === "[") stack.pop();
  }

  if (stack.length === 0 && !inString) return null;

  let repaired = content;
  if (inString) repaired += '"';
  for (let i = stack.length - 1; i >= 0; i--) {
    repaired += stack[i] === "{" ? "}" : "]";
  }
  return repaired;
}

// Quotes unquoted object keys (e.g. `{ next_step: ... }`) while tracking
// string literals, so `Word:` sequences inside string values are untouched —
// a plain regex would corrupt them.
function quoteUnquotedKeys(content: string): string {
  let result = "";
  let inString = false;
  let escaped = false;
  let i = 0;

  while (i < content.length) {
    const ch = content[i];
    if (inString) {
      result += ch;
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      i++;
      continue;
    }
    if (ch === '"') {
      inString = true;
      result += ch;
      i++;
      continue;
    }
    const keyMatch = /^([A-Za-z_$][\w$]*)(\s*:)/.exec(content.slice(i));
    if (keyMatch) {
      result += `"${keyMatch[1]}"${keyMatch[2]}`;
      i += keyMatch[0].length;
      continue;
    }
    result += ch;
    i++;
  }

  return result;
}

function parseWithBraceRepair(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    const repaired = repairUnbalancedJSON(content);
    if (repaired) {
      try {
        return JSON.parse(repaired);
      } catch {
        /* fall through */
      }
    }
  }
  return undefined;
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

    const quoted = quoteUnquotedKeys(jsonMatch[1]);
    try {
      return JSON.parse(quoted);
    } catch {
      /* fall through */
    }

    // Quoted keys but still unbalanced braces — repair those too
    const quotedRepaired = repairUnbalancedJSON(quoted);
    if (quotedRepaired) {
      try {
        return JSON.parse(quotedRepaired);
      } catch {
        /* fall through */
      }
    }
  }

  // Attempt 4: repair unbalanced braces/brackets (e.g. a dropped closing brace)
  const repaired = repairUnbalancedJSON(content);
  if (repaired) {
    try {
      return JSON.parse(repaired);
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
