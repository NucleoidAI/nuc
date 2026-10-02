import { defineTool, string } from "../../../lib/mock-api-tool";
import { code, quote, where } from "./query";

export const findUserTool = defineTool({
  name: "AS400:find_user",
  description:
    "Find users in USRMAST by e-mail, mobile, telephone, name, town or postcode. Matching on free text is case-insensitive; give at least one argument. Uses the local IBM i (AS/400) enterprise mock API.",
  env: "AS400_API_URL",
  properties: {
    user_id: string("User profile, for example MELLIS"),
    email: string("E-mail address, for example mark.ellis@corp.co.uk"),
    mobile: string("Mobile number as stored, for example +44 7700 900118"),
    phone: string("Telephone number as stored, for example +44 20 7946 0112"),
    name: string("Full or partial name, for example Ellis"),
    city: string("Town or city, for example London"),
    postcode: string("Postcode, for example WC2B 6LH"),
  },
  required: [],
  request: (args) => ({
    path: "/api/sql",
    method: "POST",
    body: {
      sql: `SELECT * FROM USRMAST WHERE ${where([
        args.user_id ? `USRID = ${code(args.user_id)}` : null,
        args.email ? `EMAIL LIKE ${quote(args.email)}` : null,
        args.mobile ? `MOBILE LIKE ${quote(args.mobile)}` : null,
        args.phone ? `PHONE LIKE ${quote(args.phone)}` : null,
        args.name
          ? `USRNAM LIKE ${quote(`%${String(args.name).trim()}%`)}`
          : null,
        args.city ? `CITY LIKE ${quote(args.city)}` : null,
        args.postcode ? `PSTCDE = ${code(args.postcode)}` : null,
      ])}`,
    },
  }),
});
