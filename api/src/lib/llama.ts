import OpenAI from "openai";

const llama = new OpenAI({
  apiKey: process.env.LLAMA_API_KEY || "ollama",
  baseURL: process.env.LLAMA_API_URL || "http://localhost:11434/v1",
});

async function generate({
  model = process.env.LLAMA_MODEL || "llama3.2",
  messages = [],
}: {
  model?: string;
  messages?: { role: "user" | "assistant" | "system"; content: string }[];
}) {
  console.log("LLAMA input messages:", JSON.stringify(messages, null, 2));

  const systemMessages = messages.filter((m) => m.role === "system");
  const otherMessages = messages.filter((m) => m.role !== "system");

  const finalMessages = [
    {
      role: "system" as const,
      content: `You MUST respond with ONLY valid JSON. ${systemMessages
        .map((m) => m.content)
        .join(" ")}`,
    },
    ...otherMessages,
  ];

  const response = await llama.chat.completions.create({
    model,
    messages: finalMessages,
    stream: false,
    response_format: { type: "json_object" },
    temperature: 0,
  });

  const content = response.choices[0]?.message?.content;

  if (response.usage) {
    const { prompt_tokens, completion_tokens } = response.usage;
    console.info({ prompt_tokens, completion_tokens });
  }

  if (!content) {
    throw new Error("Llama did not return content");
  }

  console.log("LLAMA output message:", content);

  try {
    return JSON.parse(content);
  } catch (error) {
    console.error("Failed to parse JSON:", content);
  }
}

export default { generate };
