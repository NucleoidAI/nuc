import ColleagueKnowledge from "../models/ColleagueKnowledge";
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
}: {
  teamId: string;
  supervisingId: string;
  status: "ANSWERED";
  agentId: string;
  question: string;
  answer: string;
}) {
  await Supervising.update(
    { status, answer },
    { where: { id: supervisingId } }
  );

  const updatedSupervising = await Supervising.findByPk(supervisingId);
  const { sessionId, conversationId } = updatedSupervising;

  const knowledgeInstance = await Knowledge.create({
    type: "QA",
    question,
    answer,
    agentId,
  });
  await ColleagueKnowledge.create({
    knowledgeId: knowledgeInstance.id,
    agentId,
    teamId,
  });

  await event.publish("SUPERVISING_ANSWERED", {
    teamId,
    supervisingId,
    sessionId,
    conversationId,
    agentId,
    question,
    answer,
    status,
  });

  return updatedSupervising;
}

export default { create, update };
