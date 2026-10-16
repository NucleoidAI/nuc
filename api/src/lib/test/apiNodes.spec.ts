import { describe, it } from "bun:test";
import assert from "assert";

import { omitMissingRequestRefs } from "../apiNodes";

const start = {
  id: "api-start",
  type: "START",
  properties: {
    fields: [
      { name: "directoryPath", type: "string" },
      { name: "topic", type: "string", required: false },
    ],
  },
} as any;

const ref = (field: string) => ({ $ref: `byNode.api-start.result.${field}` });

describe("omitMissingRequestRefs", () => {
  it("drops nested refs to optional request fields that were not sent", () => {
    const parameters = omitMissingRequestRefs({
      parameters: {
        template: "meeting_summary_a",
        data: { meetingName: ref("topic"), summary: "text" },
      },
      start,
      steps: [{ nodeId: "api-start", result: { directoryPath: "/x" } }],
    });

    assert.deepStrictEqual(parameters, {
      template: "meeting_summary_a",
      data: { summary: "text" },
    });
  });

  it("keeps nested refs to optional request fields that were sent", () => {
    const parameters = omitMissingRequestRefs({
      parameters: { data: { meetingName: ref("topic") } },
      start,
      steps: [
        { nodeId: "api-start", result: { directoryPath: "/x", topic: "Sync" } },
      ],
    });

    assert.deepStrictEqual(parameters, { data: { meetingName: ref("topic") } });
  });
});
