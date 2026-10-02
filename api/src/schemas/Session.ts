import Joi from "joi";

const Session = {
  schema: Joi.object({
    type: Joi.string().valid("CHAT", "EMAIL").optional(),
    agentId: Joi.string().uuid().optional(),
  }),
  emailDecision: Joi.object({
    stepId: Joi.string()
      .guid({ version: ["uuidv4"] })
      .required(),
    token: Joi.string()
      .pattern(/^[a-f0-9]{64}$/)
      .required(),
    decision: Joi.string().valid("APPROVED", "REJECTED").required(),
  }),
};

export default Session;
