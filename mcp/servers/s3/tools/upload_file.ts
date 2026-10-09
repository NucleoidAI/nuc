import { constants } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { defineAwsTool } from "../../../lib/aws-tool";
import { string } from "../../../lib/mock-api-tool";
import { bucketField, bucketOf, s3 } from "../client";

const MAX_BYTES = 100 * 1024 * 1024;

function prefix() {
  return (process.env.S3_PREFIX ?? "").replace(/^\/+|\/+$/g, "");
}

function assertInside(base: string, target: string) {
  if (target !== base && !target.startsWith(`${base}${path.sep}`))
    throw new Error(`Path is outside S3_UPLOAD_ROOT (${base})`);
}

async function openSource(given: string) {
  const requested = path.resolve(given);
  const root = (process.env.S3_UPLOAD_ROOT ?? "").trim();
  const base = root ? await fs.realpath(path.resolve(root)) : null;

  const real = await fs.realpath(requested);
  if (base) assertInside(base, real);

  const handle = await fs.open(
    real,
    constants.O_RDONLY | constants.O_NONBLOCK | constants.O_NOFOLLOW,
  );
  try {
    const stat = await handle.stat();
    const after = await fs.realpath(real);
    if (base) assertInside(base, after);
    const current = await fs.stat(after);
    if (current.dev !== stat.dev || current.ino !== stat.ino)
      throw new Error(`File changed while it was being opened: ${requested}`);
    return { handle, stat, source: requested };
  } catch (error) {
    await handle.close();
    throw error;
  }
}

async function readAll(handle: fs.FileHandle, size: number) {
  const buffer = Buffer.alloc(size + 1);
  let bytesRead = 0;
  while (bytesRead < buffer.length) {
    const { bytesRead: read } = await handle.read(
      buffer,
      bytesRead,
      buffer.length - bytesRead,
      bytesRead,
    );
    if (read === 0) break;
    bytesRead += read;
  }
  if (bytesRead > size) throw new Error("File changed while it was being read");
  return buffer.subarray(0, bytesRead);
}

export const uploadFileTool = defineAwsTool({
  name: "S3:upload_file",
  description:
    "Upload a file that is already on this machine's filesystem into the bucket, reading it straight off disk. Use this for a file another system handed over as a path, instead of reading the bytes yourself and passing them to S3:put_object. Give 'key' to choose where it lands; without one the file keeps its own name under the configured prefix.",
  properties: {
    path: string(
      "Absolute path of the file to upload, for example /srv/intake/8f2c/aspirin.mol",
    ),
    bucket: bucketField,
    key: string(
      "Full object key to write, for example intake/8f2c/aspirin.mol. Defaults to the file's own name under the configured prefix (S3_PREFIX).",
    ),
    content_type: string(
      "MIME type to store against the object, for example chemical/x-mdl-molfile",
    ),
  },
  required: ["path"],
  run: async (args) => {
    const { handle, stat, source } = await openSource(args.path);
    let body: Buffer;
    try {
      if (!stat.isFile()) throw new Error(`Not a file: ${source}`);
      if (stat.size > MAX_BYTES)
        throw new Error(
          `File is ${stat.size} bytes, over the ${MAX_BYTES} byte limit. Use S3:upload_url instead.`,
        );
      body = await readAll(handle, stat.size);
    } finally {
      await handle.close();
    }
    const bucket = bucketOf(args);
    const at = prefix();
    const key =
      args.key ?? `${at ? `${at}/` : ""}${path.basename(source)}`;
    const response = await s3().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: args.content_type,
      }),
    );
    return {
      bucket,
      key,
      path: source,
      content_length: body.byteLength,
      content_type: args.content_type ?? null,
      etag: response.ETag ?? null,
      version_id: response.VersionId ?? null,
    };
  },
});
