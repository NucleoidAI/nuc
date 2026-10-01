import { S3Client } from "@aws-sdk/client-s3";
import type { Field } from "../../lib/mock-api-tool";

let client: S3Client | undefined;

export function s3() {
  if (!client) {
    const region =
      process.env.S3_REGION || process.env.AWS_REGION || "eu-central-1";
    client = new S3Client({ region });
  }
  return client;
}

export function bucketOf(args: Record<string, any>, key = "bucket") {
  const bucket = String(args[key] ?? process.env.S3_BUCKET ?? "").trim();
  if (!bucket)
    throw new Error(
      `No bucket given and S3_BUCKET is not configured for this server`,
    );
  return bucket;
}

export const bucketField: Field = {
  type: "string",
  description:
    "Bucket name. Leave it out to use the bucket this server is configured with (S3_BUCKET).",
};

export const sourceBucketField: Field = {
  type: "string",
  description:
    "Bucket the source object lives in. Defaults to the configured bucket (S3_BUCKET).",
};

export const iso = (value?: Date) => value?.toISOString() ?? null;
