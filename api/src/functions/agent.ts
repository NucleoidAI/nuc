import {
  getBoundNodeStep,
  getForcedActionContext,
  getParameterGenerationContext,
  mergeNodeParameters,
} from "../lib/nodeParameterBindings";
import type { LLMMeta } from "../lib/llmLog";
import {
  conditionBranch,
  findNodeAhead,
  isForcedNode,
  resolveCurrentNode,
  switchCases,
} from "../lib/blueprintNodes";
import Agent from "../models/Agent";
import MCPs from "../mcps/mcps";
import actions from "../actions";
import agentData from "./agentData";
import blueprintFn from "./blueprint";
import dataset from "../dataset";
import { generate } from "../lib/llm";
import knowledgeFn from "./knowledge";
import mcpFn from "./mcp";
import message from "./message";
import messagesFunc from "./message";
import platform from "@canmingir/link-express";
import { resolveParameterRefs } from "../lib/parameterRefs";
import session from "./session";
import stepScoreFn from "./stepScore";
import supervising from "./supervising";
import taskFn from "./task";

async function messages({ teamId }: { teamId: string }) {
  const messageInstances = await messagesFunc.listMessages({ teamId });

  return messageInstances
    .filter(
      (message) => message.role === "USER" || message.role === "ASSISTANT",
    )
    .map(({ role, content }) => ({ role: role.toLowerCase(), content }));
}

async function info({ agentId }) {
  const { name, description } = await agentData.get({ agentId });
  return {
    role: "system",
    content: {
      ai_assistant_info: {
        name,
        description,
        job: "GreyCollar AI Assistant",
      },
    },
  } as {
    role: "user" | "system" | "assistant";
    content: object;
  };
}

async function knowledge({ agentId }: { agentId: string }) {
  const knowledgeList = await knowledgeFn.list({
    agentId,
    options: { includeTask: false },
  });

  const knowledge_base = knowledgeList
    .map(({ type, question, answer, text, content }) => ({
      type,
      question,
      answer,
      text,
      content,
    }))
    .filter(
      ({ question, answer, text, content }) =>
        question || answer || text || content,
    );

  return {
    role: "system",
    content: {
      knowledge_base,
    },
  } as {
    role: "user" | "system" | "assistant";
    content: object;
  };
}

async function steps({ taskId }) {
  const steps = await taskFn.listSteps({ taskId });
  return {
    role: "system",
    content: {
      steps,
    },
  } as {
    role: "user" | "system" | "assistant";
    content: object;
  };
}

async function scoring({
  context,
  meta,
}: {
  context: {
    role: "user" | "system" | "assistant";
    content: object | string;
  }[];
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

async function Blueprints({ agentId }) {
  const Blueprints = await blueprintFn.list({
    agentId,
    includeDetails: false,
  });

  return {
    role: "system",
    content: {
      Blueprints,
    },
  } as {
    role: "user" | "system" | "assistant";
    content: object;
  };
}

async function conversations({ sessionId }) {
  const conversations = await session.listConversations({ sessionId });

  return conversations.map(({ role, content }) => ({
    role: role.toLowerCase(),
    content,
  }));
}

async function teamChat({
  content,
  teamId,
}: {
  content: string;
  teamId: string;
}) {
  const context = await messages({ teamId });

  const next = await generate({
    dataset: dataset.train.teamChat,
    context,
    content,
    json_format:
      "{ resource: <RESOURCE>, function: <FUNCTION>, parameters: <PARAMETERS> }",
    meta: { teamId, source: "agent.teamChat" },
  });

  let data;

  if (next.resource && next.function && next.parameters) {
    try {
      const resource = require(`./${next.resource}`).default;
      data = await resource[next.function]({ ...next.parameters, teamId });
    } catch (err) {
      platform.logger.error(err);
    }
  }

  const { response } = await generate({
    context,
    content:
      next.resource && next.function && next.parameters
        ? `${next.resource}.${next.function}(${JSON.stringify(
            next.parameters,
          )})=${JSON.stringify(data)} ${content}`
        : content,
    json_format: "{ response: <RESPONSE> }",
    meta: { teamId, source: "agent.teamChat" },
  });

  await message.create({
    role: "ASSISTANT",
    content: typeof response === "object" ? JSON.stringify(response) : response,
    teamId,
  });
}

async function approvalQuestion({
  instructions,
  label,
  context,
  content,
  meta,
}: {
  instructions?: string;
  label?: string;
  context?: {
    role: "user" | "system" | "assistant";
    content: string | object | object[];
  }[];
  content: string | object;
  meta?: LLMMeta;
}) {
  const fallback = instructions || label;

  try {
    const { question } = await generate({
      dataset: dataset.train.approvalQuestion,
      context,
      content: { instructions, label, task: content },
      json_format: "{ question: <QUESTION> }",
      meta,
    });

    const generated = typeof question === "string" ? question.trim() : "";

    return generated || fallback;
  } catch (error) {
    platform.logger.error(error);

    return fallback;
  }
}

async function approvalDecision({
  question,
  content,
  meta,
}: {
  question?: string;
  content: string;
  meta?: LLMMeta;
}) {
  const { decision } = await generate({
    dataset: dataset.train.approval,
    context: [],
    content: { question, content },
    json_format: "{ decision: <APPROVED|REJECTED|UNCLEAR> }",
    meta,
  });

  return String(decision ?? "").toUpperCase();
}

async function waitingApproval({ sessionId }: { sessionId: string }) {
  const sessionInstance = await session.get({ sessionId });

  if (!sessionInstance) {
    throw new Error("Session not found");
  }

  const agentInstance = await Agent.findByPk(sessionInstance.agentId);

  if (!agentInstance) {
    throw new Error("Agent not found");
  }

  const tasks = await taskFn.list({
    teamId: agentInstance.teamId,
    agentId: sessionInstance.agentId,
    status: "IN_PROGRESS",
    sessionId,
    includeSteps: true,
  });

  for (const task of tasks) {
    const step = task.steps.find(
      (step) => step.status === "WAITING_FOR_APPROVAL",
    );

    if (step) {
      return { agentId: sessionInstance.agentId, taskId: task.id, step };
    }
  }

  return null;
}

async function approve({
  sessionId,
  decision,
  comment,
}: {
  sessionId: string;
  decision: "APPROVED" | "REJECTED";
  comment?: string;
}) {
  const waiting = await waitingApproval({ sessionId });

  if (!waiting) {
    throw new Error("No step is waiting for approval in this session");
  }

  if (waiting.step.action === "PLATFORM:two_factor") {
    throw new Error("Use the 2FA verification endpoint");
  }

  if (comment) {
    await taskFn.updateStepComment({
      taskId: waiting.taskId,
      stepId: waiting.step.id,
      comment,
    });
  }

  await taskFn.updateStep({
    stepId: waiting.step.id,
    result: decision,
    status: "COMPLETED",
  });

  return { taskId: waiting.taskId, stepId: waiting.step.id, decision };
}

async function forceNodeStep({
  currentNode,
  currentTask,
  context,
  isBlocking,
  meta,
}: {
  currentNode: any;
  currentTask: { blueprintId: string; steps: any[] };
  context: {
    role: "user" | "system" | "assistant";
    content: object | string;
  }[];
  isBlocking: boolean;
  meta?: LLMMeta;
}) {
  const forcedAction = currentNode?.properties?.action;

  const result = await generate({
    dataset: isBlocking
      ? dataset.train.forceTaskDiamondBlocking
      : dataset.train.forceTaskDiamondNonBlocking,
    context,
    content: { ...currentTask, forced_action: forcedAction },
    json_format:
      "{ next_step: { parameters: <PARAMETER>, comment: <COMMENT> }, result_score: <0.0-1.0> }",
    meta,
  });

  if (forcedAction) {
    result.next_step.action = forcedAction;
  }

  return result;
}

async function task({ taskId }: { taskId: string }) {
  const { agentId, description, sessionId, blueprintId, status } =
    await taskFn.get({
      taskId,
    });

  if (status !== "IN_PROGRESS") return;

  console.log(agentId, blueprintId, sessionId);

  const currentTask = {
    blueprintId,
    steps: await taskFn.listSteps({ taskId }),
  };

  if (currentTask.steps.some((step) => step.status === "WAITING_FOR_APPROVAL"))
    return;

  //TODO: Loop detection
  if (currentTask.steps.length > 20) {
    return await taskFn.update({
      taskId,
      status: "FAILED",
      comment: "Failed due to too many steps",
    });
  }

  const agentInstance = agentId ? await Agent.findByPk(agentId) : null;

  const blueprint = blueprintId ? await blueprintFn.get({ blueprintId }) : null;
  const isBlocking = blueprint?.blocking !== false;

  const { inheritedSteps: inherited } = await taskFn.get({ taskId });

  const mcpContext = await mcpFn.list({
    agentId,
    teamId: agentInstance?.teamId,
  });

  const context = [
    ...(
      await Promise.all([
        info({ agentId }),
        knowledge({ agentId }),
        Blueprints({ agentId }),
        sessionId ? conversations({ sessionId }) : Promise.resolve([]),
      ])
    ).flat(),
    ...(inherited?.length
      ? [
          {
            role: "system" as const,
            content: {
              inherited_context_steps: inherited,
            },
          },
        ]
      : []),
    isBlocking ? actions.list() : actions.listNonBlockings(),
    mcpContext,
  ];

  const meta: LLMMeta = { agentId, sessionId, taskId };

  const completedSteps = currentTask.steps.filter((s) =>
    ["COMPLETED", "WAITING_FOR_USER"].includes(s.status),
  );

  const currentNode = blueprint?.nodes?.length
    ? resolveCurrentNode(blueprint.nodes, completedSteps)
    : undefined;

  if (currentNode?.type === "APPROVAL") {
    const pending = currentTask.steps.some(
      (step) =>
        step.nodeId === currentNode.id &&
        step.status === "WAITING_FOR_APPROVAL",
    );

    if (pending) {
      return;
    }
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

    return await taskFn.addStep({
      taskId,
      action: "PLATFORM:customer_approval",
      parameters: { question, sessionId, agentId },
      comment: "Waiting for the customer to approve or reject.",
      nodeId: currentNode.id,
    });
  }

  const isForceNode = isForcedNode(currentNode);

  const nodeAction = currentNode?.properties?.action;

  const definition = nodeAction
    ? MCPs.find((mcp) => mcp.action === nodeAction) ?? actions.find(nodeAction)
    : undefined;

  const boundStep = getBoundNodeStep({
    node: currentNode,
    inputSchema: definition?.inputSchema,
    injectedFields:
      nodeAction === "PLATFORM:message_user" ? ["sessionId", "agentId"] : [],
  });
  const generationContext = getParameterGenerationContext({
    context: isForceNode
      ? getForcedActionContext({ context, action: nodeAction })
      : context,
    node: currentNode,
  });

  const [
    knowledgeScore,
    {
      next_step: { action, parameters: llmParameters, comment },
      result_score,
    },
  ] = await Promise.all([
    boundStep || isForceNode ? undefined : scoring({ context, meta }),
    boundStep ??
      (isForceNode
        ? forceNodeStep({
            currentNode,
            currentTask,
            context: generationContext,
            isBlocking,
            meta,
          })
        : generate({
            dataset: isBlocking
              ? dataset.train.taskDiamondBlocking
              : dataset.train.taskDiamondNonBlocking,
            context: generationContext,
            content: currentTask,
            json_format:
              "{ next_step: { action: <ACTION>, parameters: <PARAMETER>, comment: <COMMENT> }, result_score: <0.0-1.0> }",
            meta,
          })),
  ]);

  const matchedNode = currentNode
    ? findNodeAhead(
        blueprint?.nodes ?? [],
        currentNode,
        (node) =>
          node.properties?.action === action ||
          (node === currentNode && !node.properties?.action),
      )
    : undefined;
  const nodeId = matchedNode?.id ?? null;

  const rawParameters = mergeNodeParameters({
    node: matchedNode,
    action,
    generated: llmParameters,
  });

  const byNode = Object.fromEntries(
    currentTask.steps.filter((s) => s.nodeId).map((s) => [s.nodeId, s]),
  );

  let parameters: Record<string, unknown>;
  let resolvedParameters: Record<string, unknown>;
  try {
    resolvedParameters = resolveParameterRefs(rawParameters, {
      steps: currentTask.steps,
      inherited_steps: inherited ?? [],
      byNode,
    });
    parameters = rawParameters;
  } catch (err) {
    return await taskFn.update({
      taskId,
      status: "FAILED",
      comment:
        err instanceof Error
          ? err.message
          : "Failed to resolve parameter references",
    });
  }

  const resultScore =
    result_score != null ? parseFloat(String(result_score)) : undefined;

  if (action === "PLATFORM:complete") {
    const steps = await taskFn.listSteps({ taskId });

    let result;

    if (steps.length) {
      result = steps[steps.length - 1].result;
    }

    await stepScoreFn.create({
      taskId,
      parameters: { description, blueprintId },
      output: result ?? comment ?? null,
      status: "COMPLETED",
    });

    if (sessionId) {
      await session.addConversation({
        sessionId,
        agentId,
        role: "ASSISTANT",
        content: comment || "Task has been completed.",
      });
    }

    return await taskFn.update({
      taskId,
      result,
      comment,
      status: "COMPLETED",
    });
  } else if (action === "PLATFORM:handoff") {
    const handoffParams = resolvedParameters as {
      targetAgentId: string;
      targetBlueprintId?: string;
      context: string;
    };

    if (handoffParams.targetAgentId === agentId) {
      return await taskFn.update({
        taskId,
        status: "FAILED",
        comment:
          "Self-handoff detected: agent attempted to hand off to itself. Follow the assigned blueprint instead.",
      });
    }

    const targetAgent = await Agent.findByPk(handoffParams.targetAgentId);
    const targetBlueprint = handoffParams.targetBlueprintId
      ? await blueprintFn
          .get({ blueprintId: handoffParams.targetBlueprintId })
          .catch(() => null)
      : null;

    if (!targetAgent || (handoffParams.targetBlueprintId && !targetBlueprint)) {
      return await taskFn.update({
        taskId,
        status: "FAILED",
        comment: `Handoff target does not exist: agent ${
          handoffParams.targetAgentId
        }${
          handoffParams.targetBlueprintId
            ? `, blueprint ${handoffParams.targetBlueprintId}`
            : ""
        }. Use an agent and blueprint id that exist on this team.`,
      });
    }

    const stepsToInherit = await taskFn.listSteps({ taskId });
    const inheritedSteps = stepsToInherit.map(
      ({ action, status, parameters, result, comment }) => ({
        action,
        status,
        parameters,
        result,
        comment,
      }),
    );

    const newTask = await taskFn.create({
      agentId: handoffParams.targetAgentId,
      description: handoffParams.context,
      blueprintId: handoffParams.targetBlueprintId,
      sessionId,
      inheritedSteps,
    });

    const handoffResult = `Handed off to agent ${handoffParams.targetAgentId}`;

    await stepScoreFn.create({
      taskId,
      parameters: { description, blueprintId },
      output: handoffResult,
      status: "COMPLETED",
    });

    return await taskFn.update({
      taskId,
      result: handoffResult,
      comment,
      status: "COMPLETED",
    });
  } else if (
    action === "PLATFORM:user_interaction" ||
    action === "PLATFORM:ask_supervisor"
  ) {
    parameters.taskId = taskId;
    parameters.blueprintId = currentTask.blueprintId;
    parameters.sessionId = sessionId;
    parameters.agentId = agentId;

    return await taskFn.addStep({
      taskId,
      action,
      parameters,
      comment,
      knowledgeScore,
      resultScore,
      nodeId,
    });
  } else if (action === "PLATFORM:message_user") {
    parameters.sessionId = sessionId;
    parameters.agentId = agentId;
  } else if (action === "PLATFORM:customer_approval") {
    parameters.question ??= matchedNode?.properties?.question;
    parameters.sessionId = sessionId;
    parameters.agentId = agentId;
  } else if (action === "PLATFORM:switch" && matchedNode?.type === "SWITCH") {
    parameters.cases = switchCases(matchedNode, blueprint?.nodes ?? []);
    parameters.defaultCase = matchedNode.properties?.defaultCase;
    parameters.instructions =
      (matchedNode.properties?.pseudocodeEnabled &&
        matchedNode.properties?.pseudocode) ||
      matchedNode.properties?.instructions ||
      parameters.instructions;
  } else if (
    action === "PLATFORM:decision" &&
    matchedNode?.type === "CONDITION"
  ) {
    const nodes = blueprint?.nodes ?? [];
    parameters.condition =
      (matchedNode.properties?.pseudocodeEnabled &&
        matchedNode.properties?.pseudocode) ||
      matchedNode.properties?.instructions?.trim() ||
      parameters.condition;
    parameters.true = conditionBranch(matchedNode.true, nodes);
    parameters.false = conditionBranch(matchedNode.false, nodes);
  }

  await taskFn.addStep({
    taskId,
    action,
    parameters,
    comment,
    knowledgeScore,
    resultScore,
    nodeId,
  });
}

async function step({
  stepId,
  action,
  parameters,
  comment,
  resultScore: stepResultScore,
}: {
  stepId: string;
  action: string;
  parameters: object;
  comment: string;
  resultScore?: number;
}) {
  let actionType;

  if (MCPs.find((mcp) => mcp.action === action)) {
    actionType = "MCP";
  } else if (action === "PLATFORM:ask_supervisor") {
    actionType = "SUPERVISED";
  } else if (action === "PLATFORM:user_interaction") {
    actionType = "INTERACTION";
  } else if (
    action === "PLATFORM:customer_approval" ||
    action === "PLATFORM:two_factor"
  ) {
    actionType = "APPROVAL";
  } else if (action === "SUPERVISOR_RESPONDED") {
    actionType = "SUPERVISED_RESPONDED";
  } else {
    actionType = "ACTION";
  }

  let taskId = "";

  console.debug(
    `[agent.step] dispatching stepId=${stepId} action=${action} actionType=${actionType}`,
  );

  let mcpClient: { close: () => Promise<void> } | undefined;

  try {
    let actionFn;
    let result;

    const step = await taskFn.getStep({ stepId });
    taskId = step.taskId;
    const stepKnowledgeScore = step.knowledgeScore;
    // TODO: hallucinationScore will be calculated separately in the future
    const stepHallucinationScore = stepKnowledgeScore;

    const priorSteps = (await taskFn.listSteps({ taskId })).filter(
      (s) => s.id !== stepId,
    );
    const { inheritedSteps, agentId: taskAgentId } = await taskFn.get({
      taskId,
    });
    const runParameters = resolveParameterRefs(
      parameters as Record<string, unknown>,
      {
        steps: priorSteps,
        inherited_steps: inheritedSteps ?? [],
        byNode: Object.fromEntries(
          priorSteps.filter((s) => s.nodeId).map((s) => [s.nodeId, s]),
        ),
      },
    );

    if (actionType === "SUPERVISED") {
      actionFn = require("../actions/ask_supervisor").default;
    } else if (actionType === "ACTION") {
      // @ts-ignore
      const { lib } = actions.find(action);
      actionFn = require(`../actions/${lib}`).default;
    } else if (actionType === "MCP") {
      const mcp = require("../lib/mcp").default;

      const provider = action.split(":")[0].toLowerCase();

      if (!taskAgentId) {
        throw new Error("MCP_STEP_REQUIRES_AGENT");
      }

      const agentInstance = await Agent.findByPk(taskAgentId);

      if (!agentInstance?.teamId) {
        throw new Error("MCP_STEP_REQUIRES_AGENT");
      }

      mcpClient = await mcp.connect({
        name: provider,
        teamId: agentInstance.teamId,
        agentId: taskAgentId,
      });
    } else if (actionType === "INTERACTION") {
      actionFn = require("../actions/interaction").default;
    } else if (actionType === "APPROVAL") {
      actionFn =
        action === "PLATFORM:two_factor"
          ? require("../actions/two_factor").default
          : require("../actions/customer_approval").default;
    }

    if (
      actionType === "ACTION" ||
      actionType === "SUPERVISED" ||
      actionType === "INTERACTION" ||
      actionType === "APPROVAL"
    ) {
      const steps = await taskFn.listSteps({ taskId });

      console.debug(
        `[agent.step] calling actionFn.run for action=${action} stepId=${stepId}`,
      );

      result = await actionFn.run({
        context: steps
          .filter((step) => step.result)
          .map(
            ({ comment, result }) => `Comment: ${comment}\nResult: ${result}`,
          )
          .join("\n"),
        parameters: runParameters,
        meta: { taskId, stepId },
      });

      console.debug(
        `[agent.step] actionFn.run returned for action=${action} stepId=${stepId}`,
      );
    } else if (actionType === "MCP") {
      result = await mcpClient.callTool(
        action,
        runParameters as Record<string, unknown>,
      );
    }

    let resultString;

    if (actionType === "MCP") {
      resultString =
        require("../lib/mcpResult").unwrapToolResult(result) ??
        JSON.stringify(result);
    } else if (result && typeof result === "object") {
      resultString = JSON.stringify(result);
    } else {
      resultString = result;
    }

    if (actionType === "APPROVAL") {
      await taskFn.updateStep({
        stepId,
        result: resultString,
        status: "WAITING_FOR_APPROVAL",
      });
      await stepScoreFn.create({
        taskId,
        stepId,
        parameters,
        output: resultString,
        status: "COMPLETED",
        knowledgeScore: stepKnowledgeScore,
        hallucinationScore: stepHallucinationScore,
        resultScore: stepResultScore,
      });
    } else if (actionType === "INTERACTION") {
      await taskFn.updateStep({
        stepId,
        result: resultString,
        status: "WAITING_FOR_USER",
      });
      await stepScoreFn.create({
        taskId,
        stepId,
        parameters,
        output: resultString,
        status: "COMPLETED",
        knowledgeScore: stepKnowledgeScore,
        hallucinationScore: stepHallucinationScore,
        resultScore: stepResultScore,
      });
    } else if (actionType === "SUPERVISED") {
      await session.addConversation({
        sessionId: parameters.sessionId,
        agentId: parameters.agentId,
        role: "ASSISTANT",
        content: "I need to ask my supervisor for more information.",
      });
      await taskFn.updateStep({
        stepId,
        result: resultString,
        status: "SUPERVISED_NEEDED",
      });
      await stepScoreFn.create({
        taskId,
        stepId,
        parameters,
        output: resultString,
        status: "SUPERVISED",
        knowledgeScore: stepKnowledgeScore,
        hallucinationScore: stepHallucinationScore,
        resultScore: stepResultScore,
      });
    } else {
      const finalStatus = result && result.isError ? "FAILED" : "COMPLETED";
      await taskFn.updateStep({
        stepId,
        result: resultString || "Completed",
        status: finalStatus,
      });
      await stepScoreFn.create({
        taskId,
        stepId,
        parameters,
        output: resultString,
        status: finalStatus === "FAILED" ? "FAILED" : "COMPLETED",
        knowledgeScore: stepKnowledgeScore,
        hallucinationScore: stepHallucinationScore,
        resultScore: stepResultScore,
      });
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (action === "PLATFORM:two_factor" && taskId) {
        await taskFn.update({ taskId, status: "FAILED", comment: err.message });
      }
      await taskFn.updateStep({
        stepId,
        result: err.message,
        status: "FAILED",
      });
      if (taskId) {
        await stepScoreFn.create({
          taskId,
          stepId,
          parameters,
          output: err.message,
          status: "FAILED",
        });
      } else {
        platform.logger.error(
          `step ${stepId} failed before taskId resolved; skipping log: ${err.message}`,
        );
      }
    }
  } finally {
    if (mcpClient) {
      try {
        await mcpClient.close();
      } catch (closeErr) {
        platform.logger.error(
          `failed to close MCP client for step ${stepId}: ${closeErr}`,
        );
      }
    }
  }
}

type BlueprintChatContextSummary = {
  agent: { name?: string; description?: string };
  knowledge: { type?: string; question?: string; text?: string }[];
  referenceBlueprint: { id?: string; title?: string; nodeCount: number } | null;
  supervising: { question?: string; status?: string } | null;
};

async function handoffTargets({
  agentId,
  teamId,
}: {
  agentId: string;
  teamId?: string | null;
}) {
  if (!teamId) {
    return [];
  }

  const agentInstances = await Agent.findAll({ where: { teamId } });

  return Promise.all(
    agentInstances
      .filter((instance) => instance.id !== agentId)
      .map(async (instance) => ({
        targetAgentId: instance.id,
        name: instance.name,
        description: instance.description,
        blueprints: (
          await blueprintFn.list({
            agentId: instance.id,
            includeDetails: false,
          })
        ).map(({ id, title }: { id: string; title: string }) => ({
          targetBlueprintId: id,
          title,
        })),
      })),
  );
}

async function blueprintChatContext({
  agentId,
  teamId,
  blueprintId,
  supervising,
}: {
  agentId: string;
  teamId?: string | null;
  blueprintId?: string | null;
  supervising?: {
    id: string;
    question: string;
    status: string;
    taskId?: string | null;
    blueprintId?: string | null;
  } | null;
}): Promise<{
  messages: { role: "system"; content: string }[];
  summary: BlueprintChatContextSummary;
}> {
  const [agentInfo, agentKnowledge, referenceBlueprint, targets] =
    await Promise.all([
      info({ agentId }),
      knowledge({ agentId }),
      blueprintId
        ? blueprintFn.getWithNodes(blueprintId)
        : Promise.resolve(null),
      handoffTargets({ agentId, teamId }),
    ]);

  const blueprintForLLM = referenceBlueprint
    ? blueprintFn.stripDetails(referenceBlueprint)
    : null;

  const messages: { role: "system"; content: string }[] = [
    { role: "system", content: JSON.stringify(agentInfo.content) },
    { role: "system", content: JSON.stringify(agentKnowledge.content) },
    ...(blueprintForLLM
      ? [
          {
            role: "system" as const,
            content: JSON.stringify({ referenceBlueprint: blueprintForLLM }),
          },
        ]
      : []),
    ...(supervising
      ? [{ role: "system" as const, content: JSON.stringify({ supervising }) }]
      : []),
    {
      role: "system" as const,
      content: JSON.stringify({ handoffTargets: targets }),
    },
  ];

  const agentContent = agentInfo.content as {
    ai_assistant_info?: { name?: string; description?: string };
  };
  const knowledgeContent = agentKnowledge.content as {
    knowledge_base?: {
      type?: string | null;
      question?: string | null;
      text?: string | null;
    }[];
  };
  const reference = referenceBlueprint as {
    id?: string;
    title?: string;
    nodes?: unknown[];
  } | null;

  const clean = (value?: string | null) => value ?? undefined;

  const summary: BlueprintChatContextSummary = {
    agent: {
      name: clean(agentContent.ai_assistant_info?.name),
      description: clean(agentContent.ai_assistant_info?.description),
    },
    knowledge: (knowledgeContent.knowledge_base ?? []).map(
      ({ type, question, text }) => ({
        type: clean(type),
        question: clean(question),
        text: clean(text),
      }),
    ),
    referenceBlueprint: reference
      ? {
          id: reference.id,
          title: reference.title,
          nodeCount: Array.isArray(reference.nodes)
            ? reference.nodes.length
            : 0,
        }
      : null,
    supervising: supervising
      ? { question: supervising.question, status: supervising.status }
      : null,
  };

  return { messages, summary };
}

async function blueprintChatDecision({
  history,
  content,
  meta,
}: {
  history?: {
    role: "system" | "user" | "assistant";
    content: string;
  }[];
  content: string;
  meta?: LLMMeta;
}): Promise<{ decision: "KNOWLEDGE" | "BLUEPRINT" }> {
  const response = await generate({
    dataset: dataset.train.blueprintChatDecision,
    context: history,
    content,
    json_format: '{ decision: <"KNOWLEDGE"|"BLUEPRINT"> }',
    meta,
  });

  return response as { decision: "KNOWLEDGE" | "BLUEPRINT" };
}

async function blueprintChatSufficiency({
  history,
  content,
  decision,
  meta,
}: {
  history?: {
    role: "system" | "user" | "assistant";
    content: string;
  }[];
  content: string;
  decision: "KNOWLEDGE" | "BLUEPRINT";
  meta?: LLMMeta;
}): Promise<{ sufficient: boolean; answer?: string }> {
  const context = [
    {
      role: "system" as const,
      content: JSON.stringify({ decision }),
    },
    ...(history ?? []),
  ];

  const response = await generate({
    dataset: dataset.train.blueprintChatSufficiency,
    context,
    content,
    json_format: "{ sufficient: <true|false>, answer: <ANSWER> }",
    meta,
  });

  return response as { sufficient: boolean; answer?: string };
}

async function blueprintChatKnowledge({
  content,
  meta,
}: {
  content: string;
  meta?: LLMMeta;
}): Promise<{ knowledge: string }> {
  const response = await generate({
    dataset: dataset.train.blueprintChatKnowledge,
    content,
    json_format: "{ knowledge: <EXTRACTED_KNOWLEDGE> }",
    meta,
  });

  return response as { knowledge: string };
}

function sanitizeFlow(flow: unknown[]): unknown[] {
  const idSet = new Set<string>();
  const deduped: unknown[] = [];

  for (const node of flow) {
    if (!node || typeof node !== "object") continue;
    const n = node as Record<string, unknown>;
    const id = n.id as string;
    if (!id || idSet.has(id)) continue;
    idSet.add(id);
    deduped.push(n);
  }

  return deduped.map((node) => {
    const n = node as Record<string, unknown>;
    const id = n.id as string;

    const sanitizeRefs = (refs: unknown): string[] | null => {
      if (!Array.isArray(refs)) return null;
      const filtered = refs.filter(
        (ref) => typeof ref === "string" && ref !== id && idSet.has(ref),
      );
      return filtered.length ? filtered : null;
    };

    const result: Record<string, unknown> = { ...n };

    if (Array.isArray(n.next)) {
      result.next = sanitizeRefs(n.next);
    }

    const props = n.properties as Record<string, unknown> | undefined;
    if (props) {
      const updated: Record<string, unknown> = { ...props };
      if (Array.isArray(props.true)) updated.true = sanitizeRefs(props.true);
      if (Array.isArray(props.false)) updated.false = sanitizeRefs(props.false);
      result.properties = updated;
    }

    if (Array.isArray(n.true)) result.true = sanitizeRefs(n.true);
    if (Array.isArray(n.false)) result.false = sanitizeRefs(n.false);

    return result;
  });
}

function restoreCosmetics(
  flow: unknown[],
  existingNodes?: unknown[],
): unknown[] {
  const previous = new Map<string, Record<string, unknown>>();

  for (const node of existingNodes ?? []) {
    const n = node as Record<string, unknown>;
    if (typeof n?.id === "string") {
      previous.set(n.id, (n.properties as Record<string, unknown>) ?? {});
    }
  }

  return flow.map((node) => {
    const n = node as Record<string, unknown>;
    const props = (n.properties as Record<string, unknown>) ?? {};
    const previousProps = previous.get(n.id as string) ?? {};

    const label =
      (typeof props.label === "string" && props.label) ||
      (typeof previousProps.label === "string" && previousProps.label) ||
      (typeof props.action === "string" &&
        props.action.replace(/^PLATFORM:/i, "")) ||
      (n.id as string);

    const icon =
      (typeof props.icon === "string" && props.icon) ||
      (typeof previousProps.icon === "string" && previousProps.icon) ||
      (n.type === "CONDITION"
        ? "mdi:source-branch"
        : n.type === "SWITCH"
        ? "mdi:call-split"
        : "mdi:circle-outline");

    const description =
      typeof props.description === "string"
        ? props.description
        : typeof previousProps.description === "string"
        ? previousProps.description
        : undefined;

    return {
      ...n,
      properties: {
        ...props,
        label,
        icon,
        ...(description !== undefined && { description }),
      },
    };
  });
}

async function Blueprint({
  history,
  content,
  existingBlueprint,
  meta,
}: {
  history?: {
    role: "system" | "user" | "assistant";
    content: string;
  }[];
  content: string;
  existingBlueprint?: { nodes?: unknown[] } | null;
  meta?: LLMMeta;
}) {
  const blueprintForLLM = existingBlueprint
    ? blueprintFn.stripDetails(existingBlueprint)
    : null;

  const context = [
    ...(blueprintForLLM
      ? [
          {
            role: "system" as const,
            content: {
              existingBlueprint: blueprintForLLM,
            },
          },
        ]
      : []),
    ...(history ?? []),
  ];

  const response = await generate({
    dataset: dataset.train.blueprintChat,
    context,
    content,
    json_format: "{ response: <RESPONSE>, flow: [<FLOW>] }",
    meta,
  });

  if (Array.isArray(response.flow)) {
    response.flow = restoreCosmetics(
      sanitizeFlow(response.flow),
      existingBlueprint?.nodes,
    );
  }

  return response;
}

async function blueprintName({
  history,
  content,
  agentId,
}: {
  history?: {
    role: "system" | "user" | "assistant";
    content: string;
  }[];
  content: string;
  agentId: string;
}) {
  const context = [await info({ agentId }), ...(history ?? [])];

  const response = await generate({
    dataset: dataset.train.blueprintName,
    context,
    content,
    json_format: "{ title: <TITLE>, description: <DESCRIPTION> }",
    meta: { agentId, source: "agent.blueprintName" },
  });

  return response;
}

async function blueprintToTask({
  history,
  content,
  knowledge,
  Blueprint,
  meta,
}: {
  history?: {
    role: "system" | "user" | "assistant";
    content: string;
  }[];
  content: string;
  knowledge: Array<[]>;
  Blueprint: object;
  meta?: LLMMeta;
}) {
  const context = [
    {
      role: "system" as const,
      content: {
        Blueprint,
        knowledge,
        history,
      },
    },
  ];

  const response = await generate({
    dataset: dataset.train.Blueprint,
    context,
    content,
    json_format: "{ task: <TASK> ,answer: <ANSWER> }",
    meta,
  });

  return response;
}

async function blueprintDiamond({
  content,
  Blueprints,
  meta,
}: {
  content: string;
  Blueprints: Array<[]>;
  meta?: LLMMeta;
}) {
  const context = [
    {
      role: "system" as const,
      content: {
        Blueprints,
      },
    },
  ];

  const response = await generate({
    dataset: dataset.train.blueprintDiamond,
    context,
    content,
    json_format:
      "{ decision: <DECISION>,existing: <EXISTING>,blueprintId: <BLUEPRINT_ID> }",
    meta,
  });
  return response;
}

async function evaluateSupervisionAnswer({
  agentId,
  content,
}: {
  agentId: string;
  content: {
    question: string;
    answer: string;
  };
}) {
  const context = [
    await info({ agentId }),
    await knowledge({ agentId }),
    {
      role: "system" as const,
      content: {
        supervision_context: {
          original_question: content.question,
          proposed_answer: content.answer,
        },
      },
    },
  ];

  const evaluation = await generate({
    dataset: dataset.train.blueprintChatEvaluation,
    context,
    content: `${content.question}\n\nAnswer: ${content.answer}`,
    json_format: `{
      "is_answer_known": <true|false>,
    }`,
    meta: { agentId, source: "agent.evaluateSupervisionAnswer" },
  });

  return evaluation;
}

async function chat({
  agentId,
  sessionId,
  content,
}: {
  agentId: string;
  sessionId: string;
  content: string;
}) {
  const knowledgeData = await knowledgeFn.list({
    agentId,
  });

  const conversationsData = await conversations({ sessionId });

  const agentDataResult = await agentData.get({ agentId });

  if (!agentDataResult) {
    throw new Error("Agent not found");
  }

  const task = await taskFn.list({
    teamId: agentDataResult.teamId,
    agentId,
    status: "IN_PROGRESS",
    sessionId,
    includeSteps: true,
  });

  const approvalTask = task.find((task) =>
    task.steps.some((step) => step.status === "WAITING_FOR_APPROVAL"),
  );

  if (approvalTask) {
    const approvalStep = approvalTask.steps.find(
      (step) => step.status === "WAITING_FOR_APPROVAL",
    );

    if (approvalStep?.action === "PLATFORM:two_factor") {
      await session.addConversation({
        sessionId,
        agentId,
        role: "ASSISTANT",
        content: "Please complete the pending 2FA verification to continue.",
      });
      return;
    }

    const question = approvalStep?.parameters?.question;

    const decision = await approvalDecision({
      question,
      content,
      meta: { agentId, sessionId, taskId: approvalTask.id },
    });

    if (decision === "APPROVED" || decision === "REJECTED") {
      await taskFn.updateStep({
        stepId: approvalStep.id,
        result: decision,
        status: "COMPLETED",
      });
    } else {
      await session.addConversation({
        sessionId,
        agentId,
        role: "ASSISTANT",
        content: question
          ? `I still need your decision. ${question}`
          : "I still need your approval to continue.",
      });
    }

    return;
  }

  const waitingTask = task.find((task) =>
    task.steps.some((step) => step.status === "WAITING_FOR_USER"),
  );

  if (waitingTask) {
    const waitingStep = waitingTask.steps.find(
      (step) => step.status === "WAITING_FOR_USER",
    );
    if (!waitingStep) {
      return;
    }

    await taskFn.updateStep({
      stepId: waitingStep.id,
      result: content,
      status: "COMPLETED",
    });
    return;
  }

  const sessionInstance = await session.get({ sessionId });
  const pinnedBlueprintId: string | null = sessionInstance?.blueprintId ?? null;

  let selectedBlueprintId: string | null = null;
  let blueprintDecision: { decision: string; blueprintId?: string } | null =
    null;

  if (pinnedBlueprintId) {
    selectedBlueprintId = pinnedBlueprintId;
  } else {
    const blueprintsData = await Blueprints({ agentId });
    blueprintDecision = await blueprintDiamond({
      content,
      Blueprints: blueprintsData,
      meta: { agentId, sessionId },
    });
    if (blueprintDecision.decision === "BLUEPRINT") {
      selectedBlueprintId = blueprintDecision.blueprintId ?? null;
    }
  }

  if (selectedBlueprintId && task.length === 0) {
    const blueprintData = await blueprintFn.get({
      blueprintId: selectedBlueprintId,
      includeDetails: false,
    });

    let description: string;

    if (blueprintData.executionMode === "LITE") {
      const previousTasks = await taskFn.count({
        blueprintId: selectedBlueprintId,
      });
      description = `${blueprintData.title} #${previousTasks + 1}`;
    } else {
      const blueprintToTaskResponse = await blueprintToTask({
        history: conversationsData,
        knowledge: knowledgeData,
        content: content,
        Blueprint: blueprintData,
        meta: { agentId, sessionId },
      });
      description =
        blueprintToTaskResponse.task?.description ||
        blueprintToTaskResponse.task;
    }

    await taskFn.create({
      agentId,
      description,
      blueprintId: selectedBlueprintId,
      sessionId,
    });
  } else {
    if (task.length > 0) {
      return;
    }
    const context = [
      ...(
        await Promise.all([
          info({ agentId }),
          knowledge({ agentId }),
          conversations({ sessionId }),
        ])
      ).flat(),
    ];

    const { evaluation } = await generate({
      dataset: dataset.train.chat,
      context,
      content,
      json_format: "{ evaluation: { is_answer_known: <true|false> } }",
      meta: { agentId, sessionId, source: "agent.chat.evaluation" },
    });

    if (
      evaluation?.is_answer_known ||
      blueprintDecision?.decision === "UNREVELANT"
    ) {
      if (task.length > 0) {
        await taskFn.update({
          taskId: task[0].id,
          status: "COMPLETED",
          comment: "Answer is known or irrelevant",
        });
      }

      const { answer, confidence } = await generate({
        policy: dataset.policy,
        dataset: dataset.train.chat,
        context,
        content,
        json_format: "{ answer: <ANSWER_IN_NLP>, confidence: <0-1> }",
        meta: { agentId, sessionId, source: "agent.chat.answer" },
      });

      await session.addConversation({
        sessionId,
        agentId,
        role: "ASSISTANT",
        content: answer,
      });
    } else {
      const conversation = await session.addConversation({
        sessionId,
        agentId,
        role: "ASSISTANT",
        content: "Please wait while I am working on your request.",
      });

      await supervising.create({
        sessionId,
        conversationId: conversation.id,
        question: content,
        blueprintId: blueprintDecision?.blueprintId,
        agentId,
      });
    }
  }
}

async function toPseudo({
  content,
  meta,
}: {
  content: string;
  meta?: LLMMeta;
}) {
  const response = await generate({
    dataset: dataset.train.pseudocode,
    context: [],
    content,
    json_format: "{ pseudocode: <PSEUDO> }",
    meta,
  });

  return response.pseudocode as string;
}

async function blueprintDescription({
  nodes,
  meta,
}: {
  nodes: object[];
  meta?: LLMMeta;
}) {
  const context = [
    {
      role: "system" as const,
      content: { nodes },
    },
  ];

  const response = await generate({
    dataset: dataset.train.blueprintDescription,
    context,
    content: nodes,
    json_format: "{ description: <DESCRIPTION> }",
    meta,
  });

  return response.description as string;
}

async function blueprintSkill({ nodes }: { nodes: object[] }) {
  const context = [
    {
      role: "system" as const,
      content: { nodes },
    },
  ];

  const response = await generate({
    dataset: dataset.train.blueprintSkill,
    context,
    content: nodes,
    json_format: "{ skill: <SKILL> }",
  });

  return response.skill as string;
}

export default {
  teamChat,
  chat,
  task,
  step,
  approve,
  waitingApproval,
  Blueprint,
  blueprintName,
  blueprintChatContext,
  blueprintChatDecision,
  blueprintChatSufficiency,
  blueprintChatKnowledge,
  evaluateSupervisionAnswer,
  toPseudo,
  blueprintDescription,
  blueprintSkill,
};
