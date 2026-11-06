import type { ApiCall } from "./ApiCallPanel";
import type { TimelineStep } from "./StepTimeline";
import http from "@canmingir/link/platform/http";

type SessionTask = {
  id: string;
  sessionId: string | null;
  blueprintId: string | null;
  description: string;
  status: "IN_PROGRESS" | "COMPLETED" | "FAILED";
  result: string | null;
  comment: string | null;
  createdAt: string;
};

type StepWithParameters = TimelineStep & { parameters?: unknown };

const API_REQUEST = "PLATFORM:api_request";

function parse(value: string | null) {
  if (value === null) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

async function loadApiCall(
  agentId: string,
  sessionId: string
): Promise<(ApiCall & { blueprintId: string | null }) | null> {
  const { data: tasks } = await http.get<SessionTask[]>(
    `/tasks?agentId=${agentId}`
  );

  const task = tasks
    .filter((item) => item.sessionId === sessionId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

  if (!task) return null;

  const { data: steps } = await http.get<StepWithParameters[]>(
    `/tasks/${task.id}/steps`
  );

  const request = steps.find(({ action }) => action === API_REQUEST)
    ?.parameters as Record<string, unknown> | undefined;

  const failed = task.status === "FAILED";
  const done = task.status !== "IN_PROGRESS";

  return {
    blueprintId: task.blueprintId,
    taskName: task.description,
    request: request ?? {},
    steps,
    done,
    failed,
    response: !done
      ? undefined
      : failed
      ? { error: "TASK_FAILED", message: task.comment }
      : parse(task.result),
  };
}

export { loadApiCall };
