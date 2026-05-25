import http from "@canmingir/link/platform/http";
import useApi from "./useApi";

import { publish, useEvent } from "@nucleoidai/react-event";

export type TaskScore = {
  id: string;
  taskId: string;
  stepId: string | null;
  parameters: object | null;
  output: string | null;
  hallucinationScore: number | null;
  knowledgeScore: number | null;
  superviseScore: number | null;
  resultScore: number | null;
  status: "COMPLETED" | "FAILED" | "SUPERVISED";
  createdAt: string;
};

function useTaskScores() {
  const { Api } = useApi();
  const [scoreUpdated] = useEvent("TASK_SCORE_UPDATED", null);

  const getScoresByTask = (taskId: string) => {
    const { data, loading, error, fetch } = Api(
      () =>
        taskId
          ? http.get(`/step-scores?taskId=${taskId}`)
          : Promise.resolve({ data: [] }),
      [taskId, scoreUpdated]
    );

    return {
      scores: (data as TaskScore[]) ?? [],
      loading,
      error,
      fetch,
    };
  };

  const getScoresByStep = (stepId: string) => {
    const { data, loading, error, fetch } = Api(
      () =>
        stepId
          ? http.get(`/step-scores?stepId=${stepId}`)
          : Promise.resolve({ data: [] }),
      [stepId, scoreUpdated]
    );

    return {
      scores: (data as TaskScore[]) ?? [],
      loading,
      error,
      fetch,
    };
  };

  const updateSuperviseScore = async (
    scoreId: string,
    superviseScore: number
  ) => {
    await http.patch(`/step-scores/${scoreId}`, { superviseScore });
    publish("TASK_SCORE_UPDATED", { scoreId, superviseScore });
  };

  const deleteSuperviseScore = async (scoreId: string) => {
    await http.delete(`/step-scores/${scoreId}/supervise-score`);
    publish("TASK_SCORE_UPDATED", { scoreId, superviseScore: null });
  };

  return {
    getScoresByTask,
    getScoresByStep,
    updateSuperviseScore,
    deleteSuperviseScore,
  };
}

export default useTaskScores;
