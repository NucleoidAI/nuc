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
  console.log("LLAMA input messages:", messages);

  messages.push({
    role: "system",
    content:
      "\n\nIMPORTANT: You MUST respond with ONLY valid JSON that matches the format specified. Do NOT include any text before or after the JSON. Do NOT wrap the JSON in markdown code blocks. Output ONLY the raw JSON object.",
  });

  const {
    choices: [
      {
        message: { content },
      },
    ],
    usage,
  } = await llama.chat.completions.create({
    model,
    messages,
    stream: false,
    response_format: { type: "json_object" },
    temperature: 0,
  });

  if (usage) {
    const { prompt_tokens, completion_tokens } = usage;
    console.info({ prompt_tokens, completion_tokens });
  }

  if (content) {
    console.log("LLAMA output message:", content);
    return JSON.parse(content);
  } else {
    throw new Error("Llama is not responding");
  }
}

export default { generate };
