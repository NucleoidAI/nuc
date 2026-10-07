import config from "../../../../config";
import decisionTask from "./decision";
import { fail } from "./common";
import llmTask from "./llm";
import platform from "@canmingir/link-express";

const run = config.decision?.enabled ? decisionTask : llmTask;

async function task({ taskId }: { taskId: string }) {
  try {
    return await run({ taskId });
  } catch (err) {
    platform.logger.error(err);

    return fail(
      taskId,
      err instanceof Error ? err.message : "Task failed unexpectedly"
    );
  }
}

export default task;
