import actions from "../actions";
import express from "express";
import mcp from "../functions/mcp";

const router = express.Router();

router.get("/", async (_req, res) => {
  const allMCPs = mcp.list();

  res.json(allMCPs);
});

router.get("/actions", async (_req, res) => {
  const action = actions.list();

  res.json(action);
});

export default router;
