import { defineTool, string } from "../../../lib/mock-api-tool";
import { record } from "./query";

export const getUserTool = defineTool({
  name: "AS400:get_user",
  description:
    "Read one USRMAST record by user profile: name, e-mail, telephone, mobile, correspondence address, department, job title and status. Uses the local IBM i (AS/400) enterprise mock API.",
  env: "AS400_API_URL",
  properties: {
    user_id: string("User profile, for example MELLIS"),
  },
  required: ["user_id"],
  request: (args) => ({ path: record("USRMAST", args.user_id) }),
});
