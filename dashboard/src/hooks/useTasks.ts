import http from "@canmingir/link/platform/http";
import { normalizeResult } from "../utils/formatters";
import useApi from "./useApi";
import { useState } from "react";

import { publish, useEvent } from "@nucleoidai/react-event";

type DependencyArray = object[];

type EffectiveTaskStatus =
  | "IN_PROGRESS"
  | "COMPLETED"
  | "FAILED"
  | "AWAITING"
  | "PINNED";

function useTasks(agentId: string, initialFetchState: DependencyArray = []) {
  const { Api } = useApi();

  const [taskStatus] = useEvent("TASK_STATUS_CHANGED", null);
  const [taskCreated] = useEvent("TASK_CREATED", null);
  const [taskStepLoading] = useEvent("TASK_STEP_LOADED", null);

  const [currentSteps, setCurrentSteps] = useState([]);
  const [stepsLoading, setStepsLoading] = useState(false);

  const getTasks = (fetchState: DependencyArray = []) => {
    const eventDependencies = [taskStatus, taskCreated, taskStepLoading];

    const { data, loading, error, fetch } = Api(
      () =>
        agentId
          ? http.get(`/tasks?agentId=${agentId}`)
          : Promise.resolve({ data: [] }),
      [agentId, ...eventDependencies, ...fetchState]
    );

    const tasks = Array.isArray(data)
      ? data.map((t) => ({
          ...t,
          result: normalizeResult(t.result),
        }))
      : [];

    if (data) publish("TASK_LOADED", data);

    return { tasks, loading, error, fetch };
  };

  const result = getTasks(initialFetchState);

  const getSteps = async (id: string) => {
    if (!id) return;

    setStepsLoading(true);
    try {
      const response = await http.get(`/tasks/${id}/steps`);
      setCurrentSteps(response.data);
      publish("TASK_STEP_LOADED", response.data);
      setStepsLoading(false);
      return response.data;
    } catch (error) {
      setStepsLoading(false);
      return [];
    }
  };

  const createTask = async (task: string, agentId: string) => {
    try {
      const response = await http.post(`/tasks`, {
        description: task,
        agentId: agentId,
      });

      if (response && response.data) {
        publish("TASK_CREATED", response.data);
      }

      return response?.data;
    } catch (error) {
      return null;
    }
  };

  const updateStepComment = async (
    taskId: string,
    stepId: string,
    comment: string | null
  ) => {
    await http.patch(`/tasks/${taskId}/steps/${stepId}`, { comment });
    publish("STEP_COMMENT_UPDATED", { stepId, comment });
  };

  const getTasksWithAgents = (
    params: {
      status?: "IN_PROGRESS" | "COMPLETED" | "FAILED";
      from?: string;
      to?: string;
    } = {}
  ) => {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    if (params.from) query.set("from", params.from);
    if (params.to) query.set("to", params.to);
    const queryString = query.toString();

    const path = agentId ? `/tasks/agents/${agentId}` : "/tasks/agents";

    const { data, loading, error, fetch } = Api(
      () => http.get(`${path}${queryString ? `?${queryString}` : ""}`),
      [agentId, params.status, params.from, params.to, taskStatus, taskCreated]
    );

    return {
      tasks:
        (data as {
          id: string;
          description: string;
          status: "IN_PROGRESS" | "COMPLETED" | "FAILED";
          effectiveStatus: EffectiveTaskStatus;
          comment: string | null;
          createdAt: string;
          Agent: { id: string; name: string };
          durationMs: number;
          inputTokens: number;
          outputTokens: number;
          totalTokens: number;
        }[]) ?? [],
      loading,
      error,
      fetch,
    };
  };

  return {
    tasks: result.tasks,
    loading: result.loading,
    error: result.error,
    getTasks: result.fetch,
    steps: currentSteps,
    stepsLoading,
    getSteps,
    createTask,
    updateStepComment,
    getTasksWithAgents,
  };
}

export default useTasks;
