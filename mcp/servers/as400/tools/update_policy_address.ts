import { defineTool, string } from "../../../lib/mock-api-tool";
import { fields, record } from "./query";

export const updatePolicyAddressTool = defineTool({
  name: "AS400:update_policy_address",
  description:
    "Change the risk address held against a POLMAST record — address lines, town or city, county and postcode. Every other field on the policy is left as it was. Uses the local IBM i (AS/400) enterprise mock API.",
  env: "AS400_API_URL",
  properties: {
    policy_id: string(
      "Policy number of the record to change, for example MTR-20260041",
    ),
    address_1: string("New risk address line 1"),
    address_2: string("New risk address line 2"),
    city: string("New town or city"),
    county: string("New county"),
    postcode: string("New postcode, up to 8 characters"),
  },
  required: ["policy_id"],
  request: (args) => ({
    path: record("POLMAST", args.policy_id),
    method: "PATCH",
    body: fields(args, {
      address_1: "ADDR1",
      address_2: "ADDR2",
      city: "CITY",
      county: "COUNTY",
      postcode: "PSTCDE",
    }),
  }),
  response: (payload) => ({
    status: payload.status,
    policy_id: payload.record?.POLID,
    address_1: payload.record?.ADDR1 ?? null,
    address_2: payload.record?.ADDR2 ?? null,
    city: payload.record?.CITY ?? null,
    county: payload.record?.COUNTY ?? null,
    postcode: payload.record?.PSTCDE ?? null,
  }),
});
