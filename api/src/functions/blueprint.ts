import BluePrint from "../models/Blueprint";
import BlueprintMessage from "../models/BlueprintMessage";
import { NotFoundError } from "@canmingir/link-express/error";

type NodeType = {
  id: string;
  properties?: {
    label: string;
    icon: string;
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
  messages?: Array<{ role: string; content: string; createdAt: Date }>
) {
  let Blueprint;

  const existingBlueprint = await BluePrint.findByPk(id);

  if (existingBlueprint) {
    await existingBlueprint.update({
      title,
      description,
      agentId,
      nodes: nodes || null,
    });

    Blueprint = existingBlueprint;
  } else {
    Blueprint = await BluePrint.create({
      id,
      title,
      description,
      agentId,
      nodes: nodes || null,
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
      }))
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
                    ([key]) => key !== "label"
                  )
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
                  ([key]) => key !== "label"
                )
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
}: {
  blueprintId: string;
  pseudocode?: string;
  title?: string;
  description?: string;
}) {
  const Blueprint = await BluePrint.findByPk(blueprintId);

  if (!Blueprint) {
    throw new NotFoundError();
  }

  await Blueprint.update({
    ...(pseudocode && { pseudocode }),
    ...(title && { title }),
    ...(description && { description }),
  });

  return Blueprint.toJSON();
}

export default {
  getWithNodes,
  upsert,
  remove,
  list,
  get,
  patch,
};
