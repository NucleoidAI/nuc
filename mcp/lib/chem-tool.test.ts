import { expect, test } from "bun:test";
import { tools as chemTools } from "../servers/chem/tools";
import { parseRecords, toSdf } from "../servers/chem/molfile";

const water = [
  "water",
  "  Greycollar",
  "",
  "  3  2  0  0  0  0  0  0  0  0999 V2000",
  "    0.0000    0.0000    0.0000 O   0  0",
  "    0.9500    0.0000    0.0000 H   0  0",
  "   -0.2400    0.9200    0.0000 H   0  0",
  "  1  2  1  0",
  "  1  3  1  0",
  "M  END",
].join("\n");

const v3000 = [
  "methane",
  "  Greycollar",
  "",
  "  0  0  0  0  0  0  0  0  0  0999 V3000",
  "M  V30 BEGIN CTAB",
  "M  V30 COUNTS 1 0 0 0 0",
  "M  V30 BEGIN ATOM",
  "M  V30 1 C 0 0 0 0",
  "M  V30 END ATOM",
  "M  V30 END CTAB",
  "M  END",
].join("\n");

const tool = chemTools.find(
  (candidate) => candidate.name === "CHEM:mol_to_sdf",
)!;

async function call(args: Record<string, unknown>) {
  const response = await tool.handler(args);
  return { ...JSON.parse(response.content[0].text), isError: response.isError };
}

test("wraps a single molfile into one SDF record", async () => {
  const result = await call({ content: water });
  expect(result.isError).toBe(false);
  expect(result.record_count).toBe(1);
  expect(result.sdf.endsWith("M  END\n$$$$\n")).toBe(true);
  expect(result.sdf).toContain("  3  2  0  0  0  0  0  0  0  0999 V2000");
});

test("splits molfiles pasted back to back", async () => {
  const result = await call({ content: `${water}\n${v3000}\n` });
  expect(result.record_count).toBe(2);
  expect(result.titles).toEqual(["water", "methane"]);
  expect(result.sdf.match(/\$\$\$\$/g)).toHaveLength(2);
});

test("keeps V3000 blocks byte for byte", async () => {
  const result = await call({ content: v3000 });
  expect(result.sdf.startsWith(v3000)).toBe(true);
});

test("sets titles from a JSON array", async () => {
  const result = await call({
    content: `${water}\n${v3000}\n`,
    title: '["H2O","CH4"]',
  });
  expect(result.titles).toEqual(["H2O", "CH4"]);
  expect(result.sdf.split("\n")[0]).toBe("H2O");
});

test("accepts a bare string as the title of a single record", async () => {
  const result = await call({ content: water, title: "H2O" });
  expect(result.titles).toEqual(["H2O"]);
});

test("attaches one data object to every record", async () => {
  const result = await call({
    content: `${water}\n${v3000}\n`,
    data: '{"SOURCE":"inbox"}',
  });
  expect(result.data_fields).toEqual([["SOURCE"], ["SOURCE"]]);
  expect(result.sdf).toContain("> <SOURCE>\ninbox\n\n$$$$");
});

test("attaches data per record from an array", async () => {
  const result = await call({
    content: `${water}\n${v3000}\n`,
    data: '[{"ID":"1"},{"ID":"2"}]',
  });
  expect(result.sdf).toContain("> <ID>\n1\n");
  expect(result.sdf).toContain("> <ID>\n2\n");
});

test("round-trips SDF input and keeps its existing fields", async () => {
  const first = await call({ content: water, data: '{"ID":"CPD-1"}' });
  const second = await call({ content: first.sdf, data: '{"BATCH":"B7"}' });
  expect(second.record_count).toBe(1);
  expect(second.data_fields).toEqual([["ID", "BATCH"]]);
});

test("normalises CRLF input", async () => {
  const result = await call({ content: water.replace(/\n/g, "\r\n") });
  expect(result.sdf).not.toContain("\r");
  expect(result.record_count).toBe(1);
});

test("keeps a blank title line intact", async () => {
  const untitled = `\n  Greycollar\n\n${water.split("\n").slice(3).join("\n")}`;
  expect(parseRecords(untitled)[0].mol[0]).toBe("");
});

test("rejects input with no counts line", async () => {
  const result = await call({ content: "not a molfile at all" });
  expect(result.isError).toBe(true);
  expect(result.error).toContain("Not a molfile");
});

test("rejects a MOL block with no M  END", async () => {
  const result = await call({
    content: water.split("\n").slice(0, -1).join("\n"),
  });
  expect(result.isError).toBe(true);
  expect(result.error).toContain("M  END");
});

test("rejects more titles than records", async () => {
  const result = await call({ content: water, title: '["a","b"]' });
  expect(result.isError).toBe(true);
  expect(result.error).toContain("2 titles for 1 record");
});

test("rejects non-JSON data", async () => {
  const result = await call({ content: water, data: "ID=1" });
  expect(result.isError).toBe(true);
  expect(result.error).toContain("must be JSON");
});

test("rejects a data value holding a blank line", async () => {
  expect(() =>
    toSdf([
      { mol: ["x", "", "", "  1  0", "M  END"], data: { NOTE: "a\n\nb" } },
    ]),
  ).toThrow("blank line");
});

test("refuses output over max_bytes", async () => {
  const result = await call({ content: water, max_bytes: 10 });
  expect(result.isError).toBe(true);
  expect(result.error).toContain("over the 10 byte limit");
});

test("rejects unknown arguments", async () => {
  const result = await call({ content: water, bucket: "x" });
  expect(result.isError).toBe(true);
  expect(result.error).toContain("Unknown argument");
});

test("derives the sdf key from source_key, keeping folder and base name", async () => {
  const result = await call({
    content: water,
    source_key: "intake/d392a2c1/ethanol.mol",
  });
  expect(result.output_key).toBe("intake/d392a2c1/ethanol.sdf");
});

test("appends .sdf when the source key has no extension of its own", async () => {
  expect((await call({ content: water, source_key: "intake/ethanol" })).output_key).toBe(
    "intake/ethanol.sdf",
  );
  expect((await call({ content: water, source_key: "intake/.hidden" })).output_key).toBe(
    "intake/.hidden.sdf",
  );
});

test("leaves output_key out when no source_key is given", async () => {
  expect(await call({ content: water })).not.toHaveProperty("output_key");
});
