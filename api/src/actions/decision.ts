import { generate } from "../lib/llm";
import dataset from "../dataset";

async function run({
  context,
  parameters,
}: {
  context: string;
  parameters: {
    condition: string;
    true: string[];
    false: string[];
  };
}) {
  const { condition, true: trueActions, false: falseActions } = parameters;

  const { result } = await generate({
    dataset: dataset.train.decision,
    context: context ? [{ role: "system" as const, content: context }] : [],
    content: { context, condition },
    json_format: "{ result: <true|false> }",
  });

  const isTrue = result === true || result === "true";
  return isTrue ? trueActions : falseActions;
}

export default { run };
