import Joi from "joi";
import channel from "../functions/channel";
import express from "express";
import schemas from "../schemas";

const router = express.Router();

router.get("/", async (req, res) => {
  const { type, secrets } = Joi.attempt(req.query, schemas.Channel.list);

  const channels = await channel.list({ type, secrets });
  res.status(200).json(channels);
});

router.get("/:id", async (req, res) => {
  const result = await channel.get({ channelId: req.params.id });
  res.status(200).json(result);
});

router.post("/", async (req, res) => {
  const { channelCode, channelType, blueprintId, config } = Joi.attempt(
    req.body,
    schemas.Channel.create
  );

  const result = await channel.create({
    channelCode,
    channelType,
    blueprintId,
    projectId: req.session?.projectId,
    config,
  });
  res.status(201).json(result);
});

router.patch("/:id", async (req, res) => {
  const { config } = Joi.attempt(req.body, schemas.Channel.update);

  const result = await channel.update({
    channelId: req.params.id,
    config,
  });
  res.status(200).json(result);
});

router.delete("/:id", async (req, res) => {
  await channel.remove({ channelId: req.params.id });
  res.sendStatus(204);
});

export default router;
