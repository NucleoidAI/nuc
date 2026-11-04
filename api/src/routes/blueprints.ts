import Agent from "../models/Agent";
import { AuthenticationError } from "@canmingir/link-express/error";
import Blueprint from "../models/Blueprint";
import BlueprintSchema from "../schemas/Blueprint";
import agentData from "../functions/agentData";
import bluePrint from "../functions/blueprint";
import { event } from "@canmingir/link-express/event/client";
import express from "express";
import Joi from "joi";
import task from "../functions/task";

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

router.get("/:blueprintId/executions", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { blueprintId } = Joi.attempt(
    req.params,
    Joi.object({
      blueprintId: Joi.string().guid().required(),
    }),
  );

  const blueprint = await Blueprint.findByPk(blueprintId, {
    attributes: ["id", "agentId"],
  });

  if (!blueprint) {
    return res.status(404).end();
  }

  const agent = await Agent.findByPk(blueprint.agentId, {
    attributes: ["teamId"],
  });

  if (agent?.teamId !== teamId) {
    return res.status(401).end();
  }

  return res.status(200).json(await task.executions({ blueprintId }));
});

router.post("/generate", async (req, res) => {
  const { projectId: teamId } = req.session;

  if (!teamId) {
    return res.status(400);
  }

  const { nodes } = BlueprintSchema.generate.parse(req.body);

  const [description, skill] = await Promise.all([
    bluePrint.generateDescription({ nodes }),
    bluePrint.generateSkill({ nodes }),
  ]);

  res.status(200).json({ description, skill });
});

router.put("/:blueprintId", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { blueprintId } = req.params;
  const {
    title,
    description,
    agentId,
    nodes,
    taskId,
    messages,
    blocking,
    executionMode,
    skill,
    context,
    api,
  } = BlueprintSchema.upsert.parse(req.body);

  if (agentId) {
    const { teamId: agentTeamId } = await agentData.get({
      agentId,
    });

    if (teamId !== agentTeamId) {
      throw new AuthenticationError();
    }
  }

  const result = await bluePrint.upsert(
    title,
    description,
    agentId,
    blueprintId,
    nodes,
    messages?.map((msg) => ({
      content: msg.content,
      role: msg.role,
      createdAt: new Date(msg.createdAt),
    })),
    blocking,
    skill,
    context,
    executionMode,
    api,
  );

  await event.publish("BLUEPRINT_CREATED", {
    Blueprint: result,
  });

  res.status(200).json(result);
});

router.patch("/:blueprintId", async (req, res) => {
  const { blueprintId } = req.params;
  const { blocking, executionMode, api } = BlueprintSchema.patch.parse(
    req.body,
  );

  const result = await bluePrint.patch({
    blueprintId,
    blocking,
    executionMode,
    api,
  });

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
