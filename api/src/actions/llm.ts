import { generate } from "@canmingir/link-express/llm";
import type { LLMMeta } from "@canmingir/link-express/llm";

async function run({
  context,
  parameters: { message },
  meta,
}: {
  context?: string;
  parameters: { message: string };
  meta?: LLMMeta;
}) {
  const { result } = await generate({
    context: context ? [{ role: "assistant" as const, content: context }] : [],
    content: message,
    json_format: "{ result: <RESULT_IN_NLP> }",
    meta,
  });

  return result;
}

export default { run };
