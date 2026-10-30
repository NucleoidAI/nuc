import Joi from "joi";

const range = Joi.object({
  agentId: Joi.string()
    .guid({ version: ["uuidv4"] })
    .optional(),
  from: Joi.string().isoDate().required(),
  to: Joi.string().isoDate().required(),
});

const Statistics = {
  range,
  period: Joi.object({
    from: Joi.string().isoDate().required(),
    to: Joi.string().isoDate().required(),
  }),
  supervisingCount: range.keys({
    status: Joi.string().valid("IN_PROGRESS", "ANSWERED").optional(),
  }),
};

export default Statistics;
