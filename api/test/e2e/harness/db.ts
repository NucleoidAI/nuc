import { TEAM_ID } from "../fixtures/ids";

/* eslint-disable @typescript-eslint/no-var-requires */
function models() {
  return {
    Knowledge: require("../../../src/models/Knowledge").default,
    AgentKnowledge: require("../../../src/models/AgentKnowledge").default,
    Blueprint: require("../../../src/models/Blueprint").default,
  };
}
/* eslint-enable @typescript-eslint/no-var-requires */

type KnowledgeInput = {
  type: "URL" | "TEXT" | "QA" | "TASK" | "DATA";
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

async function insertKnowledge({
  agentId,
  teamId = TEAM_ID,
  ...knowledge
}: KnowledgeInput) {
  const { Knowledge, AgentKnowledge } = models();

  const knowledgeInstance = await Knowledge.create(knowledge);

  await AgentKnowledge.create({
    knowledgeId: knowledgeInstance.id,
    agentId,
    teamId,
  });

  return knowledgeInstance.toJSON();
}

async function knowledgeFor(agentId: string) {
  const { Knowledge, AgentKnowledge } = models();

  const links = await AgentKnowledge.findAll({ where: { agentId } });

  const rows = await Knowledge.findAll({
    where: { id: links.map((link: any) => link.knowledgeId) },
  });

  return rows.map((row: any) => row.toJSON());
}

/**
 * Rewrites a blueprint's nodes the way the supervising drawer does when a
 * supervisor answers with a reshaped flow, without going through the API.
 */
async function updateBlueprintNodes({
  blueprintId,
  nodes,
  title,
  description,
}: {
  blueprintId: string;
  nodes: unknown[];
  title?: string;
  description?: string;
}) {
  const { Blueprint } = models();

  await Blueprint.update(
    {
      nodes,
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
    },
    { where: { id: blueprintId } }
  );
}

async function blueprintNodes(blueprintId: string) {
  const { Blueprint } = models();

  const blueprint = await Blueprint.findByPk(blueprintId);

  return (blueprint?.toJSON().nodes ?? []) as Array<{
    id: string;
    type: string;
  }>;
}

export { insertKnowledge, knowledgeFor, updateBlueprintNodes, blueprintNodes };
