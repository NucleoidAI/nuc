import Agent from "../models/Agent";
import AgentKnowledge from "../models/AgentKnowledge";
import Knowledge from "../models/Knowledge";
import Supervising from "../models/Supervising";
import { Op, col, fn } from "sequelize";
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

async function dailyCounts({
  teamId,
  agentId,
  from,
  to,
}: {
  teamId: string;
  agentId?: string;
  from: string;
  to: string;
}) {
  const rows = await Supervising.findAll({
    attributes: [
      [fn("strftime", "%Y-%m-%d", col("Supervising.created_at")), "day"],
      [fn("COUNT", col("Supervising.id")), "count"],
    ],
    include: [
      {
        model: Agent,
        attributes: [],
        where: agentId ? { id: agentId, teamId } : { teamId },
        required: true,
      },
    ],
    where: { createdAt: { [Op.between]: [from, to] } },
    group: ["day"],
    raw: true,
  });

  return rows as unknown as Array<{ day: string; count: number }>;
}

export default { create, update, dailyCounts };
