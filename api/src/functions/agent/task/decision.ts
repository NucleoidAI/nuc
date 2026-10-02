import {
  type ActionSelection,
  type Generation,
  type Params,
  type Step,
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
import {
  type Definition,
  judgeParameters,
  selectNextAction,
} from "../judgments";
import dataset from "../../../dataset";
import { generate } from "../../../lib/llm";
import { isForcedNode } from "../../../lib/blueprintNodes";

const MIN_INPUTS_AVAILABLE = 0.5;
const SUPERVISOR_ACTION = "PLATFORM:ask_supervisor";

function decisionStateOf(state: TaskState) {
  const { taskData, currentNode, currentTask, inheritedSteps, variables } =
    state;

  return {
    selected_blueprint: taskData.selected_blueprint,
    ...(currentNode && {
      current_node: {
        id: currentNode.id,
        type: currentNode.type,
        action: currentNode.properties?.action ?? null,
      },
    }),
    steps: currentTask.steps.map(
      ({ index, action, status, parameters, result, comment }) => ({
        index,
        action,
        status,
        parameters,
        result,
        comment,
      })
    ),
    knowledge_base: taskData.knowledge_base,
    ...(inheritedSteps?.length && { inherited_context_steps: inheritedSteps }),
    ...(Object.keys(variables).length && { session_variables: variables }),
    conversation: state.history,
  };
}

async function selectAction({
  state,
  decisionState,
  options,
}: {
  state: TaskState;
  decisionState: object;
  options: Definition[];
}): Promise<ActionSelection> {
  const { currentNode, isLite, meta } = state;

  const bound = boundSelection({ currentNode, isLite });

  if (bound) return bound;

  const selection = await selectNextAction({
    state: decisionState,
    options,
    meta,
  });

  const { probabilities } = selection;
  const nodeAction = currentNode?.properties?.action;

  if (isForcedNode(currentNode) && nodeAction) {
    return {
      action: nodeAction,
      resultScore: probabilities[nodeAction],
      probabilities,
    };
  }

  const { action } = selection;

  return { action, resultScore: probabilities[action], probabilities };
}

async function generateParameters({
  action,
  node,
  state,
  previousError,
  escalatedFrom,
}: {
  action: string;
  node: any;
  state: TaskState;
  previousError?: string;
  escalatedFrom?: object;
}): Promise<Generation> {
  const { next_step } = (await generate({
    dataset: state.isBlocking
      ? dataset.train.forceTaskDiamondBlocking
      : dataset.train.forceTaskDiamondNonBlocking,
    context: parameterContext({ state, node }),
    content: {
      ...state.currentTask,
      forced_action: action,
      ...(escalatedFrom && { escalated_from: escalatedFrom }),
      ...(previousError && { previous_error: previousError }),
    },
    json_format:
      "{ next_step: { parameters: <PARAMETER>, comment: <COMMENT> } }",
    meta: state.meta,
  })) as {
    next_step?: { parameters?: Params; comment?: string };
  };

  return {
    parameters: next_step?.parameters ?? {},
    comment: next_step?.comment,
  };
}

async function plan({
  state,
  decisionState,
  selection,
  escalatedFrom,
}: {
  state: TaskState;
  decisionState: object;
  selection: ActionSelection;
  escalatedFrom?: object;
}) {
  const matchedNode = matchNode(state, selection.action);

  const judgment =
    selection.bound || escalatedFrom
      ? Promise.resolve({ filled: {}, inputsAvailable: undefined })
      : judgeParameters({
          action: selection.action,
          definition: definitionOf(selection.action) as Definition | undefined,
          skipFields: Object.keys(matchedNode?.properties?.parameters ?? {}),
          state: decisionState,
          steps: state.steps,
          inheritedSteps: (state.inheritedSteps ?? []) as Step[],
          variables: state.variables,
          meta: state.meta,
        });

  const judged = judgment.then(({ filled }) => filled as Params);

  const prepared = await prepareParameters({
    selection,
    node: matchedNode,
    state,
    generate: async (previousError) => {
      const [generation, judgedParameters] = await Promise.all([
        generateParameters({
          action: selection.action,
          node: matchedNode,
          state,
          previousError,
          escalatedFrom,
        }),
        judged,
      ]);

      return {
        ...generation,
        parameters: { ...generation.parameters, ...judgedParameters },
      };
    },
  });

  return {
    matchedNode,
    prepared,
    inputsAvailable: (await judgment).inputsAvailable,
  };
}

async function decisionTask({ taskId }: { taskId: string }) {
  const loaded = await load({ taskId });

  if ("result" in loaded) return loaded.result;

  const { state } = loaded;
  const decisionState = decisionStateOf(state);
  const options = [
    ...state.taskData.actions,
    ...state.taskData.mcp_tools,
  ] as Definition[];

  let selection = await selectAction({ state, decisionState, options });

  const initial = await plan({ state, decisionState, selection });
  const { inputsAvailable } = initial;
  let { matchedNode, prepared } = initial;

  if (
    inputsAvailable !== undefined &&
    inputsAvailable < MIN_INPUTS_AVAILABLE &&
    selection.action !== SUPERVISOR_ACTION
  ) {
    const canEscalate = options.some(
      ({ action }) => action === SUPERVISOR_ACTION
    );

    console.debug(
      `[jev] inputs for ${
        selection.action
      } available with ${inputsAvailable} < ${MIN_INPUTS_AVAILABLE}; ${
        canEscalate
          ? `escalating to ${SUPERVISOR_ACTION}`
          : "supervisor not available, keeping selection"
      }`
    );

    if (canEscalate) {
      const escalatedFrom = { action: selection.action, inputs: "missing" };

      selection = {
        action: SUPERVISOR_ACTION,
        resultScore: selection.probabilities?.[SUPERVISOR_ACTION],
        probabilities: selection.probabilities,
      };

      ({ matchedNode, prepared } = await plan({
        state,
        decisionState,
        selection,
        escalatedFrom,
      }));
    }
  }

  if (!prepared.ok) {
    return fail(taskId, prepared.error);
  }

  return conclude({
    state,
    selection,
    matchedNode,
    prepared,
    resultScore: selection.resultScore,
  });
}

export default decisionTask;
