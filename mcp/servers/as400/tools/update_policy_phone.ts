import { defineTool, string } from "../../../lib/mock-api-tool";
import { fields, record } from "./query";

export const updatePolicyPhoneTool = defineTool({
  name: "AS400:update_policy_phone",
  description:
    "Change the contact telephone and/or mobile number held against a POLMAST record. Every other field on the policy is left as it was. Uses the local IBM i (AS/400) enterprise mock API.",
  env: "AS400_API_URL",
  properties: {
    policy_id: string(
      "Policy number of the record to change, for example MTR-20260041",
    ),
    phone: string("New contact telephone for this policy"),
    mobile: string("New contact mobile for this policy"),
  },
  required: ["policy_id"],
  request: (args) => ({
    path: record("POLMAST", args.policy_id),
    method: "PATCH",
    body: fields(args, { phone: "PHONE", mobile: "MOBILE" }),
  }),
  response: (payload) => ({
    status: payload.status,
    policy_id: payload.record?.POLID,
    phone: payload.record?.PHONE ?? null,
    mobile: payload.record?.MOBILE ?? null,
  }),
});
