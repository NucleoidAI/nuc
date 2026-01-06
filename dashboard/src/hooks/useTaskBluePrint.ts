import { convertToNodesAndEdges } from "../components/TaskBluePrintFlow/flowAdapter";
import http from "@canmingir/link/platform/http";
import useApi from "./useApi";
import { v4 as uuidv4 } from "uuid";

import { publish, useEvent } from "@nucleoidai/react-event";

type DependencyArray = object[];

type NodeType = {
  id: string;
  properties?: {
    label: string;
    icon: string;
  };
  type: string;
  taskBluePrintId?: string;
  dependencyId?: string | null;
};

function useTaskBluePrint() {
  const { Api } = useApi();

  const [taskBluePrintUpserted] = useEvent("TASK_BLUE_PRINT_UPSERTED", null);

  const getTaskBluePrint = (fetchState: DependencyArray = []) => {
    const eventDependencies = [taskBluePrintUpserted];

    const { data, loading, error, fetch } = Api(
      () => http.get(`/taskblueprints`),
      [...eventDependencies, ...fetchState]
    );

    if (data) {
      publish("TASK_BLUE_PRINT_LOADED", { taskBluePrint: data });
    }

    return {
      taskBluePrint: data,
      loading,
      error,
      fetch,
    };
  };

  const getTaskBluePrintWithNode = (
    id: string,
    fetchState: DependencyArray = []
  ) => {
    const { data, loading, error, fetch } = Api(
      () => (id ? http.get(`/taskblueprints/${id}`) : null),
      [...fetchState]
    );
    let result;

    if (data) {
      result = convertToNodesAndEdges(data.nodes);

      publish("TASK_BLUE_PRINT_NODES_LOADED", {
        taskBluePrintNodes: result,
      });
    }

    return {
      taskBluePrintNodes: result,
      loading,
      error,
      fetch,
    };
  };

  const createTaskBluePrint = async (
    title: string,
    description: string,
    agentId: string
  ) => {
    const response = await http.post("/taskblueprints", {
      title,
      description,
      agentId,
    });
    if (response?.data) {
      publish("TASK_BLUE_PRINT_CREATED", { taskBluePrint: response.data });
    }
    return { taskBluePrint: response?.data };
  };

  const upsertTaskBluePrint = async (
    taskBluePrintId: string,
    title: string,
    description: string,
    agentId: string,
    nodes?: NodeType[]
  ) => {
    if (!taskBluePrintId) {
      taskBluePrintId = uuidv4();
    }

    const response = await http.put(`/taskblueprints/${taskBluePrintId}`, {
      title,
      description,
      nodes,
      agentId,
    });
    if (response?.data) {
      publish("TASK_BLUE_PRINT_UPSERTED", { taskBluePrint: response.data });
    }
    return { taskBluePrint: response?.data };
  };

  const removeTaskBluePrint = async (
    taskBluePrintId: string,
    agentId: string
  ) => {
    const response = await http.delete(`/taskblueprints/${taskBluePrintId}`, {
      data: {
        agentId,
      },
    });
    if (response?.data) {
      publish("TASK_BLUE_PRINT_REMOVED", { taskBluePrint: response.data });
    }
    return { taskBluePrint: response?.data };
  };

  return {
    getTaskBluePrint,
    getTaskBluePrintWithNode,
    createTaskBluePrint,
    upsertTaskBluePrint,
    removeTaskBluePrint,
  };
}

export default useTaskBluePrint;
