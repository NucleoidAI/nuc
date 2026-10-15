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
import { generate } from "@canmingir/link-express/llm";
import { isForcedNode } from "../../../lib/blueprintNodes";

const MIN_INPUTS_AVAILABLE = 0.5;
const SUPERVISOR_ACTION = "PLATFORM:ask_supervisor";
const NODE_FILLED_FIELDS: Record<string, { type: string; fields: string[] }> = {
  "PLATFORM:decision": {
    type: "CONDITION",
    fields: ["condition", "true", "false"],
  },
  "PLATFORM:switch": {
    type: "SWITCH",
    fields: ["cases", "defaultCase", "instructions"],
  },
  "PLATFORM:handoff": {
    type: "HANDOFF",
    fields: ["targetAgentId", "targetBlueprintId"],
  },
};

function nodeFilledFields(action: string, node: any) {
  const filled = NODE_FILLED_FIELDS[action];

  return [
    ...Object.keys(node?.properties?.parameters ?? {}),
    ...(filled && node?.type === filled.type ? filled.fields : []),
  ];
}

function decisionStateOf(state: TaskState) {
  const { taskData, currentNode, currentTask, inheritedSteps, variables } =
    state;

  return {
    blueprint: taskData.blueprint,
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
      }),
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

  const { action, confidence } = selection;

  return { action, resultScore: confidence, probabilities };
}

function decisionComment(decided: Params) {
  const parts = Object.entries(decided).map(([field, value]) => {
    const ref = (value as { $ref?: string } | null)?.$ref;

    return ref
      ? `Parameter ${field} resolved from ${ref}.`
      : `Parameter ${field} set to ${JSON.stringify(value)}.`;
  });

  return parts.length ? parts.join(" ") : undefined;
}

function parameterFormat(fields?: string[]) {
  if (!fields) return "<PARAMETER>";

  return `{ ${fields
    .map((field) => `${field}: <${field.toUpperCase()}>`)
    .join(", ")} }`;
}

async function generateParameters({
  action,
  node,
  state,
  fields,
  decided,
  previousError,
  escalatedFrom,
}: {
  action: string;
  node: any;
  state: TaskState;
  fields?: string[];
  decided?: Params;
  previousError?: string;
  escalatedFrom?: object;
}): Promise<Generation> {
  if (fields && !fields.length) return { parameters: {} };

  const { next_step } = (await generate({
    dataset: state.isBlocking
      ? dataset.train.forceTaskDiamondBlocking
      : dataset.train.forceTaskDiamondNonBlocking,
    context: parameterContext({ state, node }),
    content: {
      ...state.currentTask,
      forced_action: action,
      ...(fields && { generate_parameters: fields }),
      ...(decided &&
        Object.keys(decided).length && { decided_parameters: decided }),
      ...(escalatedFrom && { escalated_from: escalatedFrom }),
      ...(previousError && { previous_error: previousError }),
    },
    json_format: `{ next_step: { parameters: ${parameterFormat(
      fields,
    )}, comment: <COMMENT> } }`,
    meta: state.meta,
  })) as {
    next_step?: { parameters?: Params; comment?: string };
  };

  const parameters = next_step?.parameters ?? {};

  return {
    parameters: fields
      ? Object.fromEntries(
          Object.entries(parameters).filter(([field]) =>
            fields.includes(field),
          ),
        )
      : parameters,
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
  const definition = definitionOf(selection.action) as Definition | undefined;

  const judgment =
    selection.bound || escalatedFrom || !definition
      ? undefined
      : await judgeParameters({
          action: selection.action,
          definition,
          skipFields: nodeFilledFields(selection.action, matchedNode),
          state: decisionState,
          steps: state.steps,
          inheritedSteps: (state.inheritedSteps ?? []) as Step[],
          variables: state.variables,
          meta: state.meta,
        });

  const decided = (judgment?.filled ?? {}) as Params;

  const prepared = await prepareParameters({
    selection,
    node: matchedNode,
    state,
    generate: async (previousError) => {
      const generation = await generateParameters({
        action: selection.action,
        node: matchedNode,
        state,
        fields: judgment?.generate,
        decided,
        previousError,
        escalatedFrom,
      });

      return {
        ...generation,
        comment: generation.comment || decisionComment(decided),
        parameters: { ...decided, ...generation.parameters },
      };
    },
  });

  return {
    matchedNode,
    prepared,
    inputsAvailable: judgment?.inputsAvailable,
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
      ({ action }) => action === SUPERVISOR_ACTION,
    );

    console.debug(
      `[jev] inputs for ${
        selection.action
      } available with ${inputsAvailable} < ${MIN_INPUTS_AVAILABLE}; ${
        canEscalate
          ? `escalating to ${SUPERVISOR_ACTION}`
          : "supervisor not available, keeping selection"
      }`,
    );

    if (canEscalate) {
      const escalatedFrom = { action: selection.action, inputs: "missing" };

      selection = {
        action: SUPERVISOR_ACTION,
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
