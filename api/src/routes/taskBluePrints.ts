import { AuthenticationError } from "@canmingir/link-express/error";
import Colleague from "../models/Colleague";
import TaskBluePrint from "../models/TaskBluePrint";
import TaskBluePrintSchema from "../schemas/TaskBluePrint";
import agent from "../functions/agent";
import colleague from "../functions/colleague";
import { event } from "@canmingir/link-express/event/client";
import express from "express";
import taskBluePrint from "../functions/taskBluePrint";

const router = express.Router();

router.get("/", async (req, res) => {
  const { projectId: teamId } = req.session;

  if (!teamId) {
    return res.status(400);
  }

  const taskBluePrints = await TaskBluePrint.findAll({
    include: [
      {
        model: Colleague,
        where: { teamId },
        attributes: [],
      },
    ],
  });

  res.status(200).json(taskBluePrints);
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const { projectId: teamId } = req.session;

  if (!teamId) {
    return res.status(400);
  }

  const taskBluePrintWithNodes = await taskBluePrint.getWithNodes(id);

  res.status(200).json(taskBluePrintWithNodes);
});

router.put("/:taskBluePrintId", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { taskBluePrintId } = req.params;
  const { title, description, agentId, nodes } =
    TaskBluePrintSchema.upsert.parse(req.body);

  if (agentId) {
    const { teamId: colleagueTeamId } = await colleague.get({
      agentId,
    });

    if (teamId !== colleagueTeamId) {
      throw new AuthenticationError();
    }
  }

  const result = await taskBluePrint.upsert(
    title,
    description,
    agentId,
    taskBluePrintId,
    nodes
  );

  const pseudocode = await agent.toPseudo({
    content: result.description,
  });

  await taskBluePrint.patch({
    taskBluePrintId,
    pseudocode,
  });

  await event.publish("TASK_BLUE_PRINT_CREATED", {
    taskBluePrint: { ...result, pseudocode },
  });

  res.status(200).json(result);
});

router.delete("/:taskBluePrintId", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { taskBluePrintId } = req.params;

  const { agentId } = TaskBluePrintSchema.delete.parse(req.body);

  if (agentId) {
    const { teamId: colleagueTeamId } = await colleague.get({
      agentId,
    });

    if (teamId !== colleagueTeamId) {
      throw new AuthenticationError();
    }
  }

  await taskBluePrint.remove({ taskBluePrintId });

  res.status(200).json({ message: "TaskBluePrint deleted" });
});

export default router;
