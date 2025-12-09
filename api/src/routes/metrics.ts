import { client } from "@canmingir/link-express/event/client";
import express from "express";
import os from "os";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    free: os.freemem(),
    total: os.totalmem(),
  });
});

router.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
