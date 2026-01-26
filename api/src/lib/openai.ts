import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  baseURL: process.env.PLATFORM_LLM_URL,
});

async function generate({
  model = process.env.PLATFORM_LLM_MODEL || "gpt-5-chat-latest",
  messages = [],
}) {
  const {
    choices: [
      {
        message: { content },
      },
    ],
    usage,
  } = await openai.chat.completions.create({
    model,
    messages,
    stream: "false",
    response_format: { type: "json_object" },
  });

  if (usage) {
    const { prompt_tokens, completion_tokens } = usage;
    console.info({ prompt_tokens, completion_tokens });
  }

  if (content) {
    return JSON.parse(content);
  } else {
    throw new Error("OpenAI is not responding");
  }
}

export default { generate };
