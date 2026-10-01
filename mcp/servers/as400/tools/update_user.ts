import { defineTool, string } from "../../../lib/mock-api-tool";
import { fields, record } from "./query";

export const updateUserTool = defineTool({
  name: "AS400:update_user",
  description:
    "Change the contact details or status of a USRMAST record — e-mail, telephone, mobile, address, department, job title, salary or status. The user profile itself cannot be changed. Uses the local IBM i (AS/400) enterprise mock API.",
  env: "AS400_API_URL",
  properties: {
    user_id: string("User profile of the record to change, for example MELLIS"),
    name: string("Full name"),
    email: string("E-mail address"),
    phone: string("Telephone"),
    mobile: string("Mobile"),
    address_1: string("Address line 1"),
    address_2: string("Address line 2"),
    city: string("Town or city"),
    county: string("County"),
    postcode: string("Postcode, up to 8 characters"),
    department: {
      type: "string",
      description: "Department code",
      enum: ["ADM", "FIN", "IT", "SLS", "OPS"],
    },
    job_title: string("Job title"),
    salary: { type: "number", minimum: 0, description: "Annual salary" },
    status: {
      type: "string",
      description: "A active, L on leave, T terminated",
      enum: ["A", "L", "T"],
    },
  },
  required: ["user_id"],
  request: (args) => ({
    path: record("USRMAST", args.user_id),
    method: "PATCH",
    body: fields(args, {
      name: "USRNAM",
      email: "EMAIL",
      phone: "PHONE",
      mobile: "MOBILE",
      address_1: "ADDR1",
      address_2: "ADDR2",
      city: "CITY",
      county: "COUNTY",
      postcode: "PSTCDE",
      department: "DEPTNO",
      job_title: "JOBTTL",
      salary: "SALARY",
      status: "USRSTS",
    }),
  }),
});
