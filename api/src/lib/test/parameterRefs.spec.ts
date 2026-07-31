import { describe, it } from "bun:test";
import assert from "assert";

import { resolveParameterRefs, getByPath } from "../parameterRefs";

describe("getByPath", () => {
  it("resolves dot paths", () => {
    assert.strictEqual(getByPath({ a: { b: 1 } }, "a.b"), 1);
  });

  it("resolves bracket array indices", () => {
    assert.strictEqual(
      getByPath({ steps: [{ result: "btr-123" }] }, "steps[0].result"),
      "btr-123"
    );
  });

  it("returns undefined for a missing path", () => {
    assert.strictEqual(getByPath({ a: 1 }, "a.b.c"), undefined);
  });

  it("returns undefined when traversing through null/undefined", () => {
    assert.strictEqual(getByPath(null, "a.b"), undefined);
  });

  it("parses a JSON-stringified step result to reach a nested field", () => {
    const source = {
      steps: [
        { result: JSON.stringify({ transcript: "hello", speakers: [1, 2] }) },
      ],
    };
    assert.strictEqual(
      getByPath(source, "steps[0].result.transcript"),
      "hello"
    );
    assert.deepEqual(getByPath(source, "steps[0].result.speakers"), [1, 2]);
  });

  it("returns the raw string when the path stops at the result itself", () => {
    const source = { steps: [{ result: JSON.stringify({ a: 1 }) }] };
    assert.strictEqual(
      getByPath(source, "steps[0].result"),
      JSON.stringify({ a: 1 })
    );
  });
});

describe("resolveParameterRefs", () => {
  const source = {
    steps: [
      {
        action: "GREY:check_product_count",
        parameters: { productId: "btr-123" },
        result: "5",
      },
    ],
  };

  it("passes literal values through unchanged", () => {
    assert.deepEqual(resolveParameterRefs({ quantity: 10 }, source), {
      quantity: 10,
    });
  });

  it("resolves a top-level $ref", () => {
    assert.deepEqual(
      resolveParameterRefs({ productId: { $ref: "steps[0].result" } }, source),
      { productId: "5" }
    );
  });

  it("resolves a nested $ref inside prior step parameters", () => {
    assert.deepEqual(
      resolveParameterRefs(
        { productId: { $ref: "steps[0].parameters.productId" } },
        source
      ),
      { productId: "btr-123" }
    );
  });

  it("resolves $refs nested inside arrays and objects", () => {
    assert.deepEqual(
      resolveParameterRefs(
        {
          items: [{ productId: { $ref: "steps[0].parameters.productId" } }],
        },
        source
      ),
      { items: [{ productId: "btr-123" }] }
    );
  });

  it("throws a descriptive error when the ref can't be resolved", () => {
    assert.throws(
      () =>
        resolveParameterRefs(
          { productId: { $ref: "steps[9].result" } },
          source
        ),
      /Unable to resolve parameter reference "\$ref: steps\[9\]\.result"/
    );
  });

  it("treats a multi-key object containing $ref as a literal, not a ref", () => {
    const value = { $ref: "steps[0].result", extra: true };
    assert.deepEqual(resolveParameterRefs(value, source), value);
  });

  it("resolves a $ref that the model emitted as a JSON-encoded string value", () => {
    assert.deepEqual(
      resolveParameterRefs(
        { productId: '{ "$ref": "steps[0].result" }' },
        source
      ),
      { productId: "5" }
    );
  });

  it("reproduces the observed Bedrock bug: string $ref into a JSON step result", () => {
    const transcriptSource = {
      steps: [
        {
          result: JSON.stringify({
            full_meeting_transcript: "full text",
            speaker_transcripts: [{ id: "1", transcript: "hi" }],
          }),
        },
      ],
    };

    assert.deepEqual(
      resolveParameterRefs(
        {
          full_meeting_transcript:
            '{ "$ref": "steps[0].result.full_meeting_transcript" }',
          speaker_transcripts:
            '{ "$ref": "steps[0].result.speaker_transcripts" }',
          language: "tr",
        },
        transcriptSource
      ),
      {
        full_meeting_transcript: "full text",
        speaker_transcripts: [{ id: "1", transcript: "hi" }],
        language: "tr",
      }
    );
  });

  it("leaves an ordinary string that happens to start with '{' untouched", () => {
    assert.strictEqual(
      resolveParameterRefs("{not json but starts with brace", source),
      "{not json but starts with brace"
    );
  });

  it("resolves a whole-result $ref to a structured object, not a JSON-text blob", () => {
    const resultSource = {
      steps: [
        {
          result: JSON.stringify({ summary: "ok", ids: ["16780288"] }),
        },
      ],
    };

    assert.deepEqual(
      resolveParameterRefs(
        { content: { $ref: "steps[0].result" } },
        resultSource
      ),
      { content: { summary: "ok", ids: ["16780288"] } }
    );
  });

  it("keeps a whole-result $ref as a raw string when the result is a plain scalar", () => {
    assert.deepEqual(
      resolveParameterRefs({ productId: { $ref: "steps[0].result" } }, source),
      { productId: "5" }
    );
  });
});
