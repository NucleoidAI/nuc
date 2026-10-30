import Joi from "joi";

const Supervising = {
  id: Joi.string().guid().required(),
  create: Joi.object({
    sessionId: Joi.string()
      .guid({ version: ["uuidv4"] })
      .required(),
    conversationId: Joi.string()
      .guid({ version: ["uuidv4"] })
      .required(),
    agentId: Joi.string()
      .guid({ version: ["uuidv4"] })
      .required(),
    blueprintId: Joi.string()
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
  list: Joi.object({
    status: Joi.string().valid("ANSWERED", "IN_PROGRESS").optional(),
    from: Joi.string().isoDate().optional(),
    to: Joi.string().isoDate().optional(),
  }),
  agentParams: Joi.object({
    agentId: Joi.string()
      .guid({ version: ["uuidv4"] })
      .required(),
  }),
};

export default Supervising;
