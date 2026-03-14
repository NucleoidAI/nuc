import { AuthenticationError } from "@canmingir/link-express/error";
import Blueprint from "../models/Blueprint";
import BlueprintSchema from "../schemas/Blueprint";
import agentData from "../functions/agentData";
import agentFn from "../functions/agent";
import bluePrint from "../functions/blueprint";
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
    const { teamId: agentTeamId } = await agentData.get({
      agentId,
    });

    if (teamId !== agentTeamId) {
      throw new AuthenticationError();
    }
  }

  const [pseudocode, nodesWithPseudocode] = await Promise.all([
    agentFn.toPseudo({ content: description }),
    nodes
      ? Promise.all(
          nodes.map(async (node) => {
            const content =
              node.properties?.prompt ||
              node.properties?.description ||
              node.properties?.label;
            if (!content) return node;
            const nodePseudocode = await agentFn.toPseudo({ content });
            return {
              ...node,
              properties: { ...node.properties, pseudocode: nodePseudocode },
            } as typeof node;
          }),
        )
      : Promise.resolve(nodes),
  ]);

  const result = await bluePrint.upsert(
    title,
    description,
    agentId,
    blueprintId,
    nodesWithPseudocode,
    messages,
  );

  await bluePrint.patch({
    blueprintId,
    pseudocode,
  });

  await event.publish("BLUEPRINT_CREATED", {
    Blueprint: { ...result, pseudocode },
  });

  if (taskId) {
    await event.publish("TASK_SUPERVISING_RESPONDED", {
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
    const { teamId: agentTeamId } = await agentData.get({
      agentId,
    });

    if (teamId !== agentTeamId) {
      throw new AuthenticationError();
    }
  }

  await bluePrint.remove({ blueprintId });

  res.status(200).json({ message: "Blueprint deleted" });
});

export default router;
