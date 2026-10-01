import { defineTool, string } from "../../../lib/mock-api-tool";
import { code } from "./query";

export const listUserPoliciesTool = defineTool({
  name: "AS400:list_user_policies",
  description:
    "List every policy held by one user profile, including lapsed and cancelled ones. A holder can have several policies at different risk addresses. Uses the local IBM i (AS/400) enterprise mock API.",
  env: "AS400_API_URL",
  properties: {
    user_id: string("Policy holder profile, for example MELLIS"),
  },
  required: ["user_id"],
  request: (args) => ({
    path: "/api/sql",
    method: "POST",
    body: { sql: `SELECT * FROM POLMAST WHERE USRID = ${code(args.user_id)}` },
  }),
});
