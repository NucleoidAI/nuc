import AgentKnowledge from "../models/AgentKnowledge";
import Knowledge from "../models/Knowledge";
import Supervising from "../models/Supervising";
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
  taskId?: string;
  blueprintId?: string;
  type?: "KNOWLEDGE" | "BLUEPRINT";
}) {
  await Supervising.update(
    { status, answer },
    { where: { id: supervisingId } },
  );

  const updatedSupervising = await Supervising.findByPk(supervisingId);
  const { sessionId, conversationId } = updatedSupervising;

  if (type === "KNOWLEDGE") {
    const knowledgeInstance = await Knowledge.create({
      type: "QA",
      question,
      answer,
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
    } catch (err: any) {
      if (err.name !== "SequelizeUniqueConstraintError") {
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

export default { create, update };
