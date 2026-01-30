import OpenAI from "openai";

const llama = new OpenAI({
  apiKey: process.env.LLAMA_API_KEY || "ollama",
  baseURL: process.env.LLAMA_API_URL || "http://localhost:11434/v1",
});

async function generate({
  model = process.env.LLAMA_MODEL || "llama3.2",
  messages = [],
}) {
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
  });

  if (usage) {
    const { prompt_tokens, completion_tokens } = usage;
    console.info({ prompt_tokens, completion_tokens });
  }

  if (content) {
    return JSON.parse(content);
  } else {
    throw new Error("Llama is not responding");
  }
}

export default { generate };
