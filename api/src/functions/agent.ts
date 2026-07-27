import MCPs from "../mcps/mcps";
import actions from "../actions";
import agentData from "./agentData";
import blueprintFn from "./blueprint";
import dataset from "../dataset";
import { generate } from "../lib/llm";
import type { LLMMeta } from "../lib/llmLog";
import knowledgeFn from "./knowledge";
import mcpFn from "./mcp";
import message from "./message";
import messagesFunc from "./message";
import platform from "@canmingir/link-express";
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

async function knowledge({
  agentId,
  taskId,
}: {
  agentId: string;
  taskId?: string;
}) {
  const knowledgeList = await knowledgeFn.list({
    agentId,
    options: { includeSteps: true },
  });

  const knowledge_base = knowledgeList
    .filter(
      (knowledge) =>
        !taskId || !(knowledge.type === "TASK" && knowledge.taskId === taskId),
    )
    .map(({ type, question, answer, text, content, Task }) => ({
      type,
      question,
      answer,
      text,
      content,
      Task,
    }));

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
  const Blueprints = await blueprintFn.list({ agentId, includeLabels: false });

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

async function forceTask({
  blueprint,
  currentTask,
  context,
  isBlocking,
  meta,
}: {
  blueprint: { nodes: any[] };
  currentTask: { description: string; blueprintId: string; steps: any[] };
  context: {
    role: "user" | "system" | "assistant";
    content: object | string;
  }[];
  isBlocking: boolean;
  meta?: LLMMeta;
}) {
  const nodes = blueprint.nodes;

  const allNextIds = new Set(
    nodes.flatMap((n) => [
      ...(Array.isArray(n.next) ? n.next : n.next ? [n.next] : []),
      ...(n.true || []),
      ...(n.false || []),
    ]),
  );
  const rootNode = nodes.find((n) => !allNextIds.has(n.id));

  const completedSteps = currentTask.steps.filter((s) =>
    ["COMPLETED", "WAITING_FOR_USER"].includes(s.status),
  );

  let currentNode = rootNode;
  for (const step of completedSteps) {
    if (!currentNode || currentNode.properties?.action !== step.action) break;
    if (currentNode.type === "CONDITION") {
      const tookTrue = step.result === "true";
      const nextIds = tookTrue
        ? currentNode.true || []
        : currentNode.false || [];
      currentNode = nextIds.length
        ? nodes.find((n) => nextIds.includes(n.id))
        : undefined;
    } else {
      const nextIds = Array.isArray(currentNode.next)
        ? currentNode.next
        : currentNode.next
        ? [currentNode.next]
        : [];
      currentNode = nextIds.length
        ? nodes.find((n) => nextIds.includes(n.id))
        : undefined;
    }
  }

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
  const { agentId, description, sessionId, blueprintId } = await taskFn.get({
    taskId,
  });

  console.log(agentId, blueprintId, sessionId);

  const currentTask = {
    description,
    blueprintId,
    steps: await taskFn.listSteps({ taskId }),
  };

  //TODO: Loop detection
  if (currentTask.steps.length > 20) {
    return await taskFn.update({
      taskId,
      status: "FAILED",
      comment: "Failed due to too many steps",
    });
  }

  const blueprint = blueprintId ? await blueprintFn.get({ blueprintId }) : null;
  const isBlocking = blueprint?.blocking !== false;
  const isForce = blueprint?.force === true;

  const { inheritedSteps: inherited } = await taskFn.get({ taskId });

  const context = [
    ...(
      await Promise.all([
        info({ agentId }),
        knowledge({ agentId, taskId }),
        Blueprints({ agentId }),
        steps({ taskId }),
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
    mcpFn.list(),
  ];

  const meta: LLMMeta = { agentId, sessionId, taskId };

  const knowledgeScore = await scoring({ context, meta });

  const {
    next_step: { action, parameters, comment },
    result_score,
  } =
    isForce && blueprint?.nodes?.length
      ? await forceTask({ blueprint, currentTask, context, isBlocking, meta })
      : await generate({
          dataset: isBlocking
            ? dataset.train.taskDiamondBlocking
            : dataset.train.taskDiamondNonBlocking,
          context,
          content: currentTask,
          json_format:
            "{ next_step: { action: <ACTION>, parameters: <PARAMETER>, comment: <COMMENT> }, result_score: <0.0-1.0> }",
          meta,
        });

  console.log("next action", action);
  console.log("comment", comment);

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
    const handoffParams = parameters as {
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

    const stepsToInherit = await taskFn.listSteps({ taskId });
    const inheritedSteps = stepsToInherit.map(({ s }) => ({
      s,
    }));

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
    });
  } else if (action === "PLATFORM:message_user") {
    parameters.sessionId = sessionId;
    parameters.agentId = agentId;
  }

  await taskFn.addStep({
    taskId,
    action,
    parameters,
    comment,
    knowledgeScore,
    resultScore,
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
  } else if (action === "SUPERVISOR_RESPONDED") {
    actionType = "SUPERVISED_RESPONDED";
  } else {
    actionType = "ACTION";
  }

  let taskId = "";

  console.debug(
    `[agent.step] dispatching stepId=${stepId} action=${action} actionType=${actionType}`,
  );

  try {
    let actionFn;
    let result;
    let mcpClient;

    const step = await taskFn.getStep({ stepId });
    taskId = step.taskId;
    const stepKnowledgeScore = step.knowledgeScore;
    // TODO: hallucinationScore will be calculated separately in the future
    const stepHallucinationScore = stepKnowledgeScore;

    if (actionType === "SUPERVISED") {
      actionFn = require("../actions/ask_supervisor").default;
    } else if (actionType === "ACTION") {
      // @ts-ignore
      const { lib } = actions.find(action);
      actionFn = require(`../actions/${lib}`).default;
    } else if (actionType === "MCP") {
      const mcp = require("../lib/mcp").default;

      const provider = action.split(":")[0].toLowerCase();
      const tool = action.split(":")[1];

      mcpClient = await mcp.connect({ name: provider, tool });
    } else if (actionType === "INTERACTION") {
      actionFn = require("../actions/interaction").default;
    }

    if (
      actionType === "ACTION" ||
      actionType === "SUPERVISED" ||
      actionType === "INTERACTION"
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
        parameters,
        meta: { taskId },
      });

      console.debug(
        `[agent.step] actionFn.run returned for action=${action} stepId=${stepId}`,
      );
    } else if (actionType === "MCP") {
      let mcpParameters = parameters as Record<string, unknown>;
      if (action === "GREY:knowledge_lookup" && !mcpParameters.agentId) {
        const task = await taskFn.get({ taskId });
        mcpParameters = { ...mcpParameters, agentId: task.agentId };
      }
      result = await mcpClient.callTool(action, mcpParameters);
    }

    let resultString;

    if (result && typeof result === "object") {
      resultString = JSON.stringify(result);
    } else {
      resultString = result;
    }

    if (actionType === "INTERACTION") {
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
  }
}

async function blueprintChatContext({
  agentId,
  blueprintId,
  supervising,
}: {
  agentId: string;
  blueprintId?: string | null;
  supervising?: {
    id: string;
    question: string;
    status: string;
    taskId?: string | null;
    blueprintId?: string | null;
  } | null;
}): Promise<{ role: "system"; content: string }[]> {
  const [agentInfo, agentKnowledge, referenceBlueprint] = await Promise.all([
    info({ agentId }),
    knowledge({ agentId }),
    blueprintId ? blueprintFn.getWithNodes(blueprintId) : Promise.resolve(null),
  ]);

  return [
    { role: "system", content: JSON.stringify(agentInfo.content) },
    { role: "system", content: JSON.stringify(agentKnowledge.content) },
    ...(referenceBlueprint
      ? [
          {
            role: "system" as const,
            content: JSON.stringify({ referenceBlueprint }),
          },
        ]
      : []),
    ...(supervising
      ? [{ role: "system" as const, content: JSON.stringify({ supervising }) }]
      : []),
  ];
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
  existingBlueprint?: object | null;
  meta?: LLMMeta;
}) {
  const context = [
    ...(existingBlueprint
      ? [
          {
            role: "system" as const,
            content: {
              existingBlueprint,
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
    response.flow = sanitizeFlow(response.flow);
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
      includeLabels: false,
    });

    const blueprintToTaskResponse = await blueprintToTask({
      history: conversationsData,
      knowledge: knowledgeData,
      content: content,
      Blueprint: blueprintData,
      meta: { agentId, sessionId },
    });

    await taskFn.create({
      agentId,
      description:
        blueprintToTaskResponse.task?.description ||
        blueprintToTaskResponse.task,
      blueprintId: selectedBlueprintId,
      sessionId,
    });

    await session.addConversation({
      sessionId,
      agentId,
      role: "ASSISTANT",
      content: blueprintToTaskResponse.answer,
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

  return response.pseudocode;
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

  console.log("[agent] blueprintDescription:", response);

  return response.description as string;
}

export default {
  teamChat,
  chat,
  task,
  step,
  Blueprint,
  blueprintName,
  blueprintChatContext,
  blueprintChatDecision,
  blueprintChatSufficiency,
  blueprintChatKnowledge,
  evaluateSupervisionAnswer,
  toPseudo,
  blueprintDescription,
};
