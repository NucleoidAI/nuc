import { afterEach, beforeEach, expect, test } from "bun:test";
import { tools as s3Tools } from "../servers/s3/tools";
import { s3 } from "../servers/s3/client";

const saved = {
  bucket: process.env.S3_BUCKET,
  region: process.env.S3_REGION,
  key: process.env.AWS_ACCESS_KEY_ID,
  secret: process.env.AWS_SECRET_ACCESS_KEY,
};
const originalSend = s3().send.bind(s3());

beforeEach(() => {
  process.env.S3_BUCKET = "greycollar-demo";
  process.env.S3_REGION = "eu-central-1";
  process.env.AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE";
  process.env.AWS_SECRET_ACCESS_KEY = "secret";
});

afterEach(() => {
  (s3() as any).send = originalSend;
  for (const [name, value] of [
    ["S3_BUCKET", saved.bucket],
    ["S3_REGION", saved.region],
    ["AWS_ACCESS_KEY_ID", saved.key],
    ["AWS_SECRET_ACCESS_KEY", saved.secret],
  ] as const)
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
});

function tool(name: string) {
  return s3Tools.find((candidate) => candidate.name === name)!;
}

function stub(responses: unknown | unknown[] = {}) {
  const queue = Array.isArray(responses) ? [...responses] : [responses];
  const calls: { command: string; input: any }[] = [];
  (s3() as any).send = async (command: any) => {
    calls.push({ command: command.constructor.name, input: command.input });
    return queue.length > 1 ? queue.shift() : (queue[0] ?? {});
  };
  return calls;
}

const payload = async (result: any) => JSON.parse(result.content[0].text);

const bodyOf = (bytes: Uint8Array) => ({
  Body: { transformToByteArray: async () => bytes },
  ContentLength: bytes.byteLength,
});

test("All 10 tools expose unique names, schemas and handlers", () => {
  expect(s3Tools.length).toBe(10);
  expect(new Set(s3Tools.map((t) => t.name)).size).toBe(10);
  for (const candidate of s3Tools) {
    expect(candidate.name).toMatch(/^S3:[a-z_]+$/);
    expect(candidate.description.length).toBeGreaterThan(0);
    expect(candidate.inputSchema.additionalProperties).toBe(false);
    for (const key of candidate.inputSchema.required)
      expect(candidate.inputSchema.properties[key]).toBeDefined();
  }
});

test("Tools fall back to S3_BUCKET and honour a bucket override", async () => {
  const calls = stub({ Contents: [] });
  await tool("S3:list_objects").handler({ prefix: "invoices/" });
  expect(calls[0].input.Bucket).toBe("greycollar-demo");
  expect(calls[0].input.Prefix).toBe("invoices/");
  expect(calls[0].input.MaxKeys).toBe(100);
  await tool("S3:list_objects").handler({ bucket: "other-bucket" });
  expect(calls[1].input.Bucket).toBe("other-bucket");
});

test("A call without a bucket anywhere is an error, not a guess", async () => {
  delete process.env.S3_BUCKET;
  stub({});
  const result = await tool("S3:get_object_metadata").handler({ key: "a.txt" });
  expect(result.isError).toBe(true);
  expect((await payload(result)).error).toContain("S3_BUCKET");
});

test("get_object returns text for a UTF-8 body and base64 otherwise", async () => {
  stub(bodyOf(new TextEncoder().encode("merhaba")));
  const text = await payload(
    await tool("S3:get_object").handler({ key: "notes.txt" }),
  );
  expect(text.encoding).toBe("utf-8");
  expect(text.content).toBe("merhaba");

  stub(bodyOf(new Uint8Array([0xff, 0xfe, 0x00])));
  const binary = await payload(
    await tool("S3:get_object").handler({ key: "logo.png" }),
  );
  expect(binary.encoding).toBe("base64");
  expect(Buffer.from(binary.content, "base64")).toEqual(
    Buffer.from([0xff, 0xfe, 0x00]),
  );
});

test("get_object refuses a body over the size limit", async () => {
  stub({
    Body: { transformToByteArray: async () => new Uint8Array(0) },
    ContentLength: 9_000_000,
  });
  const result = await tool("S3:get_object").handler({ key: "big.zip" });
  expect(result.isError).toBe(true);
  expect((await payload(result)).error).toContain("S3:download_url");
});

test("put_object takes exactly one of content and content_base64", async () => {
  const calls = stub({ ETag: '"abc"' });
  const written = await payload(
    await tool("S3:put_object").handler({
      key: "reports/q3.md",
      content: "# Q3",
      content_type: "text/markdown",
    }),
  );
  expect(calls[0].command).toBe("PutObjectCommand");
  expect(calls[0].input.ContentType).toBe("text/markdown");
  expect(Buffer.from(calls[0].input.Body).toString()).toBe("# Q3");
  expect(written.content_length).toBe(4);

  for (const args of [
    { key: "a.txt" },
    { key: "a.txt", content: "x", content_base64: "eA==" },
  ]) {
    const result = await tool("S3:put_object").handler(args);
    expect(result.isError).toBe(true);
  }
});

test("copy_object encodes the source and can cross buckets", async () => {
  const calls = stub({ CopyObjectResult: { ETag: '"abc"' } });
  await tool("S3:copy_object").handler({
    source_bucket: "archive",
    source_key: "2026/report final.pdf",
    destination_key: "reports/report.pdf",
  });
  expect(calls[0].input.CopySource).toBe(
    encodeURIComponent("archive/2026/report final.pdf"),
  );
  expect(calls[0].input.Bucket).toBe("greycollar-demo");
  expect(calls[0].input.MetadataDirective).toBeUndefined();
});

test("move_object copies first, then deletes the source", async () => {
  const calls = stub([{ CopyObjectResult: { ETag: '"abc"' } }, {}]);
  const moved = await payload(
    await tool("S3:move_object").handler({
      source_key: "inbox/a.txt",
      destination_key: "processed/a.txt",
    }),
  );
  expect(calls.map((call) => call.command)).toEqual([
    "CopyObjectCommand",
    "DeleteObjectCommand",
  ]);
  expect(calls[1].input.Key).toBe("inbox/a.txt");
  expect(moved.key).toBe("processed/a.txt");
});

test("move_object refuses a no-op move", async () => {
  const calls = stub({});
  const result = await tool("S3:move_object").handler({
    source_key: "a.txt",
    destination_key: "a.txt",
  });
  expect(result.isError).toBe(true);
  expect(calls.length).toBe(0);
});

test("delete_object reports the delete marker back", async () => {
  const calls = stub({ DeleteMarker: true, VersionId: "v2" });
  const result = await payload(
    await tool("S3:delete_object").handler({ key: "old.txt" }),
  );
  expect(calls[0].command).toBe("DeleteObjectCommand");
  expect(result).toMatchObject({ deleted: true, delete_marker: true });
});

test("download_url signs a link that expires", async () => {
  const result = await payload(
    await tool("S3:download_url").handler({
      key: "invoices/INV-1041.pdf",
      expires_in: 120,
      download_as: "invoice.pdf",
    }),
  );
  expect(result.url).toContain(
    "greycollar-demo.s3.eu-central-1.amazonaws.com/invoices/INV-1041.pdf",
  );
  expect(result.url).toContain("X-Amz-Expires=120");
  expect(result.url).toContain("response-content-disposition");
  expect(result.expires_in).toBe(120);
});

test("upload_url signs a PUT link", async () => {
  const result = await payload(
    await tool("S3:upload_url").handler({ key: "uploads/new.csv" }),
  );
  expect(result.method).toBe("PUT");
  expect(result.url).toContain("X-Amz-Expires=900");
});

test("Out of range and unknown arguments are rejected before any AWS call", async () => {
  const calls = stub({});
  for (const args of [
    { key: "a.txt", expires_in: 10 },
    { key: "a.txt", nope: "x" },
    { key: "" },
  ]) {
    const result = await tool("S3:download_url").handler(args);
    expect(result.isError).toBe(true);
  }
  expect(calls.length).toBe(0);
});
