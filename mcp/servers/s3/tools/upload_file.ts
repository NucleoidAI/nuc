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

function resolvePath(given: string) {
  const resolved = path.resolve(given);
  const root = (process.env.S3_UPLOAD_ROOT ?? "").trim();
  if (!root) return resolved;
  const base = path.resolve(root);
  if (resolved !== base && !resolved.startsWith(`${base}${path.sep}`))
    throw new Error(`Path is outside S3_UPLOAD_ROOT (${base})`);
  return resolved;
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
    const source = resolvePath(args.path);
    const stat = await fs.stat(source);
    if (!stat.isFile()) throw new Error(`Not a file: ${source}`);
    if (stat.size > MAX_BYTES)
      throw new Error(
        `File is ${stat.size} bytes, over the ${MAX_BYTES} byte limit. Use S3:upload_url instead.`,
      );
    const bucket = bucketOf(args);
    const at = prefix();
    const key =
      args.key ?? `${at ? `${at}/` : ""}${path.basename(source)}`;
    const body = await fs.readFile(source);
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
