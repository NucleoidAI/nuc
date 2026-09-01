import BluePrint from "../models/Blueprint";
import BlueprintMessage from "../models/BlueprintMessage";
import { NotFoundError } from "@canmingir/link-express/error";
import agentFn from "./agent";

type NodeType = {
  id: string;
  properties?: {
    label: string;
    icon: string;
    description?: string;
    targetAgentId?: string;
    targetBlueprintId?: string;
    force?: boolean;
  };
  type: string;
  next?: string[] | null;
  true?: string[] | null;
  false?: string[] | null;
};

const COSMETIC_PROPERTIES = ["label"];

function withoutCosmetics<T extends { properties?: object }>(nodes: T[]): T[] {
  return nodes.map((node) => ({
    ...node,
    properties: node?.properties
      ? Object.fromEntries(
          Object.entries(node.properties).filter(
            ([key]) => !COSMETIC_PROPERTIES.includes(key)
          )
        )
      : node?.properties,
  }));
}

function stripCosmetics<T extends { nodes?: unknown }>(blueprint: T): T {
  if (!Array.isArray(blueprint?.nodes)) {
    return blueprint;
  }

  return { ...blueprint, nodes: withoutCosmetics(blueprint.nodes) };
}

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
  includeCosmetics = true,
}: {
  agentId: string;
  includeCosmetics?: boolean;
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

  if (!includeCosmetics) {
    return blueprints.map(stripCosmetics);
  }

  return blueprints;
}

async function get({
  blueprintId,
  includeCosmetics = true,
}: {
  blueprintId: string;
  includeCosmetics?: boolean;
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

  if (!includeCosmetics) {
    return stripCosmetics(blueprint);
  }

  return blueprint;
}

async function patch({
  blueprintId,
  title,
  description,
  blocking,
  skill,
}: {
  blueprintId: string;
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
    ...(title && { title }),
    ...(description && { description }),
    ...(blocking !== undefined && { blocking }),
    ...(skill !== undefined && { skill }),
  });

  return Blueprint.toJSON();
}

async function generateDescription({ nodes }: { nodes: NodeType[] }) {
  if (!nodes?.length) {
    return "";
  }

  return agentFn.blueprintDescription({ nodes: withoutCosmetics(nodes) });
}

async function generateSkill({ nodes }: { nodes: NodeType[] }) {
  if (!nodes?.length) {
    return "";
  }

  return agentFn.blueprintSkill({ nodes: withoutCosmetics(nodes) });
}

export default {
  getWithNodes,
  stripCosmetics,
  upsert,
  remove,
  list,
  get,
  patch,
  generateDescription,
  generateSkill,
};
