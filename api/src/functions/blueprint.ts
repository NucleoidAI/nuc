import BluePrint, { BlueprintContext } from "../models/Blueprint";

import BlueprintMessage from "../models/BlueprintMessage";
import { NotFoundError } from "@canmingir/link-express/error";
import agentFn from "./agent";
import { type BlueprintMode, applyModeNodes } from "../lib/apiNodes";
import * as pseudocode from "@canmingir/link-express/pseudocode";

type NodeType = {
  id: string;
  properties?: {
    label: string;
    icon: string;
    description?: string;
    instructions?: string;
    pseudocode?: string;
    pseudocodeEnabled?: boolean;
    targetAgentId?: string;
    targetBlueprintId?: string;
    force?: boolean;
    cases?: { nodeId: string; label?: string; description?: string }[];
  };
  type: string;
  next?: string[] | null;
  true?: string[] | null;
  false?: string[] | null;
  [key: string]: unknown;
};

const COSMETIC_PROPERTIES = [
  "label",
  "icon",
  "description",
  "pseudocodeEnabled",
];

function withoutCosmetics<T extends { properties?: object }>(nodes: T[]): T[] {
  return nodes.map((node) => {
    if (!node?.properties) {
      return node;
    }

    const properties = node.properties as Record<string, unknown>;
    const redundant = properties.pseudocode ? "instructions" : "pseudocode";

    return {
      ...node,
      properties: Object.fromEntries(
        Object.entries(properties).filter(
          ([key]) => key !== redundant && !COSMETIC_PROPERTIES.includes(key),
        ),
      ),
    };
  });
}

function stripDetails<T extends { nodes?: unknown }>(blueprint: T) {
  const { description, skill, context, ...rest } = blueprint as T & {
    description?: unknown;
    skill?: unknown;
    context?: unknown;
  };

  return Array.isArray(blueprint?.nodes)
    ? { ...rest, nodes: withoutCosmetics(blueprint.nodes) }
    : rest;
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
  context?: BlueprintContext,
  executionMode?: "NORMAL" | "LITE",
  mode?: BlueprintMode,
) {
  let Blueprint;

  const existingBlueprint = await BluePrint.findByPk(id);

  const effectiveMode = mode ?? existingBlueprint?.mode ?? "CHAT";
  const modeNodes = applyModeNodes(
    pseudocode.sanitize(nodes) ?? [],
    effectiveMode,
  );
  const sanitizedNodes = nodes || effectiveMode !== "CHAT" ? modeNodes : null;

  if (existingBlueprint) {
    await existingBlueprint.update({
      title,
      description,
      agentId,
      nodes: sanitizedNodes,
      ...(blocking !== undefined && { blocking }),
      ...(executionMode !== undefined && { executionMode }),
      ...(mode !== undefined && { mode }),
      ...(skill !== undefined && { skill }),
      ...(context !== undefined && { context }),
    });

    Blueprint = existingBlueprint;
  } else {
    Blueprint = await BluePrint.create({
      id,
      title,
      description,
      agentId,
      nodes: sanitizedNodes,
      ...(blocking !== undefined && { blocking }),
      ...(executionMode !== undefined && { executionMode }),
      ...(mode !== undefined && { mode }),
      ...(skill !== undefined && { skill }),
      ...(context !== undefined && { context }),
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
  includeDetails = true,
}: {
  agentId: string;
  includeDetails?: boolean;
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

  if (!includeDetails) {
    return blueprints.map(stripDetails);
  }

  return blueprints;
}

async function get({
  blueprintId,
  includeDetails = true,
}: {
  blueprintId: string;
  includeDetails?: boolean;
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

  if (!includeDetails) {
    return stripDetails(blueprint);
  }

  return blueprint;
}

async function patch({
  blueprintId,
  title,
  description,
  blocking,
  executionMode,
  skill,
  mode,
}: {
  blueprintId: string;
  title?: string;
  description?: string;
  blocking?: boolean;
  executionMode?: "NORMAL" | "LITE";
  skill?: string;
  mode?: BlueprintMode;
}) {
  const Blueprint = await BluePrint.findByPk(blueprintId);

  if (!Blueprint) {
    throw new NotFoundError();
  }

  await Blueprint.update({
    ...(title && { title }),
    ...(description && { description }),
    ...(blocking !== undefined && { blocking }),
    ...(executionMode !== undefined && { executionMode }),
    ...(skill !== undefined && { skill }),
    ...(mode !== undefined && {
      mode,
      nodes: applyModeNodes(Blueprint.nodes ?? [], mode),
    }),
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
  stripDetails,
  upsert,
  remove,
  list,
  get,
  patch,
  generateDescription,
  generateSkill,
};
