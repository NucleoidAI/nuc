import { defineTool, string } from "../../../lib/mock-api-tool";

export const runClCommandTool = defineTool({
  name: "AS400:run_cl_command",
  description:
    "Run a CL command: DSPLIB, WRKOBJPDM, DSPFD, DSPFFD, DSPPFM, RUNQRY, CLRPFM, DLTF, WRKACTJOB, SBMJOB, ENDJOB, DSPMSG, SNDMSG, WRKSYSSTS, HELP. Returns the CL messages and, where the command has output, a panel. Uses the local IBM i (AS/400) enterprise mock API.",
  env: "AS400_API_URL",
  properties: {
    command: string("CL command, for example DSPPFM FILE(POLMAST)"),
  },
  required: ["command"],
  request: (args) => ({
    path: "/api/cl",
    method: "POST",
    body: { command: args.command },
  }),
});
