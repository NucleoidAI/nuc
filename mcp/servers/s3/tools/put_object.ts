import { PutObjectCommand } from "@aws-sdk/client-s3";
import { defineAwsTool } from "../../../lib/aws-tool";
import { string } from "../../../lib/mock-api-tool";
import { bucketField, bucketOf, s3 } from "../client";

export const putObjectTool = defineAwsTool({
  name: "S3:put_object",
  description:
    "Write an object, creating it or overwriting whatever is already at that key. Give text in 'content', or binary in 'content_base64'. Writing to an existing key replaces it, so read it first if the old version still matters.",
  properties: {
    bucket: bucketField,
    key: string("Full object key to write, for example reports/q3-summary.md"),
    content: string("The object body as UTF-8 text"),
    content_base64: string(
      "The object body as base64, for anything that is not text",
    ),
    content_type: string(
      "MIME type to store against the object, for example application/pdf",
    ),
  },
  required: ["key"],
  run: async (args) => {
    if (args.content === undefined && args.content_base64 === undefined)
      throw new Error("Either content or content_base64 is required");
    if (args.content !== undefined && args.content_base64 !== undefined)
      throw new Error("Give either content or content_base64, not both");
    const bucket = bucketOf(args);
    const body = args.content_base64
      ? Buffer.from(args.content_base64, "base64")
      : Buffer.from(String(args.content), "utf-8");
    const response = await s3().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: args.key,
        Body: body,
        ContentType: args.content_type,
      }),
    );
    return {
      bucket,
      key: args.key,
      content_length: body.byteLength,
      etag: response.ETag ?? null,
      version_id: response.VersionId ?? null,
    };
  },
});
