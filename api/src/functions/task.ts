import Agent from "../models/Agent";
import Step from "../models/Step";
import Task from "../models/Task";
import { event } from "@canmingir/link-express/event/client";

async function create({
  agentId,
  description,
  blueprintId,
  sessionId,
}: {
  agentId: string;
  description: string;
  blueprintId?: string;
  sessionId?: string;
}) {
  const task = await Task.create({
    agentId,
    description,
    status: "IN_PROGRESS",
    blueprintId,
    sessionId,
  });

  await event.publish("TASK_CREATED", {
    taskId: task.id,
    agentId,
    description,
    blueprintId,
    sessionId,
  });

  return task;
}

async function update({
  taskId,
  result,
  comment,
  status,
}: {
  taskId: string;
  result?: string;
  comment?: string;
  status: "COMPLETED" | "FAILED";
}) {
  await Task.update({ result, comment, status }, { where: { id: taskId } });

  if (status === "COMPLETED") {
    await event.publish("TASK_COMPLETED", { taskId, result, comment });
  }
}

async function get({ taskId }: { taskId: string }) {
  const taskInstance = await Task.findOne({ where: { id: taskId } });
  return taskInstance.toJSON();
}

async function getWithSteps({ taskId }: { taskId: string }) {
  const taskInstance = await Task.findOne({
    where: { id: taskId },
    include: [Step],
  });

  return taskInstance.toJSON();
}

async function list({
  teamId,
  agentId,
  status,
  sessionId,
  includeSteps,
}: {
  teamId: string;
  agentId?: string;
  status?: "IN_PROGRESS" | "COMPLETED" | "FAILED";
  sessionId?: string;
  includeSteps?: boolean;
}) {
  const where: {
    agentId?: string;
    status?: "IN_PROGRESS" | "COMPLETED" | "FAILED";
    sessionId?: string;
  } = {};

  if (agentId) {
    where.agentId = agentId;
  }

  if (status) {
    where.status = status;
  }

  if (sessionId) {
    where.sessionId = sessionId;
  }

  const taskInstances = await Task.findAll({
    include: includeSteps
      ? [
          {
            model: Agent,
            attributes: [],
            where: { teamId },
            required: true,
          },
          {
            model: Step,
            as: "steps",
          },
        ]
      : [],
    where,
  });

  return taskInstances.map((task) => task.toJSON());
}

async function addStep({
  taskId,
  action,
  parameters,
  comment,
}: {
  taskId: string;
  action: string;
  parameters: object;
  comment: string;
}) {
  const step = await Step.create({
    taskId,
    action,
    parameters,
    comment,
  });

  await event.publish("STEP_ADDED", {
    stepId: step.id,
    taskId,
    action,
    parameters,
    comment,
  });

  return step.toJSON();
}

async function getStep({ stepId }: { stepId: string }) {
  const step = await Step.findOne({ where: { id: stepId } });
  return step.toJSON();
}

async function updateStep({
  stepId,
  result,
  status,
}: {
  stepId: string;
  result: string;
  status:
    | "IN_PROGRESS"
    | "SUPERVISED_NEEDED"
    | "COMPLETED"
    | "FAILED"
    | "WAITING_FOR_USER";
}) {
  const { taskId, action, parameters } = await Step.findOne({
    where: { id: stepId },
  });
  const step = await Step.update(
    {
      result,
      status,
    },
    { where: { id: stepId } }
  );

  if (status === "COMPLETED") {
    await event.publish("STEP_COMPLETED", {
      taskId,
      stepId,
      action,
      parameters,
      result,
    });
  } else if (status === "FAILED") {
    await event.publish("STEP_FAILED", {
      taskId,
      stepId,
      action,
      parameters,
      result,
    });
  }

  return step;
}

async function listSteps({ taskId }: { taskId: string }) {
  const steps = await Step.findAll({
    where: { taskId },
  });

  return steps
    .map((step) => step.toJSON())
    .map((step) => ({
      ...step,
      result: step.result ? step.result.toString() : null,
    }));
}

export default {
  create,
  get,
  update,
  list,
  getStep,
  addStep,
  updateStep,
  listSteps,
};
