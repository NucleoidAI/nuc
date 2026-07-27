import Joi from "joi";
import ModelPricing from "../models/ModelPricing";
import express from "express";

const router = express.Router();

router.get("/", async (req, res) => {
  const pricings = await ModelPricing.findAll({
    order: [
      ["provider", "ASC"],
      ["model", "ASC"],
    ],
  });

  return res.status(200).json(pricings);
});

// Upsert by (provider, model)
router.post("/", async (req, res) => {
  const { provider, model, inputPricePerMillion, outputPricePerMillion } =
    Joi.attempt(
      req.body,
      Joi.object({
        provider: Joi.string().required(),
        model: Joi.string().required(),
        inputPricePerMillion: Joi.number().min(0).required(),
        outputPricePerMillion: Joi.number().min(0).required(),
      })
    );

  const existing = await ModelPricing.findOne({ where: { provider, model } });

  if (existing) {
    await existing.update({ inputPricePerMillion, outputPricePerMillion });
    return res.status(200).json(existing);
  }

  const pricing = await ModelPricing.create({
    provider,
    model,
    inputPricePerMillion,
    outputPricePerMillion,
  });

  return res.status(201).json(pricing);
});

router.delete("/:pricingId", async (req, res) => {
  const { pricingId } = req.params;

  const pricing = await ModelPricing.findByPk(pricingId);

  if (!pricing) {
    return res.status(404).end();
  }

  await pricing.destroy();

  return res.status(200).end();
});

export default router;
