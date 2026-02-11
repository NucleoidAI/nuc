import Agent from "../models/Agent";
import { AuthenticationError } from "@canmingir/link-express/error";
import Joi from "joi";
import Knowledge from "../models/Knowledge";
import agentData from "../functions/agentData";
import { event } from "@canmingir/link-express/event/client";
import express from "express";
import knowledge from "../functions/knowledge";
import schemas from "../schemas";
const router = express.Router();

router.post("/", async (req, res) => {
  const { body } = req;
  const { projectId: teamId } = req.session;

  const {
    taskId,
    agentId,
    teamId: knowledgeTeamId,
    ...knowledgeBody
  } = Joi.attempt(body, schemas.Knowledge.create);

  if (knowledgeTeamId) {
    if (knowledgeTeamId !== teamId) {
      throw new AuthenticationError();
    }
  } else {
    const agent = await Agent.findOne({
      where: {
        teamId,
        id: agentId,
      },
    });

    if (!agent) {
      throw new AuthenticationError();
    }
  }

  const createdKnowledge = await knowledge.create({
    teamId,
    agentId,
    knowledge: knowledgeBody,
  });

  if (taskId) {
    await event.publish("TASK_SUPERVISING_RESPONDED", {
      taskId,
    });
  }

  res.status(201).json(createdKnowledge);
});

router.get("/", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { agentId, type } = req.query as {
    teamId?: string;
    agentId?: string;
    type?: string;
  };

  if (agentId) {
    const agentInstance = await agentData.get({ agentId });

    if (agentInstance.teamId !== teamId) {
      throw new AuthenticationError();
    }
  }

  const knowledgeList = await knowledge.list({
    agentId,
    teamId,
    type,
  });

  res.json(knowledgeList);
});

router.get("/:id", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { id } = req.params;

  const knowledgeItem = await knowledge.get({
    knowledgeId: id,
    includeAgent: true,
  });

  const { AgentKnowledge } = knowledgeItem;

  const hasAccess =
    AgentKnowledge.teamId === teamId || AgentKnowledge.Agent?.teamId === teamId;

  if (!hasAccess) {
    throw new AuthenticationError();
  }

  const { agentId } = AgentKnowledge;

  delete knowledgeItem.AgentKnowledge;

  const responseData = {
    ...knowledgeItem,
    ...(agentId ? { agentId, teamId } : { teamId }),
  };

  return res.json(responseData);
});

router.delete("/:id", async (req, res) => {
  const { projectId: teamId } = req.session;
  const { id } = req.params;

  const knowledgeItem = await knowledge.get({
    knowledgeId: id,
    includeAgent: true,
  });

  const { AgentKnowledge } = knowledgeItem;

  const hasAccess =
    AgentKnowledge.teamId === teamId || AgentKnowledge.Agent?.teamId === teamId;

  if (!hasAccess) {
    throw new AuthenticationError();
  }

  await Knowledge.destroy({ where: { id } });

  res.status(204).end();
});

export default router;
