type KnowledgeType = "QA" | "URL" | "TEXT" | "DATA";

type KnowledgeInput = {
  type: KnowledgeType;
  agentId?: string;
  teamId?: string;
  url?: string;
  text?: string;
  question?: string;
  answer?: string;
  taskId?: string;
  blueprintId?: string;
  organizationId?: string;
};

type Knowledge = {
  id: string;
  type: KnowledgeType;
  agentId: string | null;
  teamId: string | null;
  url: string | null;
  text: string | null;
  content: string | null;
  question?: string | null;
  answer?: string | null;
};

type BlueprintNode = {
  id: string;
  type: string;
  properties?: Record<string, unknown>;
  next?: string[] | null;
  true?: string[] | null;
  false?: string[] | null;
};

type Blueprint = {
  id: string;
  title: string;
  description: string;
  agentId: string;
  nodes: BlueprintNode[] | null;
  blocking?: boolean;
  skill?: string;
};

type BlueprintInput = {
  title: string;
  description: string;
  agentId: string;
  nodes?: unknown[];
  blocking?: boolean;
  skill?: string;
};

export type {
  Blueprint,
  BlueprintInput,
  BlueprintNode,
  Knowledge,
  KnowledgeInput,
  KnowledgeType,
};
