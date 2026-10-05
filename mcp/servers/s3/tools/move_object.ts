import { CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { defineAwsTool } from "../../../lib/aws-tool";
import { string } from "../../../lib/mock-api-tool";
import { bucketField, bucketOf, s3, sourceBucketField } from "../client";

export const moveObjectTool = defineAwsTool({
  name: "S3:move_object",
  description:
    "Move or rename an object: copy it to the new key, then delete the original. S3 has no native rename, so this is how a key gets changed. The source is only deleted once the copy has succeeded.",
  properties: {
    source_bucket: sourceBucketField,
    source_key: string("Current key of the object"),
    bucket: bucketField,
    destination_key: string("Key the object should end up at"),
  },
  required: ["source_key", "destination_key"],
  run: async (args) => {
    const sourceBucket = bucketOf(args, "source_bucket");
    const bucket = bucketOf(args);
    if (sourceBucket === bucket && args.source_key === args.destination_key)
      throw new Error("Source and destination are the same object");
    const copy = await s3().send(
      new CopyObjectCommand({
        Bucket: bucket,
        Key: args.destination_key,
        CopySource: encodeURIComponent(`${sourceBucket}/${args.source_key}`),
      }),
    );
    await s3().send(
      new DeleteObjectCommand({ Bucket: sourceBucket, Key: args.source_key }),
    );
    return {
      moved_from: { bucket: sourceBucket, key: args.source_key },
      bucket,
      key: args.destination_key,
      etag: copy.CopyObjectResult?.ETag ?? null,
    };
  },
});
