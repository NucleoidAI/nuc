import { defineTool, string } from "../../../lib/mock-api-tool";
import { code, quote, where } from "./query";

export const findPolicyTool = defineTool({
  name: "AS400:find_policy",
  description:
    "Find policies through the LPOLCTC logical file, which indexes POLMAST by the contact details the policy is registered against — telephone, mobile and postcode — and joins the holder name. Use it for an inbound caller whose number or postcode is known. Give at least one argument. Uses the local IBM i (AS/400) enterprise mock API.",
  env: "AS400_API_URL",
  properties: {
    policy_id: string("Policy number, for example MTR-20260041"),
    user_id: string("Policy holder profile, for example MELLIS"),
    phone: string("Contact telephone as stored, for example +44 20 7946 0112"),
    mobile: string("Contact mobile as stored, for example +44 7700 900118"),
    postcode: string("Risk address postcode, for example WC2B 6LH"),
    policy_type: {
      type: "string",
      description: "Policy type",
      enum: ["MOTOR", "HOME", "LIFE", "TRAVEL", "PET"],
    },
    status: {
      type: "string",
      description: "A active, L lapsed, C cancelled, P pending",
      enum: ["A", "L", "C", "P"],
    },
  },
  required: [],
  request: (args) => ({
    path: "/api/sql",
    method: "POST",
    body: {
      sql: `SELECT * FROM LPOLCTC WHERE ${where([
        args.policy_id ? `POLID = ${code(args.policy_id)}` : null,
        args.user_id ? `USRID = ${code(args.user_id)}` : null,
        args.phone ? `PHONE LIKE ${quote(args.phone)}` : null,
        args.mobile ? `MOBILE LIKE ${quote(args.mobile)}` : null,
        args.postcode ? `PSTCDE = ${code(args.postcode)}` : null,
        args.policy_type ? `POLTYP = ${code(args.policy_type)}` : null,
        args.status ? `POLSTS = ${code(args.status)}` : null,
      ])}`,
    },
  }),
});
