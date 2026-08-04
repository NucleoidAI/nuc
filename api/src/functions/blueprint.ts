import BluePrint from "../models/Blueprint";
import BlueprintMessage from "../models/BlueprintMessage";
import { NotFoundError } from "@canmingir/link-express/error";
import agentFn from "./agent";

type NodeType = {
  id: string;
  properties?: {
    label: string;
    icon: string;
    prompt?: string;
    description?: string;
    pseudocode?: string;
    targetAgentId?: string;
    targetBlueprintId?: string;
    force?: boolean;
  };
  type: string;
  next?: string[] | null;
  true?: string[] | null;
  false?: string[] | null;
};

async function getWithNodes(id: string) {
  if (!id) {
    throw new Error("ID is required");
  }

  const Blueprint = await BluePrint.findOne({
    where: {
      id,
    },
    include: [
      {
        model: BlueprintMessage,
        as: "messages",
      },
    ],
  });

  if (!Blueprint) {
    throw new NotFoundError();
  }

  return Blueprint.toJSON();
}

async function upsert(
  title: string,
  description: string,
  agentId: string,
  id: string,
  nodes?: NodeType[],
  messages?: Array<{ role: string; content: string; createdAt: Date }>,
  blocking?: boolean,
  skill?: string,
) {
  let Blueprint;

  const existingBlueprint = await BluePrint.findByPk(id);

  if (existingBlueprint) {
    await existingBlueprint.update({
      title,
      description,
      agentId,
      nodes: nodes || null,
      ...(blocking !== undefined && { blocking }),
      ...(skill !== undefined && { skill }),
    });

    Blueprint = existingBlueprint;
  } else {
    Blueprint = await BluePrint.create({
      id,
      title,
      description,
      agentId,
      nodes: nodes || null,
      ...(blocking !== undefined && { blocking }),
      ...(skill !== undefined && { skill }),
    });
  }

  if (messages?.length) {
    await BlueprintMessage.destroy({
      where: { blueprintId: id },
    });

    await BlueprintMessage.bulkCreate(
      messages.map((msg) => ({
        blueprintId: id,
        content: msg.content,
        role: msg.role,
        createdAt: msg.createdAt,
      })),
    );
  }

  return {
    ...Blueprint.toJSON(),
    Nodes: nodes || [],
  };
}

async function remove({ blueprintId }: { blueprintId: string }) {
  await BluePrint.destroy({
    where: { id: blueprintId },
  });
}

async function list({
  agentId,
  includeLabels = true,
}: {
  agentId: string;
  includeLabels?: boolean;
}) {
  const Blueprints = await BluePrint.findAll({
    where: { agentId },
    include: [
      {
        model: BlueprintMessage,
        as: "messages",
      },
    ],
  });

  const blueprints = Blueprints.map((Blueprint) => Blueprint.toJSON());

  if (!includeLabels) {
    return blueprints.map((Blueprint) => ({
      ...Blueprint,
      nodes: Array.isArray(Blueprint.nodes)
        ? Blueprint.nodes.map((node) => ({
            ...node,
            properties: node?.properties
              ? Object.fromEntries(
                  Object.entries(node.properties).filter(
                    ([key]) => key !== "label",
                  ),
                )
              : node?.properties,
          }))
        : Blueprint.nodes,
    }));
  }

  return blueprints;
}

async function get({
  blueprintId,
  includeLabels = true,
}: {
  blueprintId: string;
  includeLabels?: boolean;
}) {
  const Blueprint = await BluePrint.findByPk(blueprintId, {
    include: [
      {
        model: BlueprintMessage,
        as: "messages",
      },
    ],
  });

  if (!Blueprint) {
    throw new NotFoundError();
  }

  const blueprint = Blueprint.toJSON();

  if (!includeLabels) {
    blueprint.nodes = Array.isArray(blueprint.nodes)
      ? blueprint.nodes.map((node) => ({
          ...node,
          properties: node?.properties
            ? Object.fromEntries(
                Object.entries(node.properties).filter(
                  ([key]) => key !== "label",
                ),
              )
            : node?.properties,
        }))
      : blueprint.nodes;
  }

  return blueprint;
}

async function patch({
  blueprintId,
  pseudocode,
  title,
  description,
  blocking,
  skill,
}: {
  blueprintId: string;
  pseudocode?: string;
  title?: string;
  description?: string;
  blocking?: boolean;
  skill?: string;
}) {
  const Blueprint = await BluePrint.findByPk(blueprintId);

  if (!Blueprint) {
    throw new NotFoundError();
  }

  await Blueprint.update({
    ...(pseudocode && { pseudocode }),
    ...(title && { title }),
    ...(description && { description }),
    ...(blocking !== undefined && { blocking }),
    ...(skill !== undefined && { skill }),
  });

  return Blueprint.toJSON();
}

async function upsertPseudocode({
  id,
  title,
  description,
  agentId,
  nodes,
  messages,
  blocking,
  skill,
}: {
  id: string;
  title: string;
  description: string;
  agentId: string;
  nodes?: NodeType[];
  messages?: Array<{ role: string; content: string; createdAt: Date }>;
  blocking?: boolean;
  skill?: string;
}) {
  const existingNodes = new Map(
    (await BluePrint.findByPk(id))?.nodes?.map((n) => [n.id, n]) || [],
  );

  const [pseudocode, nodesWithPseudocode] = await Promise.all([
    agentFn.toPseudo({ content: description, meta: { agentId } }),
    nodes
      ? Promise.all(
          nodes.map((node) => {
            const content = node.properties?.prompt;
            if (!content) return node;
            const prev = existingNodes.get(node.id);
            const prevContent = prev?.properties?.prompt;
            if (prev?.properties?.pseudocode && prevContent === content) {
              return {
                ...node,
                properties: {
                  ...node.properties,
                  pseudocode: prev.properties.pseudocode,
                },
              } as typeof node;
            }
            return agentFn.toPseudo({ content, meta: { agentId } }).then(
              (nodePseudocode) =>
                ({
                  ...node,
                  properties: {
                    ...node.properties,
                    pseudocode: nodePseudocode,
                  },
                } as typeof node),
            );
          }),
        )
      : undefined,
  ]);

  const result = await upsert(
    title,
    description,
    agentId,
    id,
    nodesWithPseudocode,
    messages,
    blocking,
    skill,
  );

  await patch({ blueprintId: id, pseudocode });

  return { ...result, pseudocode };
}

async function generateDescription({ nodes }: { nodes: NodeType[] }) {
  if (!nodes?.length) {
    return "";
  }

  return agentFn.blueprintDescription({ nodes });
}

async function generateSkill({ nodes }: { nodes: NodeType[] }) {
  if (!nodes?.length) {
    return "";
  }

  return agentFn.blueprintSkill({ nodes });
}

export default {
  getWithNodes,
  upsert,
  upsertPseudocode,
  remove,
  list,
  get,
  patch,
  generateDescription,
  generateSkill,
};
