import type { ApiCall } from "./ApiCallPanel";
import type { TimelineStep } from "./StepTimeline";
import http from "@canmingir/link/platform/http";

type ApiTask = {
  id: string;
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
  taskId: string
): Promise<(ApiCall & { blueprintId: string | null }) | null> {
  const [{ data: task }, { data: steps }] = await Promise.all([
    http.get<ApiTask>(`/tasks/${taskId}`),
    http.get<StepWithParameters[]>(`/tasks/${taskId}/steps`),
  ]);

  if (!task) return null;

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
