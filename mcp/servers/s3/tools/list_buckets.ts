import { ListBucketsCommand } from "@aws-sdk/client-s3";
import { defineAwsTool } from "../../../lib/aws-tool";
import { iso, s3 } from "../client";

export const listBucketsTool = defineAwsTool({
  name: "S3:list_buckets",
  description:
    "List every S3 bucket the configured AWS credentials can see, with the region each one was created in. Use this to discover bucket names before working on objects.",
  properties: {},
  run: async () => {
    const response = await s3().send(new ListBucketsCommand({}));
    return {
      default_bucket: process.env.S3_BUCKET ?? null,
      buckets: (response.Buckets ?? []).map((bucket) => ({
        name: bucket.Name,
        created_at: iso(bucket.CreationDate),
      })),
    };
  },
});
