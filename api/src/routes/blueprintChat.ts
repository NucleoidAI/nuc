import Joi from "joi";
import Supervising from "../models/Supervising";
import agentFn from "../functions/agent";
import blueprintFn from "../functions/blueprint";
import express from "express";
import sessionFn from "../functions/session";
import supervisingFn from "../functions/supervising";

const router = express.Router();

router.post("/", async (req, res) => {
  const teamId = req.session.projectId;

  const {
    agentId,
    content,
    blueprintId: bodyBlueprintId,
    sessionId,
    supervisingId,
  } = Joi.attempt(
    req.body,
    Joi.object({
      agentId: Joi.string().uuid().optional(),
      content: Joi.string().required(),
      sessionId: Joi.string().uuid().required(),
      blueprintId: Joi.string().uuid().optional(),
      supervisingId: Joi.string().uuid().optional(),
    }),
  );

  let supervisingInstance = null;
  if (supervisingId) {
    supervisingInstance = await Supervising.findByPk(supervisingId);
    if (!supervisingInstance) {
      return res.status(404).end();
    }
  }

  if (!agentId) {
    return res.status(400).json({ error: "agentId is required" });
  }

  const blueprintId =
    bodyBlueprintId ?? supervisingInstance?.blueprintId ?? null;

  const existingSession = await sessionFn.get({ sessionId });

  let history: { role: "user" | "assistant"; content: string }[] = [];

  if (existingSession) {
    const conversations = await sessionFn.listConversations({ sessionId });
    history = conversations.map((c) => ({
      role: c.role === "ASSISTANT" ? ("assistant" as const) : ("user" as const),
      content: c.content ?? "",
    }));
  } else {
    await sessionFn.create({ id: sessionId, type: "CHAT", agentId });
    await sessionFn.addConversation({
      sessionId,
      agentId,
      role: "USER",
      content,
    });
  }

  const { decision } = await agentFn.blueprintChatDecision({
    history,
    content,
  });

  const { sufficient, answer } = await agentFn.blueprintChatSufficiency({
    history,
    content,
    decision,
  });

  if (!sufficient) {
    return res.status(200).json({ answer });
  }

  if (decision === "KNOWLEDGE") {
    const { knowledge } = await agentFn.blueprintChatKnowledge({ content });

    if (supervisingInstance) {
      await supervisingFn.update({
        teamId,
        supervisingId,
        agentId: supervisingInstance.agentId,
        question: supervisingInstance.question,
        answer: knowledge,
        status: "ANSWERED",
        blueprintId: supervisingInstance.blueprintId,
        taskId: supervisingInstance.taskId,
      });
    }

    return res.status(200).json({ decision, answer, knowledge });
  } else if (decision === "BLUEPRINT") {
    const referenceBlueprint = blueprintId
      ? await blueprintFn.getWithNodes(blueprintId)
      : null;

    const blueprint = await agentFn.Blueprint({ history, content });

    let updatedBlueprint = null;
    if (blueprintId && referenceBlueprint) {
      updatedBlueprint = await blueprintFn.upsert(
        referenceBlueprint.title,
        referenceBlueprint.description,
        agentId,
        blueprintId,
        blueprint.flow,
      );
    }

    if (supervisingInstance) {
      await supervisingFn.update({
        teamId,
        supervisingId,
        agentId: supervisingInstance.agentId,
        question: supervisingInstance.question,
        answer: blueprint.response,
        status: "ANSWERED",
        blueprintId: supervisingInstance.blueprintId ?? blueprintId,
        taskId: supervisingInstance.taskId,
      });
    }

    return res.status(200).json({
      decision,
      answer,
      ...blueprint,
      referenceBlueprint,
      updatedBlueprint,
    });
  }
});

export default router;
