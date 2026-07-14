import { generate } from "../lib/llm";

async function run({ context, parameters: { message } }) {
  const { result } = await generate({
    context: context ? [{ role: "assistant" as const, content: context }] : [],
    content: message,
    json_format: "{ result: <RESULT_IN_NLP> }",
  });

  return result;
}

export default { run };
