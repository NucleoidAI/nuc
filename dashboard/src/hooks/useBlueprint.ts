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

  const [blueprintUpserted] = useEvent("BLUEPRINT_UPSERTED", null);

  const getBlueprint = (fetchState: DependencyArray = []) => {
    const eventDependencies = [blueprintUpserted];

    const { data, loading, error, fetch } = Api(
      () => http.get(`/blueprints`),
      [...eventDependencies, ...fetchState]
    );

    if (data) {
      publish("BLUEPRINT_LOADED", { Blueprint: data });
    }

    return {
      Blueprint: data,
      loading,
      error,
      fetch,
    };
  };

  const getBlueprintWithId = (id: string, fetchState: DependencyArray = []) => {
    const { data, loading, error, fetch } = Api(
      () => (id ? http.get(`/blueprints/${id}`) : null),
      [...fetchState]
    );

    return {
      blueprint: data,
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

      publish("BLUEPRINT_NODES_LOADED", {
        blueprintNodes: result,
      });
    }

    return {
      blueprintNodes: data,
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
      publish("BLUEPRINT_CREATED", { Blueprint: response.data });
    }
    return { Blueprint: response?.data };
  };

  const upsertBlueprint = async (
    blueprintId: string,
    title: string,
    description: string,
    agentId: string,
    nodes?: NodeType[],
    taskId?: string
  ) => {
    if (!blueprintId) {
      blueprintId = uuidv4();
    }

    const response = await http.put(`/blueprints/${blueprintId}`, {
      title,
      description,
      nodes,
      agentId,
      taskId,
    });
    if (response?.data) {
      publish("BLUEPRINT_UPSERTED", { Blueprint: response.data });
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
      publish("BLUEPRINT_REMOVED", { Blueprint: response.data });
    }
    return { Blueprint: response?.data };
  };

  return {
    getBlueprint,
    getBlueprintWithNode,
    createBlueprint,
    upsertBlueprint,
    removeBlueprint,
    getBlueprintWithId,
  };
}

export default useBlueprint;
