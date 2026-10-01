import {
  conditionBranch,
  findNodeAhead,
  isForcedNode,
  resolveCurrentNode,
  switchCases,
} from "../../lib/blueprintNodes";
import {
  getBoundNodeStep,
  getParameterGenerationContext,
  mergeNodeParameters,
} from "../../lib/nodeParameterBindings";
import { type ContextMessage, conversations, taskContext } from "./context";
import type { LLMMeta } from "../../lib/llmLog";
import Agent from "../../models/Agent";
import MCPs from "../../mcps/mcps";
import actions from "../../actions";
import agentData from "../agentData";
import { approvalQuestion } from "./approval";
import blueprintFn from "../blueprint";
import dataset from "../../dataset";
import platform from "@canmingir/link-express";
import { generate } from "../../lib/llm";
import { resolveParameterRefs } from "../../lib/parameterRefs";
import session from "../session";
import stepScoreFn from "../stepScore";
import taskFn from "../task";

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
  bound?: boolean;
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

function definitionOf(action?: string) {
  if (!action) return undefined;

  return MCPs.find((mcp) => mcp.action === action) ?? actions.find(action);
}

async function selectAction({
  currentNode,
  currentTask,
  context,
  isBlocking,
  meta,
}: {
  currentNode: any;
  currentTask: CurrentTask;
  context: ContextMessage[];
  isBlocking: boolean;
  meta: LLMMeta;
}): Promise<ActionSelection> {
  const nodeAction = currentNode?.properties?.action;

  const boundStep = getBoundNodeStep({
    node: currentNode,
    inputSchema: definitionOf(nodeAction)?.inputSchema,
  });

  if (boundStep) {
    return {
      action: boundStep.next_step.action,
      comment: boundStep.next_step.comment,
      bound: true,
    };
  }

  const [selection, knowledgeScore] = await Promise.all([
    isForcedNode(currentNode) && nodeAction
      ? { action: nodeAction }
      : generate({
          dataset: isBlocking
            ? dataset.train.taskDiamondBlocking
            : dataset.train.taskDiamondNonBlocking,
          context,
          content: currentTask,
          json_format:
            "{ next_step: { action: <ACTION>, comment: <COMMENT> } }",
          meta,
        }).then(
          ({ next_step }) => next_step as { action: string; comment?: string }
        ),
    scoring({ context, meta }),
  ]);

  return { ...selection, knowledgeScore };
}

async function generateParameters({
  action,
  node,
  currentTask,
  context,
  isBlocking,
  meta,
  previousError,
}: {
  action: string;
  node: any;
  currentTask: CurrentTask;
  context: ContextMessage[];
  isBlocking: boolean;
  meta: LLMMeta;
  previousError?: string;
}): Promise<{ parameters: Params; comment?: string; result_score?: unknown }> {
  const definition = definitionOf(action);

  if (
    definition &&
    !Object.keys(definition.inputSchema?.properties ?? {}).length
  ) {
    return { parameters: {} };
  }

  const { next_step, result_score } = (await generate({
    dataset: isBlocking
      ? dataset.train.forceTaskDiamondBlocking
      : dataset.train.forceTaskDiamondNonBlocking,
    context: getParameterGenerationContext({ context, node }),
    content: {
      ...currentTask,
      forced_action: action,
      ...(previousError && { previous_error: previousError }),
    },
    json_format:
      "{ next_step: { parameters: <PARAMETER>, comment: <COMMENT> }, result_score: <0.0-1.0> }",
    meta,
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
  currentTask,
  context,
  isBlocking,
  meta,
  refSource,
}: {
  selection: ActionSelection;
  node: any;
  currentTask: CurrentTask;
  context: ContextMessage[];
  isBlocking: boolean;
  meta: LLMMeta;
  refSource: Record<string, unknown>;
}) {
  let previousError: string | undefined;

  for (let attempt = 1; ; attempt++) {
    const generation = selection.bound
      ? { parameters: {} }
      : await generateParameters({
          action: selection.action,
          node,
          currentTask,
          context,
          isBlocking,
          meta,
          previousError,
        });

    const parameters: Params = mergeNodeParameters({
      node,
      action: selection.action,
      generated: generation.parameters,
    });

    try {
      return {
        ok: true as const,
        ...generation,
        parameters,
        resolvedParameters: resolveParameterRefs(parameters, refSource),
      };
    } catch (err) {
      const error = refError(err, currentTask.steps);

      if (selection.bound || attempt >= MAX_PARAMETER_ATTEMPTS) {
        return { ok: false as const, error };
      }

      previousError = error;
    }
  }
}

function pseudocodeOr(node: any, fallback: unknown) {
  return (
    (node.properties?.pseudocodeEnabled && node.properties?.pseudocode) ||
    fallback
  );
}

function platformParameters({
  action,
  parameters,
  node,
  nodes,
  taskId,
  blueprintId,
  sessionId,
  agentId,
}: {
  action: string;
  parameters: Params;
  node: any;
  nodes: any[];
  taskId: string;
  blueprintId?: string;
  sessionId?: string;
  agentId: string;
}): Params {
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
          pseudocodeOr(node, node.properties?.instructions) ||
          parameters.instructions,
      };

    case "PLATFORM:decision":
      if (node?.type !== "CONDITION") return parameters;

      return {
        ...parameters,
        condition:
          pseudocodeOr(node, node.properties?.instructions?.trim()) ||
          parameters.condition,
        true: conditionBranch(node.true, nodes),
        false: conditionBranch(node.false, nodes),
      };

    default:
      return parameters;
  }
}

async function complete({
  taskId,
  agentId,
  sessionId,
  description,
  blueprintId,
  steps,
  comment,
}: {
  taskId: string;
  agentId: string;
  sessionId?: string;
  description: string;
  blueprintId?: string;
  steps: Step[];
  comment?: string;
}) {
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

async function handoff({
  taskId,
  agentId,
  sessionId,
  description,
  blueprintId,
  steps,
  comment,
  parameters,
}: {
  taskId: string;
  agentId: string;
  sessionId?: string;
  description: string;
  blueprintId?: string;
  steps: Step[];
  comment?: string;
  parameters: Params;
}) {
  const { targetAgentId, targetBlueprintId, context } = parameters as {
    targetAgentId: string;
    targetBlueprintId?: string;
    context: string;
  };

  if (targetAgentId === agentId) {
    return fail(
      taskId,
      "Self-handoff detected: agent attempted to hand off to itself. Follow the assigned blueprint instead."
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
      }. Use an agent and blueprint id that exist on this team.`
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
      })
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

async function runTask({ taskId }: { taskId: string }) {
  const { agentId, sessionId, blueprintId, status, inheritedSteps } =
    await taskFn.get({ taskId });

  if (status !== "IN_PROGRESS") return;

  const steps = await taskFn.listSteps({ taskId });
  const currentTask: CurrentTask = {
    blueprintId,
    steps: steps.map((step, index) => ({ index, ...step })),
  };

  if (steps.some((step) => step.status === "WAITING_FOR_APPROVAL")) return;

  //TODO: Loop detection
  if (steps.length > MAX_STEPS) {
    return fail(taskId, "Failed due to too many steps");
  }

  const [agentInstance, blueprint] = await Promise.all([
    agentId ? agentData.get({ agentId }) : null,
    blueprintId ? blueprintFn.get({ blueprintId }) : null,
  ]);

  const isBlocking = blueprint?.blocking !== false;
  const nodes = blueprint?.nodes ?? [];
  const meta: LLMMeta = { agentId, sessionId, taskId };

  const [taskData, history] = await Promise.all([
    taskContext({
      agentId,
      teamId: agentInstance?.teamId,
      blueprintId,
      inheritedSteps,
      isBlocking,
    }),
    sessionId ? conversations({ sessionId }) : [],
  ]);

  const context: ContextMessage[] = [
    { role: "system", content: taskData },
    ...history,
  ];

  const completedSteps = steps.filter((s) =>
    ["COMPLETED", "WAITING_FOR_USER"].includes(s.status)
  );

  const currentNode = nodes.length
    ? resolveCurrentNode(nodes, completedSteps)
    : undefined;

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

    return taskFn.addStep({
      taskId,
      action: "PLATFORM:customer_approval",
      parameters: { question, sessionId, agentId },
      comment: "Waiting for the customer to approve or reject.",
      nodeId: currentNode.id,
    });
  }

  const selection = await selectAction({
    currentNode,
    currentTask,
    context,
    isBlocking,
    meta,
  });

  const { action, knowledgeScore } = selection;

  const matchedNode = currentNode
    ? findNodeAhead(
        nodes,
        currentNode,
        (node) =>
          node.properties?.action === action ||
          (node === currentNode && !node.properties?.action)
      )
    : undefined;

  const prepared = await prepareParameters({
    selection,
    node: matchedNode,
    currentTask,
    context,
    isBlocking,
    meta,
    refSource: {
      steps,
      inherited_steps: inheritedSteps ?? [],
      byNode: Object.fromEntries(
        steps.filter((s) => s.nodeId).map((s) => [s.nodeId, s])
      ),
    },
  });

  if (!prepared.ok) {
    return fail(taskId, prepared.error);
  }

  const { parameters, resolvedParameters, result_score } = prepared;
  const comment = selection.comment ?? prepared.comment ?? "";

  const outcome = {
    taskId,
    agentId,
    sessionId,
    blueprintId,
    steps,
    comment,
  };

  if (action === "PLATFORM:complete") {
    return complete(outcome);
  }

  if (action === "PLATFORM:handoff") {
    return handoff({ ...outcome, parameters: resolvedParameters });
  }

  return taskFn.addStep({
    taskId,
    action,
    parameters: platformParameters({
      action,
      parameters,
      node: matchedNode,
      nodes,
      taskId,
      blueprintId,
      sessionId,
      agentId,
    }),
    comment,
    knowledgeScore,
    resultScore:
      result_score != null ? parseFloat(String(result_score)) : undefined,
    nodeId: matchedNode?.id ?? null,
  });
}

async function task({ taskId }: { taskId: string }) {
  try {
    return await runTask({ taskId });
  } catch (err) {
    platform.logger.error(err);

    return fail(
      taskId,
      err instanceof Error ? err.message : "Task failed unexpectedly"
    );
  }
}

export default task;
