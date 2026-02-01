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

  systemPrompts.push({
    text: "\n\nIMPORTANT: You MUST respond with ONLY valid JSON that matches the format specified. Do NOT include any text before or after the JSON. Do NOT wrap the JSON in markdown code blocks. Output ONLY the raw JSON object.",
  });

  const command = new ConverseCommand({
    modelId: model,
    system: systemPrompts,
    messages: conversationMessages,
    inferenceConfig: {
      temperature: 0,
      maxTokens: 8192,
    },
  });

  const response = await bedrock.send(command);

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
      "LLM response was truncated. The response exceeded the maximum token limit."
    );
  }

  const outputContent = response.output?.message?.content;
  if (outputContent && outputContent[0]?.text) {
    const content = outputContent[0].text;
    return parseJSONFromLLMResponse(content);
  } else {
    throw new Error("Bedrock is not responding");
  }
}

function parseJSONFromLLMResponse(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    console.error(
      "Failed to parse LLM response as JSON:",
      content.substring(0, 500)
    );
  }

  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {
      console.error(
        "Failed to parse LLM response as JSON:",
        codeBlockMatch[1].trim()
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
    content.substring(0, 500)
  );
  throw new SyntaxError(
    `Failed to parse LLM response as JSON. Content starts with: ${content.substring(
      0,
      100
    )}`
  );
}

export default { generate };
