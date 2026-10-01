import { defineTool, string } from "../../../lib/mock-api-tool";

export const describeFileTool = defineTool({
  name: "AS400:describe_file",
  description:
    "Display the field descriptions of a physical file (DSPFFD): field name, data type, key flag, whether nulls are allowed and the field text. Uses the local IBM i (AS/400) enterprise mock API.",
  env: "AS400_API_URL",
  properties: {
    file: string("File name, for example USRMAST, POLMAST or ORDHDR"),
  },
  required: ["file"],
  request: (args) => ({
    path: "/api/cl",
    method: "POST",
    body: { command: `DSPFFD FILE(${String(args.file).trim().toUpperCase()})` },
  }),
});
