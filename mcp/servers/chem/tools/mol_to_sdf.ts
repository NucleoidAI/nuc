import { defineLocalTool } from "../../../lib/local-tool";
import { string } from "../../../lib/mock-api-tool";
import { dataFrom, parseRecords, titlesFrom, toSdf } from "../molfile";

const MAX_BYTES = 1024 * 1024;

export const molToSdfTool = defineLocalTool({
  name: "CHEM:mol_to_sdf",
  description:
    "Convert one or more MOL blocks (V2000 or V3000) into a single SDF document. Several molfiles pasted one after another become several SDF records, and SDF given as input keeps the data fields it already carries. The atom and bond blocks are passed through untouched - no chemistry is inferred, nothing is re-computed. Returns the SDF as text; write it somewhere with S3:put_object if it needs to be stored.",
  properties: {
    content: string(
      "The molfile text. May hold several MOL blocks back to back, or already be an SDF.",
    ),
    title: string(
      'Title line to set on the record. For several records give a JSON array in order, for example ["aspirin","caffeine"]. Leave it out to keep the titles already in the input.',
    ),
    data: string(
      'SDF data fields to attach, as JSON. An object applies to every record, an array applies one entry per record, for example {"ID":"CPD-1","SOURCE":"inbox"}.',
    ),
    max_bytes: {
      type: "integer",
      minimum: 1,
      maximum: MAX_BYTES,
      description: `Refuse to return an SDF larger than this. Defaults to ${MAX_BYTES}.`,
    },
  },
  required: ["content"],
  run: async (args) => {
    const records = parseRecords(args.content);
    const titles = titlesFrom(args.title, records.length);
    const data = dataFrom(args.data, records.length);
    records.forEach((record, index) => {
      if (titles[index] !== undefined) record.mol[0] = titles[index];
      if (data[index]) record.data = { ...record.data, ...data[index] };
    });
    const sdf = toSdf(records);
    const bytes = Buffer.byteLength(sdf, "utf-8");
    const limit = args.max_bytes ?? MAX_BYTES;
    if (bytes > limit)
      throw new Error(
        `The SDF is ${bytes} bytes, over the ${limit} byte limit. Convert fewer records at a time.`,
      );
    return {
      record_count: records.length,
      bytes,
      titles: records.map((record) => record.mol[0].trim()),
      data_fields: records.map((record) => Object.keys(record.data)),
      sdf,
    };
  },
});
