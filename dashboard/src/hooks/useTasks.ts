import http from "@canmingir/link/platform/http";
import { normalizeResult } from "../utils/formatters";
import useApi from "./useApi";
import { useState } from "react";

import { publish, useEvent } from "@nucleoidai/react-event";

type DependencyArray = object[];

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

  const createTaskSupervising = async (
    id: string,
    text: string,
    addToKnowledgeBase: boolean
  ) => {
    try {
      const response = await http.post(`/tasks/${id}/supervising`, {
        agentId,
        text,
        addToKnowledgeBase,
      });

      return response?.data;
    } catch (error) {
      return null;
    }
  };

  return {
    tasks: result.tasks,
    loading: result.loading,
    error: result.error,
    steps: currentSteps,
    stepsLoading,
    getSteps,
    createTask,
    createTaskSupervising,
  };
}

export default useTasks;
