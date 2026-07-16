import { generate } from "../lib/llm";
import type { LLMMeta } from "../lib/llmLog";
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
    meta: { ...meta, source: "action:decision" },
  });

  const isTrue = result === true || result === "true";
  return isTrue ? trueActions : falseActions;
}

export default { run };
