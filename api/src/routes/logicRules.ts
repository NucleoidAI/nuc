import LogicRule from "../models/LogicRule";
import express from "express";

const router = express.Router();

router.get("/", async (req, res) => {
  const { blueprintId } = req.query as { blueprintId?: string };

  if (!blueprintId) {
    return res.status(400).json({ message: "blueprintId is required" });
  }

  const logicRules = await LogicRule.findAll({ where: { blueprintId } });

  res.status(200).json(logicRules);
});

export default router;
