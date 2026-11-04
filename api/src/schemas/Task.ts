import Joi from "joi";

const Task = {
  list: Joi.object({
    status: Joi.string().valid("IN_PROGRESS", "COMPLETED", "FAILED").optional(),
    from: Joi.string().isoDate().optional(),
    to: Joi.string().isoDate().optional(),
  }),
  agentParams: Joi.object({
    agentId: Joi.string()
      .guid({ version: ["uuidv4"] })
      .required(),
  }),
};

export default Task;
