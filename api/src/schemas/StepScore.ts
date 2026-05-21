import Joi from "joi";

const StepScore = {
  list: Joi.object({
    taskId: Joi.string()
      .guid({ version: ["uuidv4"] })
      .optional(),
    stepId: Joi.string()
      .guid({ version: ["uuidv4"] })
      .optional(),
  }).or("taskId", "stepId"),
  patch: Joi.object({
    superviseScore: Joi.number().min(0).max(1).optional(),
    resultScore: Joi.number().min(0).max(1).optional(),
  }).or("superviseScore", "resultScore"),
};

export default StepScore;
