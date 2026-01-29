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

async function list({ agentId }: { agentId: string }) {
  const Blueprints = await BluePrint.findAll({
    where: { agentId },
    include: [
      {
        model: BlueprintMessage,
        as: "messages",
      },
    ],
  });

  return Blueprints.map((Blueprint) => Blueprint.toJSON());
}

async function get({ blueprintId }: { blueprintId: string }) {
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

  return Blueprint.toJSON();
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
