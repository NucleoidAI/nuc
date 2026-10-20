import decisionTask from "./decision";
import { fail } from "./common";
import platform from "@canmingir/link-express";

async function task({ taskId }: { taskId: string }) {
  try {
    return await decisionTask({ taskId });
  } catch (err) {
    platform.logger.error(err);

    return fail(
      taskId,
      err instanceof Error ? err.message : "Task failed unexpectedly"
    );
  }
}

export default task;
