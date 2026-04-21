import Agent from "../models/Agent";
import Conversation from "../models/Conversation";
import Joi from "joi";
import Supervising from "../models/Supervising";
import agentFn from "../functions/agent";
import express from "express";
import { publish } from "../lib/Event";
import schemas from "../schemas";
import session from "../functions/session";
import supervising from "../functions/supervising";

const router = express.Router();

router.post("/", async (req, res) => {
  const teamId = req.session.projectId;

  const { sessionId, conversationId, agentId } = Joi.attempt(
    req.body,
    schemas.Supervising.create,
  );

  const agent = await Agent.findByPk(agentId);

  if (!agent) {
    res.status(404);
  }

  if (agent.teamId !== teamId) {
    res.status(401);
  }

  const conversation = await Conversation.findByPk(conversationId);

  if (!conversation) {
    res.status(404);
  }

  const createdSupervising = await supervising.create({
    sessionId,
    conversationId,
    question: conversation.content,
    agentId,
  });

  res.status(201).json(createdSupervising);
});

router.get("/", async (req, res) => {
  const teamId = req.session.projectId;
  const { status } = req.query;

  const whereClause: any = {};
  if (status) {
    whereClause.status = status;
  }

  const supervisings = await Supervising.findAll({
    where: whereClause,
    include: [
      {
        model: Agent,
        where: { teamId },
        attributes: [],
      },
    ],
  });

  if (status && supervisings.length === 1) {
    const supervisingData = supervisings[0].dataValues;

    const formattedData = {
      ...supervisingData,
      createdAt: supervisingData.createdAt?.toISOString(),
    };
    publish("SUPERVISING_LOADED", formattedData);
  } else if (status && supervisings.length === 0) {
    publish("SUPERVISING_LOADED", null);
  } else {
    publish("SUPERVISING_LOADED", supervisings);
  }

  res.status(200).json(supervisings);
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const teamId = req.session.projectId;

  const validatedId = Joi.attempt(id, Joi.string().guid().required());

  const supervising = await Supervising.findOne({
    where: { id: validatedId },
    include: [
      {
        model: Agent,
        attributes: ["teamId"],
        required: true,
      },
    ],
  });

  if (!supervising) {
    res.status(404);
  }

  if (supervising.Agent.teamId !== teamId) {
    res.status(401);
  }

  const { dataValues } = supervising;

  if (dataValues.Agent) {
    // eslint-disable-next-line no-unused-vars
    const { Agent, ...rest } = dataValues;
    res.status(200).json(rest);
    publish("SUPERVISING_LOADED", rest);
  } else {
    res.status(200).json(dataValues);
    publish("SUPERVISING_LOADED", dataValues);
  }
});

router.patch("/:supervisingId", async (req, res) => {
  const { supervisingId } = req.params;
  const teamId = req.session.projectId;

  const { answer, status } = Joi.attempt(req.body, schemas.Supervising.patch);

  const supervisingInstance = await Supervising.findByPk(supervisingId);

  if (!supervisingInstance) {
    return res.status(404).json({ error: "Supervising not found" });
  }

  const agent = await Agent.findByPk(supervisingInstance.agentId);

  if (!agent) {
    return res.status(404).json({ error: "Agent not found" });
  }

  if (agent.teamId !== teamId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const updatedSupervising = await supervising.update({
    teamId,
    supervisingId,
    agentId: agent.id,
    question: supervisingInstance.question,
    answer,
    status,
    taskId: supervisingInstance.taskId,
  });

  res.status(200).json(updatedSupervising);
});

router.post("/:supervisingId/evaluate", async (req, res) => {
  const { supervisingId } = req.params;
  const teamId = req.session.projectId;

  const { answer, blueprintId } = Joi.attempt(
    req.body,
    Joi.object({
      answer: Joi.string().required(),
      blueprintId: Joi.string().guid().optional(),
    }),
  );

  const supervisingInstance = await Supervising.findByPk(supervisingId);

  if (!supervisingInstance) {
    return res.status(404).json({ error: "Supervising not found" });
  }

  const agent = await Agent.findByPk(supervisingInstance.agentId);

  if (!agent) {
    return res.status(404).json({ error: "Agent not found" });
  }

  if (agent.teamId !== teamId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const evaluation = await agentFn.evaluateSupervisionAnswer({
    agentId: agent.id,
    content: {
      question: supervisingInstance.question,
      answer,
    },
  });

  if (evaluation.is_answer_known) {
    const updatedSupervising = await supervising.update({
      teamId,
      supervisingId,
      agentId: agent.id,
      question: supervisingInstance.question,
      answer,
      status: "ANSWERED",
      taskId: supervisingInstance.taskId,
      blueprintId,
    });

    return res.status(200).json({
      action: "answer_approved",
      supervising: updatedSupervising,
      evaluation: {
        ...evaluation,
      },
    });
  } else {
    return res.status(200).json({
      action: "needs_improvement",
      evaluation: {
        ...evaluation,
      },
    });
  }
});

export default router;
