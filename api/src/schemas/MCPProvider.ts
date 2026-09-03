import Joi from "joi";

const MCPProvider = {
  create: Joi.object({
    name: Joi.string().min(1).max(255).required(),
  }),

  update: Joi.object({
    name: Joi.string().min(1).max(255).required(),
  }),
};

export default MCPProvider;
