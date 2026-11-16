import Joi from "joi";

const Session = {
  schema: Joi.object({
    type: Joi.string().valid("CHAT", "EMAIL", "API").optional(),
    agentId: Joi.string().uuid().optional(),
  }),
};

export default Session;
