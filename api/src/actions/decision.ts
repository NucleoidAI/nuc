import { generate } from "@canmingir/link-express/llm";
import type { LLMMeta } from "@canmingir/link-express/llm";
import dataset from "../dataset";

async function run({
  context,
  parameters,
  meta,
}: {
  context: string;
  parameters: {
    condition: string;
    true: string[];
    false: string[];
  };
  meta?: LLMMeta;
}) {
  const { condition, true: trueActions, false: falseActions } = parameters;

  const { result } = await generate({
    dataset: dataset.train.decision,
    context: context ? [{ role: "system" as const, content: context }] : [],
    content: { context, condition },
    json_format: "{ result: <true|false> }",
    meta,
  });

  const isTrue = result === true || result === "true";
  return {
    result: isTrue,
    actions: (isTrue ? trueActions : falseActions) ?? [],
  };
}

export default { run };
