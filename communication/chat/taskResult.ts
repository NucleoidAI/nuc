import { event } from "@canmingir/link-express/event/client";

type TaskResult = {
  status: "COMPLETED" | "FAILED" | "PENDING";
  result?: unknown;
  comment?: string;
};

const waiters = new Map<string, (outcome: TaskResult) => void>();

function settle(taskId: string, outcome: TaskResult) {
  waiters.get(taskId)?.(outcome);
}

function watch(taskId: string, timeoutMs: number) {
  let resolve!: (result: TaskResult) => void;
  const promise = new Promise<TaskResult>((r) => (resolve = r));

  const finish = (outcome: TaskResult) => {
    clearTimeout(timer);
    waiters.delete(taskId);
    resolve(outcome);
  };

  const timer = setTimeout(() => finish({ status: "PENDING" }), timeoutMs);

  waiters.set(taskId, finish);

  return {
    result: promise,
    settle: (outcome: TaskResult) => settle(taskId, outcome),
  };
}

async function setup(): Promise<void> {
  await event.subscribe<{ taskId: string; result?: unknown; comment?: string }>(
    "TASK_COMPLETED",
    async ({ taskId, result, comment }) => {
      settle(taskId, { status: "COMPLETED", result, comment });
    },
  );

  await event.subscribe<{ taskId: string; comment?: string }>(
    "TASK_FAILED",
    async ({ taskId, comment }) => {
      settle(taskId, { status: "FAILED", comment });
    },
  );
}

export default { setup, watch };
export type { TaskResult };
