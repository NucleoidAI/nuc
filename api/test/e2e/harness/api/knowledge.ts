import { del, get, post } from "./client";
import type { Knowledge, KnowledgeInput } from "./types";

function create(knowledge: KnowledgeInput) {
  return post<Knowledge>("/knowledge", { body: knowledge });
}

function list({ agentId, type }: { agentId?: string; type?: string } = {}) {
  return get<Knowledge[]>("/knowledge", { query: { agentId, type } });
}

function read(knowledgeId: string) {
  return get<Knowledge>(`/knowledge/${knowledgeId}`);
}

function remove(knowledgeId: string) {
  return del<void>(`/knowledge/${knowledgeId}`);
}

async function textFor(agentId: string) {
  const knowledge = await list({ agentId });

  return knowledge
    .map((entry) => entry.text ?? entry.content ?? "")
    .filter(Boolean)
    .join("\n");
}

export default { create, list, read, remove, textFor };
