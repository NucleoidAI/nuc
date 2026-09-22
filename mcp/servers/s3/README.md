# AWS S3 MCP

Unlike the other servers under `mcp/servers`, this one is not a mock: it talks
to real AWS S3 through `@aws-sdk/client-s3`. Every write, delete and move hits
the real bucket.

Start it with
`S3_BUCKET=my-bucket AWS_REGION=eu-central-1 bun mcp/servers/s3/index.ts` from
the repository root. Greycollar's `McpClient` resolves this entrypoint using
server ID `s3`.

Tools (prefix `S3:`):

- Browse: `list_buckets`, `list_objects`, `get_object_metadata`
- Read and write: `get_object`, `put_object`
- Rearrange: `copy_object`, `move_object`, `delete_object`
- Hand off to people: `download_url`, `upload_url`

## Bucket scoping

`S3_BUCKET` is the default bucket for every tool. Each tool also takes an
optional `bucket` argument that overrides it, and the copy/move tools take a
`source_bucket` as well, so an agent can move an object between buckets. If
neither is set the call fails rather than guessing.

To lock an agent to a single bucket, leave the IAM policy behind the
credentials scoped to that bucket — the `bucket` argument cannot be disabled
from configuration alone.

## Environment

| Key                                           | Required | Notes                                                                                                                    |
| --------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------ |
| `S3_BUCKET`                                   | yes      | Default bucket for tools called without `bucket`.                                                                        |
| `S3_REGION`                                   | no       | Falls back to `AWS_REGION`, then `eu-central-1`.                                                                         |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | yes      | Read from the process environment by the SDK's default credential chain, so an instance role or `AWS_PROFILE` works too. |

Configure `S3_BUCKET` and `S3_REGION` per team or agent in MCP environment
settings. Credentials come from the API process environment (the repo keeps
them in the root `.env.local`, which is why the stack has to be started with
`bun run dev`), not from the seeds.

## Reading and writing bodies

`get_object` returns UTF-8 text when the body decodes cleanly and base64
otherwise, and refuses anything over 5 MB — hand those out with
`download_url` instead. `put_object` takes either `content` (text) or
`content_base64`, never both.

S3 has no rename, so `move_object` copies then deletes; the source is only
removed after the copy succeeds. `delete_object` on an unversioned bucket is
permanent and S3 reports success even for a key that never existed, so check
with `get_object_metadata` first.

Errors come back with MCP `isError: true` and carry the AWS error code
(`NoSuchKey`, `AccessDenied`, `NoSuchBucket`, …) alongside the message.

Provider/server/assignment/environment seed entries follow the existing
AS/400 demo assignment scopes. Seed changes do not update an already running
database; add and assign server `s3` through MCP settings for existing
installations.

Tests: `bun test mcp/lib/s3-tool.test.ts`.
