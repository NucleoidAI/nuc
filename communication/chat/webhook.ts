import express from "express";
import jwt from "jsonwebtoken";
import { getAgent } from "../api/getAgent";
import { getBlueprint } from "../api/getBlueprint";
import { getTask } from "../api/getTask";
import { startTask } from "../api/startTask";
import taskResult from "./taskResult";

const router = express.Router();

router.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.sendStatus(204);

  next();
});

router.use(express.json());

const DEFAULT_WAIT_SECONDS = 60;
const MAX_WAIT_SECONDS = 120;

const waitSeconds = (raw: unknown): number => {
  const seconds = Number(raw);
  if (!Number.isFinite(seconds) || seconds <= 0) return DEFAULT_WAIT_SECONDS;
  return Math.min(seconds, MAX_WAIT_SECONDS);
};

const statusCodes = { COMPLETED: 200, FAILED: 422, PENDING: 202 };

const createServiceToken = (projectId: string): string => {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret)
    throw new Error("JWT_SECRET environment variable is required");

  return jwt.sign({ iss: "webhook", aud: projectId }, jwtSecret, {
    expiresIn: "12h",
  });
};

router.post("/:projectId/:blueprintId", async (req, res) => {
  try {
    const { projectId, blueprintId } = req.params;
    const variables = req.body;

    const token = createServiceToken(projectId);

    const blueprint = await getBlueprint(token, blueprintId);
    const { agentId } = blueprint;

    const agent = await getAgent(token, agentId);

    if (agent?.teamId !== projectId) {
      return res.status(404).json({ error: "Blueprint not found" });
    }

    const task = await startTask(token, agentId, blueprintId, variables);

    if (req.query.wait !== "true") {
      return res.status(201).json({ taskId: task.id });
    }

    const watcher = taskResult.watch(
      task.id,
      waitSeconds(req.query.timeout) * 1000,
    );

    const current = await getTask(token, task.id).catch(() => null);

    if (current?.status === "COMPLETED") {
      watcher.settle({
        status: "COMPLETED",
        result: current.result,
        comment: current.comment,
      });
    } else if (current?.status === "FAILED") {
      watcher.settle({ status: "FAILED", comment: current.comment });
    }

    const outcome = await watcher.result;

    return res
      .status(statusCodes[outcome.status])
      .json({ taskId: task.id, ...outcome });
  } catch (error: any) {
    if (error?.response?.status === 400) {
      return res.status(400).json(error.response.data);
    }

    return res.status(500).json({ error: error?.message });
  }
});

export default router;
