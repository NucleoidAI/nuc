import { GetObjectCommand } from "@aws-sdk/client-s3";
import { defineAwsTool } from "../../../lib/aws-tool";
import { string } from "../../../lib/mock-api-tool";
import { bucketField, bucketOf, iso, s3 } from "../client";

const MAX_BYTES = 5 * 1024 * 1024;

export const getObjectTool = defineAwsTool({
  name: "S3:get_object",
  description:
    "Read the contents of one object. Text files come back as plain text, anything else as base64. Objects larger than 5 MB are refused - use S3:download_url for those instead.",
  properties: {
    bucket: bucketField,
    key: string("Full object key, for example invoices/2026/INV-1041.pdf"),
    max_bytes: {
      type: "integer",
      minimum: 1,
      maximum: MAX_BYTES,
      description: `Refuse the read if the object is larger than this. Defaults to ${MAX_BYTES}.`,
    },
  },
  required: ["key"],
  run: async (args) => {
    const bucket = bucketOf(args);
    const limit = args.max_bytes ?? MAX_BYTES;
    const response = await s3().send(
      new GetObjectCommand({ Bucket: bucket, Key: args.key }),
    );
    if (response.ContentLength !== undefined && response.ContentLength > limit)
      throw new Error(
        `Object is ${response.ContentLength} bytes, over the ${limit} byte limit. Use S3:download_url instead.`,
      );
    const bytes = await response.Body!.transformToByteArray();
    if (bytes.byteLength > limit)
      throw new Error(
        `Object is ${bytes.byteLength} bytes, over the ${limit} byte limit. Use S3:download_url instead.`,
      );
    let content: string;
    let encoding: "utf-8" | "base64";
    try {
      content = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      encoding = "utf-8";
    } catch {
      content = Buffer.from(bytes).toString("base64");
      encoding = "base64";
    }
    return {
      bucket,
      key: args.key,
      content_type: response.ContentType ?? null,
      content_length: bytes.byteLength,
      last_modified: iso(response.LastModified),
      etag: response.ETag ?? null,
      encoding,
      content,
    };
  },
});
