import { get, put } from "./client";
import type { Blueprint, BlueprintInput, BlueprintNode } from "./types";

function read(blueprintId: string) {
  return get<Blueprint>(`/blueprints/${blueprintId}`);
}

function upsert(blueprintId: string, blueprint: BlueprintInput) {
  return put<Blueprint>(`/blueprints/${blueprintId}`, { body: blueprint });
}

async function nodes(blueprintId: string) {
  return (await read(blueprintId)).nodes ?? [];
}

async function setNodes(
  blueprintId: string,
  nextNodes: BlueprintNode[] | unknown[],
  overrides: Partial<Pick<BlueprintInput, "title" | "description">> = {}
) {
  const { title, description, agentId } = await read(blueprintId);

  return upsert(blueprintId, {
    title: overrides.title ?? title,
    description: overrides.description ?? description,
    agentId,
    nodes: nextNodes,
  });
}

export default { read, upsert, nodes, setNodes };
