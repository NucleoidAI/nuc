import { describe, it } from "bun:test";
import assert from "node:assert/strict";
import { selectCase } from "../switch";

const options = [
  { nodeId: "refund", label: "Refund" },
  { nodeId: "support", label: "Support" },
];

describe("selectCase", () => {
  it("matches a declared node id", () => {
    assert.equal(selectCase(options, "support").nodeId, "support");
  });

  it("matches a label ignoring case and whitespace", () => {
    assert.equal(selectCase(options, "  support ").nodeId, "support");
    assert.equal(selectCase(options, "REFUND").nodeId, "refund");
  });

  it("uses the declared default case for an unknown answer", () => {
    assert.equal(selectCase(options, "escalate", "support").nodeId, "support");
  });

  it("throws for an unknown answer without a default case", () => {
    assert.throws(() => selectCase(options, "escalate"), /SWITCH_INVALID_CASE/);
    assert.throws(() => selectCase(options, undefined), /SWITCH_INVALID_CASE/);
  });

  it("ignores a default case that is not one of the options", () => {
    assert.throws(
      () => selectCase(options, "escalate", "missing"),
      /SWITCH_INVALID_CASE/,
    );
  });
});
