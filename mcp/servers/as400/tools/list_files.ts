import { defineTool } from "../../../lib/mock-api-tool";

export const listFilesTool = defineTool({
  name: "AS400:list_files",
  description:
    "List the physical files (tables) in the CORPLIB library with their field definitions and record counts. Uses the local IBM i (AS/400) enterprise mock API.",
  env: "AS400_API_URL",
  properties: {},
  required: [],
  request: () => ({ path: "/api/files" }),
});
