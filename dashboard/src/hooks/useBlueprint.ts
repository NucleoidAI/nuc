import { convertToNodesAndEdges } from "../components/BlueprintFlow/flowAdapter";
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
  blueprintId?: string;
  dependencyId?: string | null;
};

function useBlueprint() {
  const { Api } = useApi();

  const [blueprintUpserted] = useEvent("TASK_BLUE_PRINT_UPSERTED", null);

  const getBlueprint = (fetchState: DependencyArray = []) => {
    const eventDependencies = [blueprintUpserted];

    const { data, loading, error, fetch } = Api(
      () => http.get(`/blueprints`),
      [...eventDependencies, ...fetchState]
    );

    if (data) {
      publish("TASK_BLUE_PRINT_LOADED", { Blueprint: data });
    }

    return {
      Blueprint: data,
      loading,
      error,
      fetch,
    };
  };

  const getBlueprintWithNode = (
    id: string,
    fetchState: DependencyArray = []
  ) => {
    const { data, loading, error, fetch } = Api(
      () => (id ? http.get(`/blueprints/${id}`) : null),
      [...fetchState]
    );
    let result;

    if (data) {
      result = convertToNodesAndEdges(data.nodes);

      publish("TASK_BLUE_PRINT_NODES_LOADED", {
        blueprintNodes: result,
      });
    }

    return {
      blueprintNodes: result,
      loading,
      error,
      fetch,
    };
  };

  const createBlueprint = async (
    title: string,
    description: string,
    agentId: string
  ) => {
    const response = await http.post("/blueprints", {
      title,
      description,
      agentId,
    });
    if (response?.data) {
      publish("TASK_BLUE_PRINT_CREATED", { Blueprint: response.data });
    }
    return { Blueprint: response?.data };
  };

  const upsertBlueprint = async (
    blueprintId: string,
    title: string,
    description: string,
    agentId: string,
    nodes?: NodeType[]
  ) => {
    if (!blueprintId) {
      blueprintId = uuidv4();
    }

    const response = await http.put(`/blueprints/${blueprintId}`, {
      title,
      description,
      nodes,
      agentId,
    });
    if (response?.data) {
      publish("TASK_BLUE_PRINT_UPSERTED", { Blueprint: response.data });
    }
    return { Blueprint: response?.data };
  };

  const removeBlueprint = async (blueprintId: string, agentId: string) => {
    const response = await http.delete(`/blueprints/${blueprintId}`, {
      data: {
        agentId,
      },
    });
    if (response?.data) {
      publish("TASK_BLUE_PRINT_REMOVED", { Blueprint: response.data });
    }
    return { Blueprint: response?.data };
  };

  return {
    getBlueprint,
    getBlueprintWithNode,
    createBlueprint,
    upsertBlueprint,
    removeBlueprint,
  };
}

export default useBlueprint;
