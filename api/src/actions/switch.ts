import { generate } from "@canmingir/link-express/llm";
import type { LLMMeta } from "@canmingir/link-express/llm";
import dataset from "../dataset";

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

  const { nodeId, reason } = await generate({
    dataset: dataset.train.switch,
    context: context ? [{ role: "system" as const, content: context }] : [],
    content: { context, instructions, cases: options },
    json_format: "{ nodeId: <NODE_ID>, reason: <REASON> }",
    meta,
  });

  const selected = selectCase(options, nodeId, defaultCase);

  return {
    nodeId: selected.nodeId,
    label: selected.label,
    reason: typeof reason === "string" ? reason : undefined,
  };
}

export default { run };
