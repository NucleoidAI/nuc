import Conversation from "../models/Conversation";
import Session from "../models/Session";
import { event } from "@canmingir/link-express/event/client";
import { v4 as uuid } from "uuid";

async function create({
  id,
  type,
  agentId,
  blueprintId,
  variables,
  debug = false,
}: {
  id?: string;
  type: string;
  agentId: string;
  blueprintId?: string;
  variables?: Record<string, unknown>;
  debug?: boolean;
}) {
  const sessionId = id ?? uuid();

  const session = await Session.create({
    id: sessionId,
    type,
    agentId,
    ...(blueprintId && { blueprintId }),
    ...(variables && { variables }),
    debug,
  });

  await event.publish("SESSION_INITIATED", {
    id: sessionId,
    type,
    agentId,
    blueprintId,
    ...(variables && { variables }),
  });

  return session;
}

async function addConversation({
  sessionId,
  role,
  agentId,
  content,
  blueprintId,
}: {
  sessionId: string;
  agentId: string;
  role: string;
  content: string;
  blueprintId?: string;
}) {
  const session = await Session.findByPk(sessionId);

  if (!session) {
    throw new Error("Session not found");
  }

  const conversation = await Conversation.create({
    content,
    role,
    sessionId,
  });

  if (role === "USER") {
    await event.publish("SESSION_USER_MESSAGED", {
      agentId,
      sessionId,
      conversationId: conversation.id,
      content,
      ...(blueprintId && { blueprintId }),
    });
  } else {
    await event.publish("AI_ASSISTANT_MESSAGED", {
      agentId,
      sessionId,
      conversationId: conversation.id,
      content,
      ...(blueprintId && { blueprintId }),
    });
  }

  return conversation;
}

async function logConversation({
  sessionId,
  role,
  content,
}: {
  sessionId: string;
  role: "ASSISTANT" | "USER";
  content: string;
}) {
  const session = await Session.findByPk(sessionId);

  if (!session) {
    throw new Error("Session not found");
  }

  return await Conversation.create({
    content,
    role,
    sessionId,
  });
}

async function get({ sessionId }: { sessionId: string }) {
  return await Session.findByPk(sessionId);
}

async function listConversations({ sessionId }: { sessionId: string }) {
  return await Conversation.findAll({
    where: { sessionId },
    order: [["createdAt", "ASC"]],
  });
}

export default {
  create,
  get,
  addConversation,
  logConversation,
  listConversations,
};
