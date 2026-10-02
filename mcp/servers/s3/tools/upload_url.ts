import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { defineAwsTool } from "../../../lib/aws-tool";
import { string } from "../../../lib/mock-api-tool";
import { bucketField, bucketOf, s3 } from "../client";

const DEFAULT_EXPIRY = 900;

export const uploadUrlTool = defineAwsTool({
  name: "S3:upload_url",
  description:
    "Create a time limited upload link, so someone can PUT a file straight into the bucket without AWS credentials. Use this when the file is too large to pass through S3:put_object or is not yet in hand.",
  properties: {
    bucket: bucketField,
    key: string("Key the uploaded file should be stored under"),
    content_type: string(
      "MIME type the uploader must send. When set, their PUT has to match it.",
    ),
    expires_in: {
      type: "integer",
      minimum: 60,
      maximum: 604800,
      description: `How long the link stays valid, in seconds. Defaults to ${DEFAULT_EXPIRY}, at most 7 days.`,
    },
  },
  required: ["key"],
  run: async (args) => {
    const bucket = bucketOf(args);
    const expiresIn = args.expires_in ?? DEFAULT_EXPIRY;
    const url = await getSignedUrl(
      s3(),
      new PutObjectCommand({
        Bucket: bucket,
        Key: args.key,
        ContentType: args.content_type,
      }),
      { expiresIn },
    );
    return {
      bucket,
      key: args.key,
      url,
      method: "PUT",
      content_type: args.content_type ?? null,
      expires_in: expiresIn,
      expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
    };
  },
});
