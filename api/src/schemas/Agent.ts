import Joi from "joi";

const Agent = Joi.object({
  name: Joi.string().required(),
  icon: Joi.string().required(),
  teamId: Joi.string().guid().required(),
  aiEngineId: Joi.string().guid().required(),
  description: Joi.string().required(),
});

export default Agent;
