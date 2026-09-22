import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { defineAwsTool } from "../../../lib/aws-tool";
import { string } from "../../../lib/mock-api-tool";
import { bucketField, bucketOf, iso, s3 } from "../client";

export const listObjectsTool = defineAwsTool({
  name: "S3:list_objects",
  description:
    "List the objects in a bucket, newest page first. Narrow the result with 'prefix' to look inside one folder, and set 'delimiter' to '/' to get folder names back as prefixes instead of every nested key. Pass the returned 'next_token' back in to read the following page.",
  properties: {
    bucket: bucketField,
    prefix: string(
      "Only list keys starting with this prefix, for example invoices/2026/",
    ),
    delimiter: string(
      "Group keys sharing a prefix up to this character. Use '/' to browse folder by folder.",
    ),
    max_keys: {
      type: "integer",
      minimum: 1,
      maximum: 1000,
      description: "How many keys to return per page. Defaults to 100.",
    },
    next_token: string(
      "Continuation token from a previous list_objects call, to read the next page",
    ),
  },
  run: async (args) => {
    const response = await s3().send(
      new ListObjectsV2Command({
        Bucket: bucketOf(args),
        Prefix: args.prefix,
        Delimiter: args.delimiter,
        MaxKeys: args.max_keys ?? 100,
        ContinuationToken: args.next_token,
      }),
    );
    return {
      bucket: bucketOf(args),
      objects: (response.Contents ?? []).map((object) => ({
        key: object.Key,
        size: object.Size,
        last_modified: iso(object.LastModified),
        etag: object.ETag,
        storage_class: object.StorageClass,
      })),
      prefixes: (response.CommonPrefixes ?? []).map((entry) => entry.Prefix),
      is_truncated: Boolean(response.IsTruncated),
      next_token: response.NextContinuationToken ?? null,
    };
  },
});
