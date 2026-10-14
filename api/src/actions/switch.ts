import { ask, choice } from "../lib/decision";
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

  const nodeId = await pick({
    context,
    instructions,
    options,
    meta,
  });

  const selected = selectCase(options, nodeId, defaultCase);

  return {
    nodeId: selected.nodeId,
    label: selected.label,
  };
}

export default { run };
