import storage from "../Storage";
import { whatsappConfig } from "./config";

type Conversation = {
  projectId: string;
  waId: string;
  phoneNumberId: string;
};

function conversationKey({ projectId, waId, phoneNumberId }: Conversation): string {
  return `whatsapp:conversation:${projectId}:${phoneNumberId}:${waId}`;
}

function sessionKey({ sessionId }: { sessionId: string }): string {
  return `whatsapp:session:${sessionId}`;
}

function rememberSession({
  conversation,
  sessionId,
}: {
  conversation: Conversation;
  sessionId: string;
}): void {
  const { sessionTtlMs } = whatsappConfig();

  storage.set(conversationKey(conversation), sessionId, sessionTtlMs);
  storage.set(sessionKey({ sessionId }), conversation, sessionTtlMs);
}

function findSessionId({ conversation }: { conversation: Conversation }): string | null {
  return storage.get(conversationKey(conversation));
}

function findConversation({ sessionId }: { sessionId: string }): Conversation | null {
  return storage.get(sessionKey({ sessionId }));
}

function forgetSession({ sessionId }: { sessionId: string }): void {
  const conversation = findConversation({ sessionId });

  if (conversation) {
    storage.delete(conversationKey(conversation));
  }

  storage.delete(sessionKey({ sessionId }));
}

function forgetConversation({ conversation }: { conversation: Conversation }): string | null {
  const sessionId = findSessionId({ conversation });

  storage.delete(conversationKey(conversation));

  if (sessionId) {
    storage.delete(sessionKey({ sessionId }));
  }

  return sessionId;
}

export { findConversation, findSessionId, forgetConversation, forgetSession, rememberSession };
export type { Conversation };
