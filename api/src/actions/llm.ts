let llm;

if (process.env.PLATFORM_LLM === "OPENAI") {
  llm = require("../lib/openai").default;
}

if (process.env.PLATFORM_LLM === "AZURE") {
  llm = require("../lib/azure").default;
}

if (process.env.PLATFORM_LLM === "ANTHROPIC") {
  llm = require("../lib/anthropic").default;
}

async function run({ context, parameters: { message } }) {
  const { result } = await llm.generate({
    messages: [
      {
        role: "ASSISTANT",
        content: JSON.stringify(context),
      },
      {
        role: "ASSISTANT",
        content: JSON.stringify(message),
      },
      {
        role: "SYSTEM",
        content: "json_format: { result: <RESULT_IN_NLP> }",
      },
    ],
  });

  return result;
}

export default { run };
