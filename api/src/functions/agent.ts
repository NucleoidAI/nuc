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
import session from "./session";
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
  });

  await message.create({
    role: "ASSISTANT",
    content: typeof response === "object" ? JSON.stringify(response) : response,
    teamId,
  });
}

async function task({ taskId }: { taskId: string }) {
  const { agentId, description, sessionId, blueprintId } = await taskFn.get({
    taskId,
  });
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

  const context = [
    ...(
      await Promise.all([
        info({ agentId }),
        knowledge({ agentId, taskId }),
        Blueprints({ agentId }),
        steps({ taskId }),
      ])
    ).flat(),
    actions.list(),
    mcpFn.list(),
  ];

  const {
    next_step: { action, parameters, comment },
  } = await generate({
    dataset: dataset.train.taskDiamond,
    context,
    content: currentTask,
    json_format:
      "{ next_step: { action: <ACTION>, parameters: <PARAMETER>, comment: <COMMENT> } }",
  });

  if (action === "PLATFORM:complete") {
    const steps = await taskFn.listSteps({ taskId });

    let result;

    if (steps.length) {
      result = steps[steps.length - 1].result;
    }

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
    });
  }

  await taskFn.addStep({
    taskId,
    action,
    parameters,
    comment,
  });
}

async function step({
  stepId,
  action,
  parameters,
  comment,
}: {
  stepId: string;
  action: string;
  parameters: object;
  comment: string;
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

  try {
    let actionFn;
    let result;
    let mcpClient;

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
      const { taskId } = await taskFn.getStep({ stepId });
      const steps = await taskFn.listSteps({ taskId });

      result = await actionFn.run({
        context: steps
          .filter((step) => step.result)
          .map(
            ({ comment, result }) => `Comment: ${comment}\nResult: ${result}`,
          )
          .join("\n"),
        parameters,
      });
    } else if (actionType === "MCP") {
      result = await mcpClient.callTool(action, parameters);
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
    } else {
      await taskFn.updateStep({
        stepId,
        result: resultString || "Completed",
        status: result && result.isError ? "FAILED" : "COMPLETED",
      });
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      await taskFn.updateStep({
        stepId,
        result: err.message,
        status: "FAILED",
      });
    }
  }
}

async function Blueprint({
  history,
  content,
}: {
  history?: {
    role: "system" | "user" | "assistant";
    content: string;
  }[];
  content: string;
}) {
  const response = await generate({
    dataset: dataset.train.blueprintChat,
    context: history,
    content,
    json_format: "{ response: <RESPONSE>, flow: [<FLOW>] }",
  });

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
  });

  return response;
}

async function blueprintToTask({
  history,
  content,
  knowledge,
  Blueprint,
}: {
  history?: {
    role: "system" | "user" | "assistant";
    content: string;
  }[];
  content: string;
  knowledge: Array<[]>;
  Blueprint: object;
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
  });

  return response;
}

async function blueprintDiamond({
  content,
  Blueprints,
}: {
  content: string;
  Blueprints: Array<[]>;
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
  const blueprintsData = await Blueprints({ agentId });

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

  const blueprintDecision = await blueprintDiamond({
    content: content,
    Blueprints: blueprintsData,
  });

  if (blueprintDecision.decision === "BLUEPRINT" && task.length === 0) {
    const blueprintData = await blueprintFn.get({
      blueprintId: blueprintDecision.blueprintId,
      includeLabels: false,
    });

    const blueprintToTaskResponse = await blueprintToTask({
      history: conversationsData,
      knowledge: knowledgeData,
      content: content,
      Blueprint: blueprintData,
    });

    await taskFn.create({
      agentId,
      description:
        blueprintToTaskResponse.task?.description ||
        blueprintToTaskResponse.task,
      blueprintId: blueprintDecision.blueprintId,
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
    });

    if (
      evaluation?.is_answer_known ||
      blueprintDecision.decision === "UNREVELANT"
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
        blueprintId: blueprintDecision.blueprintId,
        agentId,
      });
    }
  }
}

async function toPseudo({ content }: { content: string }) {
  const response = await generate({
    dataset: dataset.train.pseudocode,
    context: [],
    content,
    json_format: "{ pseudocode: <PSEUDO> }",
  });

  return response.pseudocode;
}

export default {
  teamChat,
  chat,
  task,
  step,
  Blueprint,
  blueprintName,
  evaluateSupervisionAnswer,
  toPseudo,
};
