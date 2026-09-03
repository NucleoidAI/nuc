import Joi from "joi";
import MCPProvider from "../models/MCPProvider";
import { NotFoundError } from "@canmingir/link-express/error";
import express from "express";
import schemas from "../schemas";

const router = express.Router();

router.get("/", async (_req, res) => {
  const providers = await MCPProvider.findAll();

  res.json(providers);
});

router.post("/", async (req, res) => {
  const { name } = Joi.attempt(req.body, schemas.MCPProvider.create);

  const provider = await MCPProvider.create({ name });

  res.status(201).json(provider);
});

router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { name } = Joi.attempt(req.body, schemas.MCPProvider.update);

  const provider = await MCPProvider.findByPk(id);

  if (!provider) {
    throw new NotFoundError();
  }

  await provider.update({ name });

  res.json(provider);
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const provider = await MCPProvider.findByPk(id);

  if (!provider) {
    throw new NotFoundError();
  }

  await provider.destroy();

  res.status(204).end();
});

export default router;
