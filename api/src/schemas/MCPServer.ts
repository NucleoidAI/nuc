import Joi from "joi";

const uuid = Joi.string().guid({ version: ["uuidv4"] });

const scope = {
  teamId: uuid.optional(),
  agentId: uuid.optional(),
};

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

  list: Joi.object(scope).oxor("teamId", "agentId"),

  assignment: {
    create: Joi.object(scope).xor("teamId", "agentId"),
  },

  env: {
    create: Joi.object({
      key: Joi.string().min(1).max(255).required(),
      value: Joi.string().allow("").required(),
      ...scope,
    }).oxor("teamId", "agentId"),

    update: Joi.object({
      value: Joi.string().allow("").required(),
    }),
  },
};

export default MCPServer;
