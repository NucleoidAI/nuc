import { ask, choice } from "../lib/decision";
import config from "../../config";
import dataset from "../dataset";
import { generate } from "@canmingir/link-express/llm";
import type { LLMMeta } from "@canmingir/link-express/llm";

type Case = { nodeId: string; label?: string; description?: string };

const normalize = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

export function selectCase(
  options: Case[],
  answer: unknown,
  defaultCase?: string,
) {
  const wanted = normalize(answer);

  const matched = wanted
    ? options.find((option) => normalize(option.nodeId) === wanted) ??
      options.find((option) => normalize(option.label) === wanted)
    : undefined;

  if (matched) return matched;

  const fallback = defaultCase
    ? options.find((option) => option.nodeId === defaultCase)
    : undefined;

  if (fallback) return fallback;

  throw new Error(
    `SWITCH_INVALID_CASE: model returned ${JSON.stringify(
      answer,
    )}, expected one of ${options.map((option) => option.nodeId).join(", ")}`,
  );
}

type Pick = {
  context: string;
  instructions?: string;
  options: Case[];
  meta?: LLMMeta;
};

async function pick({ context, instructions, options, meta }: Pick) {
  const { selected_case } = await ask({
    state: { instructions: instructions ?? null, executed_steps: context },
    questions: {
      selected_case: choice(
        {
          select: "selected_case",
          instructions: "`instructions`",
          evidence: "`executed_steps`",
        },
        Object.fromEntries(
          options.map(({ nodeId, label, description }) => [
            nodeId,
            { label: label ?? null, description: description ?? null },
          ]),
        ),
      ),
    },
    meta: { ...meta, source: "action.switch" },
  });

  console.debug(
    `[decision] switch selected ${selected_case.choice}:`,
    JSON.stringify(selected_case.probabilities),
  );

  return selected_case.choice;
}

async function run({
  context,
  parameters,
  meta,
}: {
  context: string;
  parameters: {
    instructions?: string;
    cases: Case[];
    defaultCase?: string;
  };
  meta?: LLMMeta;
}) {
  const { instructions, cases, defaultCase } = parameters;

  const options = (cases ?? []).filter((option) => option?.nodeId);

  if (!options.length) {
    throw new Error("SWITCH_NODE_HAS_NO_CASES");
  }

  let nodeId: unknown;
  let reason: string | undefined;

  if (config.decision?.enabled) {
    nodeId = await pick({ context, instructions, options, meta });
  } else {
    const response = await generate({
      dataset: dataset.train.switch,
      context: context ? [{ role: "system" as const, content: context }] : [],
      content: { context, instructions, cases: options },
      json_format: "{ nodeId: <NODE_ID>, reason: <REASON> }",
      meta,
    });

    nodeId = response.nodeId;
    reason = typeof response.reason === "string" ? response.reason : undefined;
  }

  const selected = selectCase(options, nodeId, defaultCase);

  return {
    nodeId: selected.nodeId,
    label: selected.label,
    ...(reason && { reason }),
  };
}

export default { run };
