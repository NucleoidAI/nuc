import { defineTool, string } from "../../../lib/mock-api-tool";

export const listRecordsTool = defineTool({
  name: "AS400:list_records",
  description:
    "Read every record of a physical file or the computed records of a logical file (LPOLCTC, LUSRPOL, LUSRDIR, LOPNORD, LITMLOW, LDEPHDC). Use run_sql when the result has to be filtered. Uses the local IBM i (AS/400) enterprise mock API.",
  env: "AS400_API_URL",
  properties: {
    file: string(
      "Physical or logical file name, for example POLMAST or LPOLCTC",
    ),
  },
  required: ["file"],
  request: (args) => {
    const name = String(args.file).trim().toUpperCase();
    const path = name.startsWith("L")
      ? `/api/logicals/${encodeURIComponent(name)}`
      : `/api/files/${encodeURIComponent(name)}/records`;
    return { path };
  },
});
