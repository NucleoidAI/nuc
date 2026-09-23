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
    instructions?: string;
    cases: { nodeId: string; label?: string; description?: string }[];
  };
  meta?: LLMMeta;
}) {
  const { instructions, cases } = parameters;

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

  const selected =
    options.find((option) => option.nodeId === nodeId) ??
    options.find((option) => option.label === nodeId) ??
    options[0];

  return {
    nodeId: selected.nodeId,
    label: selected.label,
    reason: typeof reason === "string" ? reason : undefined,
  };
}

export default { run };
