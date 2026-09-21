import { defineTool, string } from "../../../lib/mock-api-tool";
import { record } from "./query";

export const getPolicyTool = defineTool({
  name: "AS400:get_policy",
  description:
    "Read one POLMAST record by policy number: holder, type, status, cover dates, premium, sum insured and the risk address and contact details held against that policy. Uses the local IBM i (AS/400) enterprise mock API.",
  env: "AS400_API_URL",
  properties: {
    policy_id: string("Policy number, for example MTR-20260041"),
  },
  required: ["policy_id"],
  request: (args) => ({ path: record("POLMAST", args.policy_id) }),
});
