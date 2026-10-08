import {
  type ActionSelection,
  type Generation,
  type Params,
  type TaskState,
  boundSelection,
  conclude,
  definitionOf,
  fail,
  load,
  matchNode,
  parameterContext,
  prepareParameters,
} from "./common";
import type { ContextMessage } from "../context";
import type { LLMMeta } from "../../../lib/llmLog";
import dataset from "../../../dataset";
import { generate } from "../../../lib/llm";
import { isForcedNode } from "../../../lib/blueprintNodes";

async function scoring({
  context,
  meta,
}: {
  context: ContextMessage[];
  meta?: LLMMeta;
}) {
  const merged: Record<string, unknown> = {};
  for (const { content } of context) {
    if (content && typeof content === "object") {
      Object.assign(merged, content);
    }
  }

  const { knowledge_score } = await generate({
    dataset: dataset.train.knowledgeScore,
    content: merged,
    json_format: "{ knowledge_score: <0.0-1.0> }",
    meta,
  });

  const parsed = parseFloat(String(knowledge_score));
  return !isNaN(parsed) ? parsed : undefined;
}

async function selectAction(state: TaskState): Promise<ActionSelection> {
  const { currentNode, currentTask, context, isBlocking, isLite, meta } = state;

  const bound = boundSelection({ currentNode, isLite });

  if (bound) return bound;

  const nodeAction = currentNode?.properties?.action;

  if (isForcedNode(currentNode) && nodeAction) {
    return { action: nodeAction };
  }

  const [selection, knowledgeScore] = await Promise.all([
    generate({
      dataset: isBlocking
        ? dataset.train.taskDiamondBlocking
        : dataset.train.taskDiamondNonBlocking,
      context,
      content: currentTask,
      json_format: "{ next_step: { action: <ACTION>, comment: <COMMENT> } }",
      meta,
    }).then(
      ({ next_step }) => next_step as { action: string; comment?: string },
    ),
    scoring({ context, meta }),
  ]);

  return { ...selection, knowledgeScore };
}

async function generateParameters({
  action,
  node,
  state,
  previousError,
}: {
  action: string;
  node: any;
  state: TaskState;
  previousError?: string;
}): Promise<Generation> {
  const definition = definitionOf(action);

  if (
    definition &&
    !Object.keys(definition.inputSchema?.properties ?? {}).length
  ) {
    return { parameters: {} };
  }

  const { next_step, result_score } = (await generate({
    dataset: state.isBlocking
      ? dataset.train.forceTaskDiamondBlocking
      : dataset.train.forceTaskDiamondNonBlocking,
    context: parameterContext({ state, node }),
    content: {
      ...state.currentTask,
      forced_action: action,
      ...(previousError && { previous_error: previousError }),
    },
    json_format:
      "{ next_step: { parameters: <PARAMETER>, comment: <COMMENT> }, result_score: <0.0-1.0> }",
    meta: state.meta,
  })) as {
    next_step?: { parameters?: Params; comment?: string };
    result_score?: unknown;
  };

  return {
    parameters: next_step?.parameters ?? {},
    comment: next_step?.comment,
    result_score,
  };
}

async function llmTask({ taskId }: { taskId: string }) {
  const loaded = await load({ taskId });

  if ("result" in loaded) return loaded.result;

  const { state } = loaded;

  const selection = await selectAction(state);
  const matchedNode = matchNode(state, selection.action);

  const prepared = await prepareParameters({
    selection,
    node: matchedNode,
    state,
    generate: (previousError) =>
      generateParameters({
        action: selection.action,
        node: matchedNode,
        state,
        previousError,
      }),
  });

  if (!prepared.ok) {
    return fail(taskId, prepared.error);
  }

  const { result_score } = prepared;

  return conclude({
    state,
    selection,
    matchedNode,
    prepared,
    resultScore:
      result_score != null ? parseFloat(String(result_score)) : undefined,
  });
}

export default llmTask;
