import { defineTool } from "../../../lib/mock-api-tool";

export const listJobsTool = defineTool({
  name: "AS400:list_jobs",
  description:
    "List the jobs on the system with their subsystem, status and function, the way WRKACTJOB shows them. Status MSGW means the job is waiting for a message reply. Uses the local IBM i (AS/400) enterprise mock API.",
  env: "AS400_API_URL",
  properties: {},
  required: [],
  request: () => ({ path: "/api/jobs" }),
});
