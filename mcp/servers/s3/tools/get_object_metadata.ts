import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { defineAwsTool } from "../../../lib/aws-tool";
import { string } from "../../../lib/mock-api-tool";
import { bucketField, bucketOf, iso, s3 } from "../client";

export const getObjectMetadataTool = defineAwsTool({
  name: "S3:get_object_metadata",
  description:
    "Check whether an object exists and read its size, MIME type, last modified date and storage class without downloading the body. Use this before reading, overwriting or deleting a key.",
  properties: {
    bucket: bucketField,
    key: string("Full key of the object to inspect"),
  },
  required: ["key"],
  run: async (args) => {
    const bucket = bucketOf(args);
    const response = await s3().send(
      new HeadObjectCommand({ Bucket: bucket, Key: args.key }),
    );
    return {
      bucket,
      key: args.key,
      exists: true,
      content_type: response.ContentType ?? null,
      content_length: response.ContentLength ?? null,
      last_modified: iso(response.LastModified),
      etag: response.ETag ?? null,
      storage_class: response.StorageClass ?? "STANDARD",
      version_id: response.VersionId ?? null,
      metadata: response.Metadata ?? {},
    };
  },
});
