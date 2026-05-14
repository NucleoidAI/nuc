import http from "@canmingir/link/platform/http";
import useApi from "./useApi";
import { useState } from "react";

import { publish, useEvent } from "@nucleoidai/react-event";

export type TaskLog = {
  id: string;
  taskId: string;
  stepId: string | null;
  parameters: object | null;
  output: string | null;
  hallucinationScore: number | null;
  superviseScore: number | null;
  reviewScore: number | null;
  status: "COMPLETED" | "FAILED" | "SUPERVISED";
  createdAt: string;
};

function useTaskLogs() {
  const { Api } = useApi();
  const [scoreUpdated] = useEvent("TASK_LOG_SCORE_UPDATED", null);

  const getLogsByTask = (taskId: string) => {
    const { data, loading, error, fetch } = Api(
      () =>
        taskId
          ? http.get(`/task-logs?taskId=${taskId}`)
          : Promise.resolve({ data: [] }),
      [taskId, scoreUpdated]
    );

    return {
      logs: (data as TaskLog[]) ?? [],
      loading,
      error,
      fetch,
    };
  };

  const getLogsByStep = (stepId: string) => {
    const { data, loading, error, fetch } = Api(
      () =>
        stepId
          ? http.get(`/task-logs?stepId=${stepId}`)
          : Promise.resolve({ data: [] }),
      [stepId, scoreUpdated]
    );

    return {
      logs: (data as TaskLog[]) ?? [],
      loading,
      error,
      fetch,
    };
  };

  const updateSuperviseScore = async (logId: string, superviseScore: number) => {
    await http.patch(`/task-logs/${logId}`, { superviseScore });
    publish("TASK_LOG_SCORE_UPDATED", { logId, superviseScore });
  };

  return { getLogsByTask, getLogsByStep, updateSuperviseScore };
}

export default useTaskLogs;
