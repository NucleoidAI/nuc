import { event } from "@canmingir/link-express/event/client";

type SessionResult = {
  status: "COMPLETED" | "FAILED" | "PENDING";
  result?: unknown;
  comment?: string;
  messages: string[];
};

type Waiter = {
  messages: string[];
  taskIds: Set<string>;
  finish: (outcome: Omit<SessionResult, "messages">) => void;
};

const waiters = new Map<string, Waiter>();
const taskSessions = new Map<string, string>();

function settle(
  sessionId: string | undefined,
  outcome: Omit<SessionResult, "messages">,
) {
  if (!sessionId) return;
  waiters.get(sessionId)?.finish(outcome);
}

function watch(sessionId: string, timeoutMs: number) {
  let resolve!: (result: SessionResult) => void;
  const promise = new Promise<SessionResult>((r) => (resolve = r));

  const waiter: Waiter = {
    messages: [],
    taskIds: new Set(),
    finish: (outcome) => {
      clearTimeout(timer);
      waiters.delete(sessionId);
      waiter.taskIds.forEach((taskId) => taskSessions.delete(taskId));
      resolve({ ...outcome, messages: waiter.messages });
    },
  };

  const timer = setTimeout(
    () => waiter.finish({ status: "PENDING" }),
    timeoutMs,
  );

  waiters.set(sessionId, waiter);

  return {
    result: promise,
    cancel: () => waiter.finish({ status: "PENDING" }),
  };
}

async function setup(): Promise<void> {
  await event.subscribe<{ taskId: string; sessionId?: string }>(
    "TASK_CREATED",
    async ({ taskId, sessionId }) => {
      const waiter = sessionId ? waiters.get(sessionId) : undefined;
      if (!waiter) return;
      waiter.taskIds.add(taskId);
      taskSessions.set(taskId, sessionId!);
    },
  );

  await event.subscribe<{ sessionId: string; content: string }>(
    "AI_ASSISTANT_MESSAGED",
    async ({ sessionId, content }) => {
      waiters.get(sessionId)?.messages.push(content);
    },
  );

  await event.subscribe<{ taskId: string; result?: unknown; comment?: string }>(
    "TASK_COMPLETED",
    async ({ taskId, result, comment }) => {
      settle(taskSessions.get(taskId), { status: "COMPLETED", result, comment });
    },
  );

  await event.subscribe<{ taskId: string; comment?: string }>(
    "TASK_FAILED",
    async ({ taskId, comment }) => {
      settle(taskSessions.get(taskId), { status: "FAILED", comment });
    },
  );

  await event.subscribe<{ sessionId: string; message: string }>(
    "ERROR_OCCURRED",
    async ({ sessionId, message }) => {
      settle(sessionId, { status: "FAILED", comment: message });
    },
  );
}

export default { setup, watch };
export type { SessionResult };
