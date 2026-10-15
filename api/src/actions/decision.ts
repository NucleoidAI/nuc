import { ask, noul } from "../lib/decision";
import config from "../../config";
import dataset from "../dataset";
import { generate } from "@canmingir/link-express/llm";
import type { LLMMeta } from "@canmingir/link-express/llm";

const TRUE_THRESHOLD = 0.5;

async function evaluate({
  context,
  condition,
  meta,
}: {
  context: string;
  condition: string;
  meta?: LLMMeta;
}) {
  const { condition_holds } = await ask({
    state: { condition, executed_steps: context },
    questions: {
      condition_holds: noul(
        {
          decide: "condition_holds",
          condition: "`condition`",
          evidence: "`executed_steps`",
        },
        { true: { condition: "holds" }, false: { condition: "does_not_hold" } },
      ),
    },
    meta: { ...meta, source: "action.decision" },
  });

  console.debug(
    `[decision] condition "${condition}" holds with ${condition_holds.noul}`,
  );

  return condition_holds.noul >= TRUE_THRESHOLD;
}

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

  let isTrue: boolean;

  if (config.decision?.enabled) {
    isTrue = await evaluate({ context, condition, meta });
  } else {
    const { result } = await generate({
      dataset: dataset.train.decision,
      context: context ? [{ role: "system" as const, content: context }] : [],
      content: { context, condition },
      json_format: "{ result: <true|false> }",
      meta,
    });

    isTrue = result === true || result === "true";
  }

  return {
    result: isTrue,
    actions: (isTrue ? trueActions : falseActions) ?? [],
  };
}

export default { run };
