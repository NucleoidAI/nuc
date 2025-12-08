import Joi from "joi";

const Colleague = Joi.object({
  name: Joi.string().required(),
  avatar: Joi.string().required(),
  teamId: Joi.string().guid().required(),
  aiEngineId: Joi.string().guid().required(),
  description: Joi.string().required(),
});

export default Colleague;
