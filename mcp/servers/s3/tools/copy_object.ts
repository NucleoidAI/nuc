import { CopyObjectCommand } from "@aws-sdk/client-s3";
import { defineAwsTool } from "../../../lib/aws-tool";
import { string } from "../../../lib/mock-api-tool";
import { bucketField, bucketOf, iso, s3, sourceBucketField } from "../client";

export const copyObjectTool = defineAwsTool({
  name: "S3:copy_object",
  description:
    "Copy an object to another key, optionally into a different bucket. The source is left untouched. Use this to duplicate a file or to take a backup before overwriting one.",
  properties: {
    source_bucket: sourceBucketField,
    source_key: string("Key of the object to copy from"),
    bucket: bucketField,
    destination_key: string("Key to copy the object to"),
    content_type: string(
      "Replace the stored MIME type on the copy instead of carrying the original over",
    ),
  },
  required: ["source_key", "destination_key"],
  run: async (args) => {
    const sourceBucket = bucketOf(args, "source_bucket");
    const bucket = bucketOf(args);
    const response = await s3().send(
      new CopyObjectCommand({
        Bucket: bucket,
        Key: args.destination_key,
        CopySource: encodeURIComponent(`${sourceBucket}/${args.source_key}`),
        ContentType: args.content_type,
        MetadataDirective: args.content_type ? "REPLACE" : undefined,
      }),
    );
    return {
      source_bucket: sourceBucket,
      source_key: args.source_key,
      bucket,
      key: args.destination_key,
      etag: response.CopyObjectResult?.ETag ?? null,
      last_modified: iso(response.CopyObjectResult?.LastModified),
    };
  },
});
