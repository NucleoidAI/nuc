import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { defineAwsTool } from "../../../lib/aws-tool";
import { string } from "../../../lib/mock-api-tool";
import { bucketField, bucketOf, s3 } from "../client";

const DEFAULT_EXPIRY = 900;

export const downloadUrlTool = defineAwsTool({
  name: "S3:download_url",
  description:
    "Create a time limited download link for an object, so a person can fetch it without AWS credentials. Use this for large files and for anything that should be handed to a customer, instead of reading the body with S3:get_object.",
  properties: {
    bucket: bucketField,
    key: string("Full key of the object to hand out"),
    expires_in: {
      type: "integer",
      minimum: 60,
      maximum: 604800,
      description: `How long the link stays valid, in seconds. Defaults to ${DEFAULT_EXPIRY}, at most 7 days.`,
    },
    download_as: string(
      "Filename the browser should save the file as, instead of the key",
    ),
  },
  required: ["key"],
  run: async (args) => {
    const bucket = bucketOf(args);
    const expiresIn = args.expires_in ?? DEFAULT_EXPIRY;
    const url = await getSignedUrl(
      s3(),
      new GetObjectCommand({
        Bucket: bucket,
        Key: args.key,
        ResponseContentDisposition: args.download_as
          ? `attachment; filename="${String(args.download_as).replace(/"/g, "")}"`
          : undefined,
      }),
      { expiresIn },
    );
    return {
      bucket,
      key: args.key,
      url,
      expires_in: expiresIn,
      expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
    };
  },
});
