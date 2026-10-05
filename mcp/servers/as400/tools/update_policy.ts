import { defineTool, string } from "../../../lib/mock-api-tool";
import { fields, record } from "./query";

export const updatePolicyTool = defineTool({
  name: "AS400:update_policy",
  description:
    "Change a POLMAST record — status, renewal date, premium, sum insured, or the risk address and contact details the policy is registered against. The policy number itself cannot be changed. Uses the local IBM i (AS/400) enterprise mock API.",
  env: "AS400_API_URL",
  properties: {
    policy_id: string(
      "Policy number of the record to change, for example MTR-20260041",
    ),
    status: {
      type: "string",
      description: "A active, L lapsed, C cancelled, P pending",
      enum: ["A", "L", "C", "P"],
    },
    renewal_date: string("Renewal date as YYYY-MM-DD"),
    premium: { type: "number", minimum: 0, description: "Premium per payment" },
    payment_frequency: {
      type: "string",
      description: "M monthly, A annual",
      enum: ["M", "A"],
    },
    sum_insured: { type: "number", minimum: 0, description: "Sum insured" },
    address_1: string("Risk address line 1"),
    address_2: string("Risk address line 2"),
    city: string("Town or city"),
    county: string("County"),
    postcode: string("Postcode, up to 8 characters"),
    phone: string("Contact telephone for this policy"),
    mobile: string("Contact mobile for this policy"),
    email: string("Contact e-mail for this policy"),
  },
  required: ["policy_id"],
  request: (args) => ({
    path: record("POLMAST", args.policy_id),
    method: "PATCH",
    body: fields(args, {
      status: "POLSTS",
      renewal_date: "RENWDT",
      premium: "PREMUM",
      payment_frequency: "PAYFRQ",
      sum_insured: "COVAMT",
      address_1: "ADDR1",
      address_2: "ADDR2",
      city: "CITY",
      county: "COUNTY",
      postcode: "PSTCDE",
      phone: "PHONE",
      mobile: "MOBILE",
      email: "EMAIL",
    }),
  }),
});
