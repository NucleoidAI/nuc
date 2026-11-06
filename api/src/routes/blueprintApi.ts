import { DEFAULT_API_TIMEOUT_SECONDS } from "../schemas/ApiField";
import Blueprint from "../models/Blueprint";
import { NotFoundError } from "@canmingir/link-express/error";
import apiSchema from "../lib/apiSchema";
import express from "express";
import { startNodeOf } from "../lib/apiNodes";
import taskFn from "../functions/task";
import { z } from "zod";

const router = express.Router();

function parseResult(result: string | null) {
  if (!result) return null;

  try {
    return JSON.parse(result);
  } catch {
    return { result };
  }
}

router.post("/:blueprintId", async (req, res) => {
  const { blueprintId } = z
    .object({ blueprintId: z.string().uuid() })
    .parse(req.params);

  const blueprint = await Blueprint.findByPk(blueprintId);
  const start = startNodeOf(blueprint?.nodes);

  if (!blueprint?.api || !start) {
    throw new NotFoundError();
  }

  const {
    fields = [],
    strict = false,
    timeout = DEFAULT_API_TIMEOUT_SECONDS,
  } = start.properties ?? {};

  const debug = req.query.debug === "true";

  const request = apiSchema.validate(fields, req.body ?? {}, { strict });

  if (!request.success) {
    return res
      .status(400)
      .json({ error: "INVALID_REQUEST", issues: request.issues });
  }

  const executedTasks = await taskFn.count({ blueprintId, debug });

  const task = await taskFn.create({
    agentId: blueprint.agentId,
    description: `${blueprint.title} #${executedTasks + 1}`,
    blueprintId,
    request: { nodeId: start.id, body: request.data },
    debug,
  });

  const finished = await taskFn.waitFor({
    taskId: task.id,
    timeoutMs: timeout * 1000,
  });

  res.setHeader("X-Task-Id", task.id);

  if (!finished) {
    return res.status(504).json({ error: "TIMEOUT", taskId: task.id });
  }

  if (finished.status === "FAILED") {
    return res.status(422).json({
      error: "TASK_FAILED",
      taskId: task.id,
      message: finished.comment,
    });
  }

  res.status(200).json(parseResult(finished.result));
});

export default router;
