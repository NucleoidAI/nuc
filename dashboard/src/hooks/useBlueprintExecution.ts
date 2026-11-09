import http from "@canmingir/link/platform/http";
import { loadApiCall } from "../widgets/AgentDevToolWidget/apiSession";
import { submitError } from "../widgets/AgentDevToolWidget/blueprintInputs";
import type {
  ApiCall,
  ApiStep,
} from "../widgets/AgentDevToolWidget/ApiCallPanel";
import { useCallback, useRef, useState } from "react";

const STEP_POLL_INTERVAL = 1000;

function useBlueprintExecution() {
  const [apiCall, setApiCall] = useState<ApiCall | null>(null);
  const runRef = useRef(0);

  const reset = useCallback(() => {
    runRef.current += 1;
    setApiCall(null);
  }, []);

  const execute = useCallback(
    async (blueprintId: string, values: Record<string, unknown>) => {
      const run = ++runRef.current;
      const active = () => run === runRef.current;
      const patch = (next: Partial<ApiCall>) => {
        if (active()) setApiCall((prev) => prev && { ...prev, ...next });
      };

      setApiCall({ request: values, steps: [], done: false });

      let taskId: string | undefined;
      let finished = false;

      const loadSteps = async (id: string) => {
        const { data } = await http.get<ApiStep[]>(`/tasks/${id}/steps`);
        patch({ steps: data });
      };

      const poll = async (id: string) => {
        while (!finished && active()) {
          await loadSteps(id).catch(() => undefined);
          await new Promise((resolve) =>
            setTimeout(resolve, STEP_POLL_INTERVAL)
          );
        }
      };

      let fieldErrors: ReturnType<typeof submitError> | undefined;

      try {
        const response = await http.post(
          `/execute/${blueprintId}?debug=true`,
          values
        );
        taskId = response.headers?.["x-task-id"] ?? taskId;
        if (taskId) poll(taskId);
        patch({ response: response.data });
      } catch (error) {
        const response = (
          error as {
            response?: {
              status: number;
              data?: { taskId?: string };
              headers?: Record<string, string>;
            };
          }
        )?.response;
        taskId =
          response?.headers?.["x-task-id"] ?? response?.data?.taskId ?? taskId;
        patch({
          failed: true,
          response:
            response?.data ??
            (error instanceof Error ? error.message : "Request failed"),
        });
        if (response?.status === 400) fieldErrors = submitError(error);
      }

      finished = true;

      if (taskId) {
        await loadSteps(taskId).catch(() => undefined);
        await http
          .get<{ description: string }>(`/tasks/${taskId}`)
          .then(({ data }) => patch({ taskName: data.description }))
          .catch(() => undefined);
      }
      patch({ done: true });

      return fieldErrors;
    },
    []
  );

  const start = useCallback(
    async (
      agentId: string,
      blueprintId: string,
      variables: Record<string, unknown>
    ) => {
      const run = ++runRef.current;
      const active = () => run === runRef.current;

      setApiCall({ request: variables, steps: [], done: false });

      let taskId: string;

      try {
        const { data } = await http.post<{ id: string }>("/tasks", {
          agentId,
          blueprintId,
          variables,
          debug: true,
        });
        taskId = data.id;
      } catch (error) {
        const response = (error as { response?: { data?: unknown } })?.response;
        if (active()) {
          setApiCall((prev) =>
            prev
              ? {
                  ...prev,
                  done: true,
                  failed: true,
                  response:
                    response?.data ??
                    (error instanceof Error ? error.message : "Request failed"),
                }
              : prev
          );
        }
        return submitError(error);
      }

      while (active()) {
        const call = await loadApiCall(taskId).catch(() => null);
        if (!active()) return;
        if (call) setApiCall(call);
        if (call?.done) return;
        await new Promise((resolve) => setTimeout(resolve, STEP_POLL_INTERVAL));
      }
    },
    []
  );

  return { apiCall, setApiCall, execute, start, reset, runRef };
}

export default useBlueprintExecution;
