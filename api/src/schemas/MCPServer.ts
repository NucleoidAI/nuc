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
  }),

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

  toolArg: {
    create: Joi.object({
      tool: Joi.string().min(1).max(255).required(),
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
