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
  console.log("Bedrock input messages:", messages);

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
      maxTokens: 4096,
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

  const outputContent = response.output?.message?.content;
  if (outputContent && outputContent[0]?.text) {
    const content = outputContent[0].text;
    console.log("Bedrock output message:", content);
    return JSON.parse(content);
  } else {
    throw new Error("Bedrock is not responding");
  }
}

export default { generate };
