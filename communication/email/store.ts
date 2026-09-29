import storage from "../Storage";
import { emailConfig } from "./config";

type Thread = {
  channelId: string;
  projectId: string;
  mailbox: string;
  threadId: string;
  from: string;
  fromName: string;
  subject: string;
  lastMessageId: string;
  references: string[];
};

function threadKey({ projectId, mailbox, threadId }: Thread): string {
  return `email:thread:${projectId}:${mailbox}:${threadId}`;
}

function sessionKey({ sessionId }: { sessionId: string }): string {
  return `email:session:${sessionId}`;
}

function rememberSession({
  thread,
  sessionId,
}: {
  thread: Thread;
  sessionId: string;
}): void {
  const { sessionTtlMs } = emailConfig();

  storage.set(threadKey(thread), sessionId, sessionTtlMs);
  storage.set(sessionKey({ sessionId }), thread, sessionTtlMs);
}

function findSessionId({ thread }: { thread: Thread }): string | null {
  return storage.get(threadKey(thread));
}

function findThread({ sessionId }: { sessionId: string }): Thread | null {
  return storage.get(sessionKey({ sessionId }));
}

function forgetSession({ sessionId }: { sessionId: string }): void {
  const thread = findThread({ sessionId });

  if (thread) {
    storage.delete(threadKey(thread));
  }

  storage.delete(sessionKey({ sessionId }));
}

export { findSessionId, findThread, forgetSession, rememberSession };
export type { Thread };
