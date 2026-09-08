import Joi from "joi";

const uuid = Joi.string().guid({ version: ["uuidv4"] });

const MCPServer = {
  create: Joi.object({
    id: Joi.string().min(1).max(255).required(),
    mcpProviderId: uuid.required(),
    description: Joi.string().allow("", null).optional(),
    icon: Joi.string().allow("", null).optional(),
  }),

  update: Joi.object({
    description: Joi.string().allow("", null).optional(),
    icon: Joi.string().allow("", null).optional(),
  }).or("description", "icon"),

  env: {
    set: Joi.object({
      value: Joi.string().allow("").required(),
    }),
  },
};

export default MCPServer;
