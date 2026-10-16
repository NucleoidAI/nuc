import {
  type ContextMessage,
  conversations,
  sessionVariables,
  taskContext,
} from "../context";
import {
  conditionBranch,
  findNodeAhead,
  forceAllNodes,
  isForcedNode,
  resolveCurrentNode,
  switchCases,
} from "../../../lib/blueprintNodes";
import {
  endNodeOf,
  omitMissingRequestRefs,
  startNodeOf,
} from "../../../lib/apiNodes";
import {
  getBoundNodeStep,
  getForcedActionContext,
  getLiteNodeStep,
  getParameterGenerationContext,
  mergeNodeParameters,
} from "../../../lib/nodeParameterBindings";
import type { LLMMeta } from "@canmingir/link-express/llm";
import * as pseudocode from "@canmingir/link-express/pseudocode";
import Agent from "../../../models/Agent";
import MCPs from "../../../mcps/mcps";
import actions from "../../../actions";
import agentData from "../../agentData";
import apiSchema from "../../../lib/apiSchema";
import { approvalQuestion } from "../approval";
import blueprintFn from "../../blueprint";
import { resolveParameterRefs } from "../../../lib/parameterRefs";
import session from "../../session";
import stepScoreFn from "../../stepScore";
import taskFn from "../../task";

const MAX_STEPS = 20;
const MAX_PARAMETER_ATTEMPTS = 2;

type Step = Awaited<ReturnType<typeof taskFn.listSteps>>[number];
type CurrentTask = {
  blueprintId: string;
  steps: (Step & { index: number })[];
};
type Params = Record<string, unknown>;

type ActionSelection = {
  action: string;
  comment?: string;
  knowledgeScore?: number;
  resultScore?: number;
  probabilities?: Record<string, number>;
  bound?: boolean;
};

type Generation = {
  parameters: Params;
  comment?: string;
  result_score?: unknown;
};

type TaskState = {
  taskId: string;
  agentId: string;
  sessionId?: string;
  blueprintId?: string;
  description: string;
  inheritedSteps?: Step[] | null;
  steps: Step[];
  currentTask: CurrentTask;
  isBlocking: boolean;
  isLite: boolean;
  nodes: any[];
  currentNode?: any;
  startNode?: any;
  endNode?: any;
  variables: Record<string, unknown>;
  taskData: Awaited<ReturnType<typeof taskContext>>;
  history: ContextMessage[];
  context: ContextMessage[];
  refSource: { steps: Step[] } & Record<string, unknown>;
  meta: LLMMeta;
};

function fail(taskId: string, comment: string) {
  return taskFn.update({ taskId, status: "FAILED", comment });
}

async function finish({
  taskId,
  description,
  blueprintId,
  result,
  output,
  comment,
}: {
  taskId: string;
  description: string;
  blueprintId?: string;
  result?: string;
  output?: string;
  comment?: string;
}) {
  await stepScoreFn.create({
    taskId,
    parameters: { description, blueprintId },
    output,
    status: "COMPLETED",
  });

  return taskFn.update({ taskId, result, comment, status: "COMPLETED" });
}

function definitionOf(action?: string) {
  if (!action) return undefined;

  return MCPs.find((mcp) => mcp.action === action) ?? actions.find(action);
}

function boundSelection({
  currentNode,
  isLite,
}: {
  currentNode: any;
  isLite: boolean;
}): ActionSelection | undefined {
  const inputSchema = definitionOf(
    currentNode?.properties?.action,
  )?.inputSchema;

  const boundStep =
    getBoundNodeStep({ node: currentNode, inputSchema }) ??
    (isLite ? getLiteNodeStep({ node: currentNode, inputSchema }) : undefined);

  if (!boundStep) return undefined;

  return {
    action: boundStep.next_step.action,
    comment: boundStep.next_step.comment,
    bound: true,
  };
}

function parameterContext({
  state,
  node,
}: {
  state: TaskState;
  node: any;
}): ContextMessage[] {
  const { context, currentNode } = state;

  return getParameterGenerationContext({
    context: isForcedNode(currentNode)
      ? getForcedActionContext({
          context,
          action: currentNode?.properties?.action,
        })
      : context,
    node,
  });
}

function matchNode(state: TaskState, action: string) {
  const { nodes, currentNode } = state;

  if (!currentNode) return undefined;

  return findNodeAhead(
    nodes,
    currentNode,
    (node) =>
      node.properties?.action === action ||
      (node === currentNode && !node.properties?.action),
  );
}

function refError(err: unknown, steps: Step[]) {
  const message =
    err instanceof Error
      ? err.message
      : "Failed to resolve parameter references";
  const available = steps.length
    ? `Available step indexes are 0-${steps.length - 1}.`
    : "There are no previous steps to reference.";

  return `${message}. ${available} Use the index field of a step and only reference result fields that exist.`;
}

async function prepareParameters({
  selection,
  node,
  state,
  generate,
}: {
  selection: ActionSelection;
  node: any;
  state: TaskState;
  generate: (previousError?: string) => Promise<Generation>;
}) {
  let previousError: string | undefined;

  for (let attempt = 1; ; attempt++) {
    const generation: Generation = selection.bound
      ? { parameters: {} }
      : await generate(previousError);

    const parameters: Params = omitMissingRequestRefs({
      parameters: mergeNodeParameters({
        node,
        action: selection.action,
        generated: generation.parameters,
      }),
      start: state.startNode,
      steps: state.steps,
    });

    try {
      return {
        ok: true as const,
        ...generation,
        parameters,
        resolvedParameters: resolveParameterRefs(parameters, state.refSource),
      };
    } catch (err) {
      const error = refError(err, state.steps);

      if (selection.bound || attempt >= MAX_PARAMETER_ATTEMPTS) {
        return { ok: false as const, error };
      }

      previousError = error;
    }
  }
}

type Prepared = Extract<
  Awaited<ReturnType<typeof prepareParameters>>,
  { ok: true }
>;

function platformParameters({
  action,
  parameters,
  node,
  state,
}: {
  action: string;
  parameters: Params;
  node: any;
  state: TaskState;
}): Params {
  const { nodes, taskId, blueprintId, sessionId, agentId } = state;

  switch (action) {
    case "PLATFORM:user_interaction":
    case "PLATFORM:ask_supervisor":
      return { ...parameters, taskId, blueprintId, sessionId, agentId };

    case "PLATFORM:message_user":
      return { ...parameters, sessionId, agentId };

    case "PLATFORM:customer_approval":
      return {
        ...parameters,
        question: parameters.question ?? node?.properties?.question,
        sessionId,
        agentId,
      };

    case "PLATFORM:switch":
      if (node?.type !== "SWITCH") return parameters;

      return {
        ...parameters,
        cases: switchCases(node, nodes),
        defaultCase: node.properties?.defaultCase,
        instructions:
          pseudocode.or(node, node.properties?.instructions) ||
          parameters.instructions,
      };

    case "PLATFORM:decision":
      if (node?.type !== "CONDITION") return parameters;

      return {
        ...parameters,
        condition:
          pseudocode.or(node, node.properties?.instructions?.trim()) ||
          parameters.condition,
        true: conditionBranch(node.true, nodes),
        false: conditionBranch(node.false, nodes),
      };

    default:
      return parameters;
  }
}

async function complete(state: TaskState, comment?: string) {
  const { taskId, agentId, sessionId, description, blueprintId, steps } = state;
  const result = steps[steps.length - 1]?.result ?? undefined;

  if (sessionId) {
    await session.addConversation({
      sessionId,
      agentId,
      role: "ASSISTANT",
      content: comment || "Task has been completed.",
    });
  }

  return finish({
    taskId,
    description,
    blueprintId,
    result,
    output: result ?? comment,
    comment,
  });
}

async function respond(state: TaskState, node: any) {
  const {
    taskId,
    agentId,
    sessionId,
    description,
    blueprintId,
    startNode,
    refSource,
  } = state;

  let result: string;

  try {
    const values = resolveParameterRefs(
      omitMissingRequestRefs({
        parameters: node.properties?.parameters ?? {},
        start: startNode,
        steps: refSource.steps,
      }),
      refSource,
    );
    const response = apiSchema.validate(node.properties?.fields ?? [], values, {
      strict: false,
    });

    if (!response.success) {
      throw new Error(
        `Response does not match the response schema: ${response.issues
          .map(({ path, message }) => `${path || "(root)"}: ${message}`)
          .join("; ")}`,
      );
    }

    result = JSON.stringify(response.data);
  } catch (err) {
    return fail(
      taskId,
      err instanceof Error ? err.message : "Failed to build the API response",
    );
  }

  if (sessionId) {
    await session.addConversation({
      sessionId,
      agentId,
      role: "ASSISTANT",
      content: "Task has been completed.",
    });
  }

  return finish({
    taskId,
    description,
    blueprintId,
    result,
    output: result,
    comment: "Responded with the API response.",
  });
}

async function handoff(state: TaskState, parameters: Params, comment?: string) {
  const { taskId, agentId, sessionId, description, blueprintId, steps } = state;
  const { targetAgentId, targetBlueprintId, context } = parameters as {
    targetAgentId: string;
    targetBlueprintId?: string;
    context: string;
  };

  if (targetAgentId === agentId) {
    return fail(
      taskId,
      "Self-handoff detected: agent attempted to hand off to itself. Follow the assigned blueprint instead.",
    );
  }

  const [targetAgent, targetBlueprint] = await Promise.all([
    Agent.findByPk(targetAgentId),
    targetBlueprintId
      ? blueprintFn.get({ blueprintId: targetBlueprintId }).catch(() => null)
      : null,
  ]);

  if (!targetAgent || (targetBlueprintId && !targetBlueprint)) {
    return fail(
      taskId,
      `Handoff target does not exist: agent ${targetAgentId}${
        targetBlueprintId ? `, blueprint ${targetBlueprintId}` : ""
      }. Use an agent and blueprint id that exist on this team.`,
    );
  }

  await taskFn.create({
    agentId: targetAgentId,
    description: context,
    blueprintId: targetBlueprintId,
    sessionId,
    inheritedSteps: steps.map(
      ({ action, status, parameters, result, comment }) => ({
        action,
        status,
        parameters,
        result,
        comment,
      }),
    ),
  });

  const result = `Handed off to agent ${targetAgentId}`;

  return finish({
    taskId,
    description,
    blueprintId,
    result,
    output: result,
    comment,
  });
}

async function conclude({
  state,
  selection,
  matchedNode,
  prepared,
  resultScore,
}: {
  state: TaskState;
  selection: ActionSelection;
  matchedNode: any;
  prepared: Prepared;
  resultScore?: number;
}) {
  const { action } = selection;
  const { parameters, resolvedParameters } = prepared;
  const comment =
    selection.comment || prepared.comment || `Executing ${action}.`;

  if (action === "PLATFORM:complete" && state.endNode) {
    return respond(state, state.endNode);
  }

  if (action === "PLATFORM:complete") {
    return complete(state, comment);
  }

  if (action === "PLATFORM:handoff") {
    return handoff(state, resolvedParameters, comment);
  }

  return taskFn.addStep({
    taskId: state.taskId,
    action,
    parameters: platformParameters({
      action,
      parameters,
      node: matchedNode,
      state,
    }),
    comment,
    knowledgeScore: selection.knowledgeScore,
    resultScore,
    nodeId: matchedNode?.id ?? null,
  });
}

async function load({
  taskId,
}: {
  taskId: string;
}): Promise<{ state: TaskState } | { result: unknown }> {
  const {
    agentId,
    description,
    sessionId,
    blueprintId,
    status,
    inheritedSteps,
  } = await taskFn.get({ taskId });

  if (status !== "IN_PROGRESS") return { result: undefined };

  const steps = await taskFn.listSteps({ taskId });
  const currentTask: CurrentTask = {
    blueprintId,
    steps: steps.map((step, index) => ({ index, ...step })),
  };

  if (steps.some((step) => step.status === "WAITING_FOR_APPROVAL")) {
    return { result: undefined };
  }

  //TODO: Loop detection
  if (steps.length > MAX_STEPS) {
    return { result: await fail(taskId, "Failed due to too many steps") };
  }

  const [agentInstance, blueprint, variables] = await Promise.all([
    agentId ? agentData.get({ agentId }) : null,
    blueprintId ? blueprintFn.get({ blueprintId }) : null,
    sessionId ? sessionVariables({ sessionId }) : {},
  ]);

  const isBlocking = blueprint?.blocking !== false;
  const isLite = blueprint?.executionMode === "LITE";
  const nodes: any[] = isLite
    ? forceAllNodes(blueprint?.nodes ?? [])
    : blueprint?.nodes ?? [];
  const meta: LLMMeta = { agentId, sessionId, taskId };

  const [taskData, history] = await Promise.all([
    taskContext({
      agentId,
      teamId: agentInstance?.teamId,
      blueprintId,
      inheritedSteps,
      variables,
      isBlocking,
    }),
    sessionId ? conversations({ sessionId }) : [],
  ]);

  const context: ContextMessage[] = [
    { role: "system", content: taskData },
    ...history,
  ];

  const passedStatuses =
    isLite && !isBlocking
      ? ["COMPLETED", "WAITING_FOR_USER", "FAILED"]
      : ["COMPLETED", "WAITING_FOR_USER"];

  const completedSteps = steps.filter((s) => passedStatuses.includes(s.status));

  const currentNode = nodes.length
    ? resolveCurrentNode(nodes, completedSteps)
    : undefined;

  const refSource = {
    steps,
    inherited_steps: inheritedSteps ?? [],
    session_variables: variables,
    byNode: Object.fromEntries(
      steps.filter((s) => s.nodeId).map((s) => [s.nodeId, s]),
    ),
  };

  const state: TaskState = {
    taskId,
    agentId,
    sessionId,
    blueprintId,
    description,
    inheritedSteps,
    steps,
    currentTask,
    isBlocking,
    isLite,
    nodes,
    currentNode,
    startNode: startNodeOf(nodes),
    endNode: endNodeOf(nodes),
    variables,
    taskData,
    history,
    context,
    refSource,
    meta,
  };

  if (currentNode?.type === "END") {
    return { result: await respond(state, currentNode) };
  }

  if (currentNode?.type === "APPROVAL" && isForcedNode(currentNode)) {
    const question =
      currentNode.properties?.question ||
      (await approvalQuestion({
        instructions: currentNode.properties?.instructions,
        label: currentNode.properties?.label,
        context,
        content: currentTask,
        meta,
      }));

    return {
      result: await taskFn.addStep({
        taskId,
        action: "PLATFORM:customer_approval",
        parameters: { question, sessionId, agentId },
        comment: "Waiting for the customer to approve or reject.",
        nodeId: currentNode.id,
      }),
    };
  }

  return { state };
}

export type {
  ActionSelection,
  CurrentTask,
  Generation,
  Params,
  Step,
  TaskState,
};
export {
  boundSelection,
  conclude,
  definitionOf,
  fail,
  load,
  matchNode,
  parameterContext,
  prepareParameters,
};
