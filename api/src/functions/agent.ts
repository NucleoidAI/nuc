import MCPs from "../mcps/mcps";
import actions from "../actions";
import colleague from "./colleague";
import dataset from "../dataset";
import { generate } from "../lib/llm";
import knowledgeFn from "./knowledge";
import mcpFn from "./mcp";
import message from "./message";
import messagesFunc from "./message";
import session from "./session";
import supervising from "./supervising";
import taskBluePrintFn from "./taskBluePrint";
import taskFn from "./task";

async function messages({ teamId }: { teamId: string }) {
  const messageInstances = await messagesFunc.listMessages({ teamId });

  return messageInstances
    .filter(
      (message) => message.role === "USER" || message.role === "ASSISTANT"
    )
    .map(({ role, content }) => ({ role: role.toLowerCase(), content }));
}

async function info({ agentId }) {
  const { name, description } = await colleague.get({ agentId });
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
        !taskId || !(knowledge.type === "TASK" && knowledge.taskId === taskId)
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

async function taskBluePrints({ agentId }) {
  const taskBluePrints = await taskBluePrintFn.list({ agentId });

  return {
    role: "system",
    content: {
      taskBluePrints,
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
      console.error(err);
    }
  }

  const { response } = await generate({
    context,
    content:
      next.resource && next.function && next.parameters
        ? `${next.resource}.${next.function}(${JSON.stringify(
            next.parameters
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
  const { agentId, description, sessionId } = await taskFn.get({ taskId });
  const currentTask = {
    description,
    steps: await taskFn.listSteps({ taskId }),
  };

  if (currentTask.steps.length > 10) {
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
        taskBluePrints({ agentId }),
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

    return await taskFn.update({
      taskId,
      result,
      comment,
      status: "COMPLETED",
    });
  } else if (action === "PLATFORM:user_interaction") {
    parameters.sessionId = sessionId;
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
  } else if (action === "SUPERVISED") {
    actionType = "SUPERVISED";
  } else if (action === "PLATFORM:user_interaction") {
    actionType = "INTERACTION";
  } else {
    actionType = "ACTION";
  }

  try {
    let actionFn;
    let result;
    let mcpClient;

    if (action === "SUPERVISED") {
      actionFn = require("../actions/supervised").default;
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
            ({ comment, result }) => `Comment: ${comment}\nResult: ${result}`
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
    } else {
      await taskFn.updateStep({
        stepId,
        result: resultString,
        status: "COMPLETED",
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

async function taskBluePrint({
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
    dataset: dataset.train.taskBluePrintChat,
    context: history,
    content,
    json_format: "{ response: <RESPONSE>, flow: [<FLOW>] }",
  });

  return response;
}

async function taskBluePrintName({
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
    dataset: dataset.train.taskBluePrintName,
    context: history,
    content,
    json_format: "{ title: <TITLE>, description: <DESCRIPTION> }",
  });
  return response;
}

async function taskBluePrintToTask({
  history,
  content,
  knowledge,
  taskBluePrint,
}: {
  history?: {
    role: "system" | "user" | "assistant";
    content: string;
  }[];
  content: string;
  knowledge: Array<[]>;
  taskBluePrint: object;
}) {
  const context = [
    {
      role: "system" as const,
      content: {
        taskBluePrint,
        knowledge,
        history,
      },
    },
  ];

  const response = await generate({
    dataset: dataset.train.taskBluePrint,
    context,
    content,
    json_format: "{ task: <TASK> ,answer: <ANSWER> }",
  });

  return response;
}

async function taskBluePrintDiamond({
  content,
  taskBluePrints,
}: {
  content: string;
  taskBluePrints: Array<[]>;
}) {
  const context = [
    {
      role: "system" as const,
      content: {
        taskBluePrints,
      },
    },
  ];

  const response = await generate({
    dataset: dataset.train.taskBluePrintDiamond,
    context,
    content,
    json_format:
      "{ decision: <DECISION>,existing: <EXISTING>,taskBluePrintId: <TASKBLUEPRINT_ID> }",
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
    dataset: dataset.train.taskBluePrintChatEvaluation,
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
  const taskBluePrintsData = await taskBluePrintFn.list({ agentId });

  const colleagueData = await colleague.get({ agentId });

  if (!colleagueData) {
    throw new Error("Colleague not found");
  }

  const task = await taskFn.list({
    teamId: colleagueData.teamId,
    agentId,
    status: "IN_PROGRESS",
    sessionId,
    includeSteps: true,
  });

  const waitingTask = task.find((task) =>
    task.steps.some((step) => step.status === "WAITING_FOR_USER")
  );

  if (waitingTask) {
    const waitingStep = waitingTask.steps.find(
      (step) => step.status === "WAITING_FOR_USER"
    );
    if (!waitingStep) {
      return;
    }

    await taskFn.updateStep({
      stepId: waitingStep.id,
      result: content,
      status: "COMPLETED",
    });

    await session.addConversation({
      sessionId,
      agentId,
      role: "USER",
      content,
    });

    return;
  }

  const taskBluePrintDecision = await taskBluePrintDiamond({
    content: content,
    taskBluePrints: taskBluePrintsData,
  });

  if (taskBluePrintDecision.decision === "TASKBLUEPRINT" && task.length === 0) {
    const taskBluePrintData = await taskBluePrintFn.get({
      taskBluePrintId: taskBluePrintDecision.taskBluePrintId,
    });

    const taskBluePrintToTaskResponse = await taskBluePrintToTask({
      history: conversationsData,
      knowledge: knowledgeData,
      content: content,
      taskBluePrint: taskBluePrintData,
    });

    await taskFn.create({
      agentId,
      description:
        taskBluePrintToTaskResponse.task?.description ||
        taskBluePrintToTaskResponse.task,
      taskBluePrintId: taskBluePrintDecision.taskBluePrintId,
      sessionId,
    });

    await session.addConversation({
      sessionId,
      agentId,
      role: "ASSISTANT",
      content: taskBluePrintToTaskResponse.answer,
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

    if (evaluation.is_answer_known) {
      const { answer, confidence } = await generate({
        policy: dataset.policy,
        dataset: dataset.train.chat,
        context,
        content,
        json_format: "{ answer: <ANSWER_IN_NLP>, confidence: <0-1> }",
      });

      console.debug(answer, confidence);

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
  taskBluePrint,
  taskBluePrintName,
  evaluateSupervisionAnswer,
  toPseudo,
};
