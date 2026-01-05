import Joi from "joi";

const Supervising = {
  create: Joi.object({
    sessionId: Joi.string()
      .guid({ version: ["uuidv4"] })
      .required(),
    conversationId: Joi.string()
      .guid({ version: ["uuidv4"] })
      .required(),
    colleagueId: Joi.string()
      .guid({ version: ["uuidv4"] })
      .required(),
    type: Joi.string().valid("KNOWLEDGE", "RESPONSIBILITY").required(),
    responsibilityId: Joi.string()
      .guid({ version: ["uuidv4"] })
      .optional(),
    taskId: Joi.string()
      .guid({ version: ["uuidv4"] })
      .optional(),
    stepId: Joi.string()
      .guid({ version: ["uuidv4"] })
      .optional(),
  }),
  patch: Joi.object({
    answer: Joi.string().optional(),
    status: Joi.string().valid("ANSWERED").optional(),
  }),
};

export default Supervising;
