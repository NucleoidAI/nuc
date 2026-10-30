import Agent from "../models/Agent";
import AgentKnowledge from "../models/AgentKnowledge";
import Knowledge from "../models/Knowledge";
import Supervising from "../models/Supervising";
import { Op } from "sequelize";
import { event } from "@canmingir/link-express/event/client";

async function create({
  sessionId,
  conversationId,
  question,
  blueprintId,
  agentId,
  taskId,
}: {
  sessionId: string;
  conversationId?: string;
  question: string;
  agentId: string;
  blueprintId?: string;
  taskId?: string;
}) {
  const supervising = await Supervising.create({
    sessionId,
    conversationId,
    question,
    agentId,
    blueprintId,
    taskId,
  });

  await event.publish("SUPERVISING_RAISED", {
    sessionId,
    conversationId,
    question,
    agentId,
    blueprintId,
    taskId,
  });

  return supervising;
}

async function update({
  teamId,
  supervisingId,
  agentId,
  question,
  answer,
  knowledge,
  status,
  taskId,
  blueprintId,
  type,
}: {
  teamId: string;
  supervisingId: string;
  status: "ANSWERED";
  agentId: string;
  question: string;
  answer: string;
  knowledge?: string;
  taskId?: string;
  blueprintId?: string;
  type?: "KNOWLEDGE" | "BLUEPRINT";
}) {
  await Supervising.update(
    { status, answer },
    { where: { id: supervisingId } }
  );

  const updatedSupervising = await Supervising.findByPk(supervisingId);
  const { sessionId } = updatedSupervising;

  if (type === "KNOWLEDGE") {
    const knowledgeInstance = await Knowledge.create({
      type: "TEXT",
      text: knowledge ?? answer,
      agentId,
      taskId,
      blueprintId,
      teamId,
    });
    try {
      await AgentKnowledge.create({
        knowledgeId: knowledgeInstance.id,
        agentId,
        teamId,
        blueprintId,
      });
    } catch (err: unknown) {
      if (
        !(err instanceof Error) ||
        err.name !== "SequelizeUniqueConstraintError"
      ) {
        throw err;
      }
    }

    const knowledgeJson = knowledgeInstance.toJSON();

    await event.publish("KNOWLEDGE", "CREATED", knowledgeJson);
  }

  await event.publish("SUPERVISING_ANSWERED", {
    sessionId,
    agentId,
    question,
    answer,
    type,
    taskId,
  });

  return updatedSupervising;
}

async function listWithAgents({
  teamId,
  agentId,
  status,
  from,
  to,
}: {
  teamId: string;
  agentId?: string;
  status?: "IN_PROGRESS" | "ANSWERED";
  from?: string;
  to?: string;
}) {
  const where: {
    agentId?: string;
    status?: "IN_PROGRESS" | "ANSWERED";
    createdAt?: { [Op.between]: [string, string] };
  } = {};

  if (agentId) {
    where.agentId = agentId;
  }

  if (status) {
    where.status = status;
  }

  if (from && to) {
    where.createdAt = { [Op.between]: [from, to] };
  }

  const supervisings = await Supervising.findAll({
    include: [
      {
        model: Agent,
        attributes: ["id", "name"],
        where: { teamId },
        required: true,
      },
    ],
    where,
    order: [["createdAt", "DESC"]],
  });

  return supervisings.map((supervising) => supervising.toJSON());
}

export default { create, update, listWithAgents };
