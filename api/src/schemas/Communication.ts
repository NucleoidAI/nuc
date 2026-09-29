import Joi from "joi";

const server = {
  host: Joi.string().trim().required(),
  port: Joi.number().integer().min(1).max(65535).required(),
  secure: Joi.boolean().default(true),
  user: Joi.string().trim().required(),
  pass: Joi.string().allow("").default(""),
  rejectUnauthorized: Joi.boolean().default(true),
};

const emailConfig = Joi.object({
  address: Joi.string().trim().lowercase().email().required(),
  allowedSenders: Joi.array()
    .items(Joi.string().trim().lowercase().email())
    .default([]),
  imap: Joi.object({
    ...server,
    folder: Joi.string().trim().default("INBOX"),
  }).required(),
  smtp: Joi.object({
    ...server,
    secure: Joi.boolean().default(false),
    from: Joi.string().trim().allow("").default(""),
  }).required(),
});

const Communication = {
  create: Joi.object({
    channelType: Joi.string().valid("WHATSAPP", "SLACK", "EMAIL").required(),
    channelCode: Joi.string().required(),
    blueprintId: Joi.string()
      .guid({ version: ["uuidv4"] })
      .required(),
    config: Joi.when("channelType", {
      is: "EMAIL",
      then: emailConfig.required(),
      otherwise: Joi.forbidden(),
    }),
  }),
  update: Joi.object({
    config: emailConfig.required(),
  }),
};

export default Communication;
