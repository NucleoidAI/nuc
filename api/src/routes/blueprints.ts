import { AuthenticationError } from "@canmingir/link-express/error";
import Blueprint from "../models/Blueprint";
import BlueprintSchema from "../schemas/Blueprint";
import agent from "../functions/agent";
import bluePrint from "../functions/blueprint";
import colleague from "../functions/colleague";
import { event } from "@canmingir/link-express/event/client";
import express from "express";

const router = express.Router();

router.get("/", async (req, res) => {
  const { projectId: teamId } = req.session;

  if (!teamId) {
    return res.status(400);
  }

  const Blueprints = await Blueprint.findAll();
  res.status(200).json(Blueprints);
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const { projectId: teamId } = req.session;

  if (!teamId) {
    return res.status(400);
  }

  const blueprintWithNodes = await bluePrint.getWithNodes(id);

  res.status(200).json(blueprintWithNodes);
});

router.put("/:blueprintId", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { blueprintId } = req.params;
  const { title, description, agentId, nodes, taskId, messages } =
    BlueprintSchema.upsert.parse(req.body);

  if (agentId) {
    const { teamId: colleagueTeamId } = await colleague.get({
      agentId,
    });

    if (teamId !== colleagueTeamId) {
      throw new AuthenticationError();
    }
  }

  const result = await bluePrint.upsert(
    title,
    description,
    agentId,
    blueprintId,
    nodes,
    messages
  );

  const pseudocode = await agent.toPseudo({
    content: result.description,
  });

  await bluePrint.patch({
    blueprintId,
    pseudocode,
  });

  await event.publish("BLUEPRINT_CREATED", {
    Blueprint: { ...result, pseudocode },
  });

  if (taskId) {
    await event.publish("BLUEPRINT_UPDATED", {
      taskId,
      blueprintId,
    });
  }

  res.status(200).json(result);
});

router.delete("/:blueprintId", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { blueprintId } = req.params;

  const { agentId } = BlueprintSchema.delete.parse(req.body);

  if (agentId) {
    const { teamId: colleagueTeamId } = await colleague.get({
      agentId,
    });

    if (teamId !== colleagueTeamId) {
      throw new AuthenticationError();
    }
  }

  await bluePrint.remove({ blueprintId });

  res.status(200).json({ message: "Blueprint deleted" });
});

export default router;
