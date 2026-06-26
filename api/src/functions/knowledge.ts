import Agent from "../models/Agent";
import AgentKnowledge from "../models/AgentKnowledge";
import Knowledge from "../models/Knowledge";
import { NotFoundError } from "@canmingir/link-express/error";
import { Op } from "sequelize";
import Step from "../models/Step";
import Task from "../models/Task";
import { event } from "@canmingir/link-express/event/client";
import scrapper from "../actions/scrapper";

async function create({
  teamId,
  agentId,
  knowledge,
}: {
  teamId?: string;
  agentId?: string;
  knowledge: {
    type: "QA" | "URL" | "TEXT" | "TASK" | "DATA";
    url?: string;
    text?: string;
    question?: string;
    answer?: string;
    content?: string;
    taskId?: string;
    blueprintId?: string;
    organizationId?: string;
  };
}) {
  if (!teamId && !agentId) {
    throw new Error("INVALID_TEAM_OR_AGENT");
  }

  if (knowledge.type === "QA" && (!knowledge.question || !knowledge.answer)) {
    throw new Error("INVALID_QA_KNOWLEDGE");
  }

  if (knowledge.type === "URL" && !knowledge.url && knowledge.content) {
    throw new Error("INVALID_URL_KNOWLEDGE");
  }

  if (knowledge.type === "TEXT" && !knowledge.text) {
    throw new Error("INVALID_TEXT_KNOWLEDGE");
  }

  if (knowledge.type === "DATA") {
    if (!knowledge.text) {
      throw new Error("INVALID_DATA_KNOWLEDGE");
    }
    try {
      JSON.parse(knowledge.text);
    } catch {
      throw new Error("INVALID_DATA_KNOWLEDGE_JSON");
    }
  }

  if (knowledge.type === "URL" && knowledge.url) {
    knowledge.content = await scrapper.run({
      parameters: { url: knowledge.url },
    });
  }

  if (knowledge.type === "TASK" && !knowledge.taskId) {
    throw new Error("INVALID_TASK_KNOWLEDGE");
  }

  if (knowledge.type === "TASK") {
    const taskKnowledgeInstance = await Knowledge.findOne({
      where: {
        type: "TASK",
        taskId: knowledge.taskId,
      },
    });

    if (taskKnowledgeInstance) {
      return taskKnowledgeInstance.toJSON();
    }
  }

  const knowledgeInstance = await Knowledge.create(knowledge);
  await AgentKnowledge.create({
    knowledgeId: knowledgeInstance.id,
    agentId,
    teamId,
  });

  const knowledgeJson = knowledgeInstance.toJSON();
  const knowledgeData = {
    ...knowledgeJson,
    agentId,
    teamId,
    url: knowledgeJson.url || null,
    text: knowledgeJson.text || null,
    content: knowledgeJson.content || null,
    taskId: knowledgeJson.taskId || null,
    blueprintId: knowledgeJson.blueprintId || null,
    organizationId: knowledgeJson.organizationId || null,
  };

  await event.publish("KNOWLEDGE", "CREATED", knowledgeData);

  if (knowledgeData.taskId) {
    await event.publish("TASK_SUPERVISING_RESPONDED", {
      taskId: knowledgeData.taskId,
    });
  }

  return knowledgeInstance;
}

async function list({
  agentId,
  teamId,
  type,
  options = { includeSteps: false },
}: {
  teamId?: string;
  agentId?: string;
  type?: string;
  options?: { includeSteps?: boolean };
}) {
  const typeWhere = {} as {
    type?: string;
  };

  if (type) {
    typeWhere.type = type;
  }

  const knowledgeWhere: {
    agentId?: string;
    teamId?: string;
  }[] = [];

  if (agentId) {
    const agentInstance = await Agent.findByPk(agentId);

    if (!agentInstance) {
      throw new Error("INVALID_AGENT");
    }

    const teamId = agentInstance.toJSON().teamId;

    knowledgeWhere.push({ agentId });
    knowledgeWhere.push({ teamId });
  }

  if (teamId) {
    knowledgeWhere.push({ teamId });
  }

  const knowledgeInstances = await Knowledge.findAll({
    where: typeWhere,
    include: [
      {
        model: AgentKnowledge,
        where: {
          [Op.or]: knowledgeWhere,
        },
      },
      {
        model: Task,
        required: false,
        include: options.includeSteps
          ? {
              model: Step,
              as: "steps",
            }
          : [],
      },
    ],
  });

  const knowledgesInstances = knowledgeInstances
    .map((knowledge) => knowledge.toJSON())
    .map(({ AgentKnowledge, ...knowledgeData }) => ({
      ...knowledgeData,
      agentId: AgentKnowledge.agentId ? AgentKnowledge.agentId : null,
      teamId: AgentKnowledge.teamId ? AgentKnowledge.teamId : null,
      blueprintId: knowledgeData.blueprintId || null,
      organizationId: knowledgeData.organizationId || null,
      Task: knowledgeData.Task && {
        ...knowledgeData.Task,
        steps:
          knowledgeData.Task.steps &&
          knowledgeData.Task.steps.map((step) => ({
            ...step,
            result: step.result && step.result.toString(),
          })),
      },
    }));

  // await event.publish("KNOWLEDGES_LOADED", knowledgesInstances);

  return knowledgesInstances;
}

async function get({
  knowledgeId,
  includeAgent = false,
}: {
  knowledgeId: string;
  includeAgent?: boolean;
}) {
  const includeOptions: {
    model: typeof AgentKnowledge;
    attributes: string[];
    include: {
      model: typeof Agent;
      attributes: string[];
    }[];
  }[] = [];

  if (includeAgent) {
    includeOptions.push({
      model: AgentKnowledge,
      attributes: ["teamId", "agentId"],
      include: [
        {
          model: Agent,
          attributes: ["id", "teamId"],
        },
      ],
    });
  }

  const knowledgeItem = await Knowledge.findByPk(knowledgeId, {
    include: includeOptions,
  });

  if (!knowledgeItem) {
    throw new NotFoundError();
  }

  return knowledgeItem.toJSON();
}

export default { create, list, get };
