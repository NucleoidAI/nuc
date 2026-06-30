import Joi from "joi";
import agentFn from "../functions/agent";
import express from "express";

const router = express.Router();

const historyItemSchema = Joi.object({
  role: Joi.string().valid("user", "assistant").required(),
  content: Joi.string().required(),
});

router.post("/", async (req, res) => {
  const { agentId, content, history } = Joi.attempt(
    req.body,
    Joi.object({
      agentId: Joi.string().uuid().required(),
      content: Joi.string().required(),
      history: Joi.array().items(historyItemSchema).default([]),
    }),
  );

  const { decision } = await agentFn.blueprintChatDecision({
    history,
    content,
  });

  const { sufficient, question } = await agentFn.blueprintChatSufficiency({
    history,
    content,
    decision,
  });

  return res.status(200).json({ decision, sufficient, question });
});

export default router;
