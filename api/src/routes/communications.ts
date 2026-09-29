import Joi from "joi";
import communication from "../functions/communication";
import express from "express";
import schemas from "../schemas";

const router = express.Router();

router.get("/", async (req, res) => {
  const comms = await communication.list();
  res.status(200).json(comms);
});

router.get("/mailboxes", async (req, res) => {
  const mailboxes = await communication.listMailboxes();
  res.status(200).json(mailboxes);
});

router.get("/:id", async (req, res) => {
  const comm = await communication.get({ communicationId: req.params.id });
  res.status(200).json(comm);
});

router.post("/", async (req, res) => {
  const { channelCode, channelType, blueprintId, config } = Joi.attempt(
    req.body,
    schemas.Communication.create
  );

  const comm = await communication.create({
    channelCode,
    channelType,
    blueprintId,
    projectId: req.session?.projectId,
    config,
  });
  res.status(201).json(comm);
});

router.patch("/:id", async (req, res) => {
  const { config } = Joi.attempt(req.body, schemas.Communication.update);

  const comm = await communication.update({
    communicationId: req.params.id,
    config,
  });
  res.status(200).json(comm);
});

router.delete("/:id", async (req, res) => {
  await communication.remove({ communicationId: req.params.id });
  res.sendStatus(204);
});

export default router;
