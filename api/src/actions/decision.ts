import { generate } from "../lib/llm";

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
    context: context
      ? [{ role: "system" as const, content: context }]
      : [],
    content: `Evaluate this condition based on the context above and return true or false: "${condition}"`,
    json_format: "{ result: <true|false> }",
  });

  const isTrue = result === true || result === "true";
  return isTrue ? trueActions : falseActions;
}

export default { run };
