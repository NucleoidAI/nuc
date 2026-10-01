import { defineTool, string } from "../../../lib/mock-api-tool";

export const submitJobTool = defineTool({
  name: "AS400:submit_job",
  description:
    "Submit a batch job to a job queue (SBMJOB). The job is queued and a CPF1124 message is written to QSYSOPR. Uses the local IBM i (AS/400) enterprise mock API.",
  env: "AS400_API_URL",
  properties: {
    job: string("Job name, up to 10 characters, for example ORDPOST"),
    command: string("Command the job runs, for example CALL PGM(ORDPOST)"),
    user: string("User profile the job runs under, for example QPGMR"),
    jobq: string("Job queue, for example QBATCH"),
  },
  required: ["job"],
  request: (args) => ({
    path: "/api/jobs",
    method: "POST",
    body: {
      job: args.job,
      command: args.command,
      user: args.user,
      jobq: args.jobq,
    },
  }),
});
