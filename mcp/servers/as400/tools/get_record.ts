import { defineTool, string } from "../../../lib/mock-api-tool";
import { record } from "./query";

export const getRecordTool = defineTool({
  name: "AS400:get_record",
  description:
    "Read a single record by its key field, for example USRMAST by user profile or POLMAST by policy number. Uses the local IBM i (AS/400) enterprise mock API.",
  env: "AS400_API_URL",
  properties: {
    file: string("File name, for example USRMAST or POLMAST"),
    key: string("Key field value, for example MELLIS or MTR-20260041"),
  },
  required: ["file", "key"],
  request: (args) => ({
    path: record(String(args.file), args.key),
  }),
});
