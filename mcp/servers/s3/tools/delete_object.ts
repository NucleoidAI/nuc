import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { defineAwsTool } from "../../../lib/aws-tool";
import { string } from "../../../lib/mock-api-tool";
import { bucketField, bucketOf, s3 } from "../client";

export const deleteObjectTool = defineAwsTool({
  name: "S3:delete_object",
  description:
    "Permanently delete one object. On a bucket without versioning this cannot be undone, so confirm the key with S3:get_object_metadata first. S3 reports success even when the key never existed.",
  properties: {
    bucket: bucketField,
    key: string("Full key of the object to delete"),
    version_id: string(
      "Delete this specific version instead of adding a delete marker, on a versioned bucket",
    ),
  },
  required: ["key"],
  run: async (args) => {
    const bucket = bucketOf(args);
    const response = await s3().send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: args.key,
        VersionId: args.version_id,
      }),
    );
    return {
      bucket,
      key: args.key,
      deleted: true,
      delete_marker: Boolean(response.DeleteMarker),
      version_id: response.VersionId ?? null,
    };
  },
});
