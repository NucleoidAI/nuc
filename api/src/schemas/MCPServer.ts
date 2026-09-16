import Joi from "joi";

const uuid = Joi.string().guid({ version: ["uuidv4"] });

const RESERVED_ENV_KEYS = [
  "PATH",
  "IFS",
  "HOME",
  "SHELL",
  "HTTP_PROXY",
  "HTTPS_PROXY",
  "NO_PROXY",
  "PYTHONPATH",
  "PYTHONSTARTUP",
  "GCONV_PATH",
];

const RESERVED_ENV_PREFIXES = ["LD_", "DYLD_", "BUN_", "NODE_"];

const MCPServer = {
  create: Joi.object({
    id: Joi.string()
      .min(1)
      .max(255)
      .pattern(/^[a-zA-Z0-9_-]+$/)
      .required(),
    mcpProviderId: uuid.required(),
    description: Joi.string().allow("", null).optional(),
    icon: Joi.string().allow("", null).optional(),
  }),

  update: Joi.object({
    description: Joi.string().allow("", null).optional(),
    icon: Joi.string().allow("", null).optional(),
  }).or("description", "icon"),

  env: {
    key: Joi.string()
      .max(128)
      .pattern(/^[A-Z][A-Z0-9_]*$/)
      .invalid(...RESERVED_ENV_KEYS)
      .custom((value, helpers) =>
        RESERVED_ENV_PREFIXES.some((prefix) => value.startsWith(prefix))
          ? helpers.error("any.invalid")
          : value,
      )
      .required(),

    set: Joi.object({
      value: Joi.string().allow("").required(),
    }),
  },
};

export default MCPServer;
