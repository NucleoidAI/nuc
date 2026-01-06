import { NotFoundError } from "@canmingir/link-express/error";
import TaskBluePrint from "../models/TaskBluePrint";

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

  const taskBluePrint = await TaskBluePrint.findOne({
    where: {
      id,
    },
  });

  if (!taskBluePrint) {
    throw new NotFoundError();
  }

  return taskBluePrint.toJSON();
}

async function upsert(
  title: string,
  description: string,
  agentId: string,
  id: string,
  nodes?: NodeType[]
) {
  let taskBluePrint;

  const existingTaskBluePrint = await TaskBluePrint.findByPk(id);

  if (existingTaskBluePrint) {
    await existingTaskBluePrint.update({
      title,
      description,
      agentId,
      nodes: nodes || null,
    });

    taskBluePrint = existingTaskBluePrint;
  } else {
    taskBluePrint = await TaskBluePrint.create({
      id,
      title,
      description,
      agentId,
      nodes: nodes || null,
    });
  }

  return {
    ...taskBluePrint.toJSON(),
    Nodes: nodes || [],
  };
}

async function remove({ taskBluePrintId }: { taskBluePrintId: string }) {
  await TaskBluePrint.destroy({
    where: { id: taskBluePrintId },
  });
}

async function list({ agentId }: { agentId: string }) {
  const taskBluePrints = await TaskBluePrint.findAll({
    where: { agentId },
  });

  return taskBluePrints.map((taskBluePrint) => taskBluePrint.toJSON());
}

async function get({ taskBluePrintId }: { taskBluePrintId: string }) {
  const taskBluePrint = await TaskBluePrint.findByPk(taskBluePrintId);

  if (!taskBluePrint) {
    throw new NotFoundError();
  }

  return taskBluePrint.toJSON();
}

async function patch({
  taskBluePrintId,
  pseudocode,
  title,
  description,
}: {
  taskBluePrintId: string;
  pseudocode?: string;
  title?: string;
  description?: string;
}) {
  const taskBluePrint = await TaskBluePrint.findByPk(taskBluePrintId);

  if (!taskBluePrint) {
    throw new NotFoundError();
  }

  await taskBluePrint.update({
    ...(pseudocode && { pseudocode }),
    ...(title && { title }),
    ...(description && { description }),
  });

  return taskBluePrint.toJSON();
}

export default {
  getWithNodes,
  upsert,
  remove,
  list,
  get,
  patch,
};
