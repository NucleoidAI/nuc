import { describe, it } from "bun:test";
import assert from "node:assert/strict";
import { resolveCurrentNode } from "../blueprintNodes";

const nodes = [
  {
    id: "upload",
    type: "NORMAL",
    properties: { action: "S3:upload_file" },
    next: ["read"],
  },
  {
    id: "read",
    type: "NORMAL",
    properties: { action: "S3:get_object" },
    next: ["branch"],
  },
  {
    id: "branch",
    type: "CONDITION",
    properties: { action: "PLATFORM:decision" },
    true: ["convert"],
    false: ["done"],
  },
  {
    id: "convert",
    type: "NORMAL",
    properties: { action: "CHEM:mol_to_sdf", force: true },
    next: ["done"],
  },
  { id: "done", type: "NORMAL", properties: { action: "PLATFORM:complete" } },
];

const walked = (steps: any[]) => resolveCurrentNode(nodes, steps)?.id;

describe("blueprint node walking", () => {
  it("starts at the node nothing points to", () => {
    assert.equal(walked([]), "upload");
  });

  it("follows next ids for completed normal steps", () => {
    assert.equal(
      walked([{ action: "S3:upload_file", nodeId: "upload", result: "{}" }]),
      "read",
    );
  });

  it("takes the true branch when the decision result carries a true verdict", () => {
    assert.equal(
      walked([
        { action: "S3:upload_file", nodeId: "upload", result: "{}" },
        { action: "S3:get_object", nodeId: "read", result: "{}" },
        {
          action: "PLATFORM:decision",
          nodeId: "branch",
          result: JSON.stringify({
            result: true,
            actions: [{ action: "CHEM:mol_to_sdf" }],
          }),
        },
      ]),
      "convert",
    );
  });

  it("takes the false branch on a false verdict, and on a result without one", () => {
    const upTo = (result: string) => [
      { action: "S3:upload_file", nodeId: "upload", result: "{}" },
      { action: "S3:get_object", nodeId: "read", result: "{}" },
      { action: "PLATFORM:decision", nodeId: "branch", result },
    ];
    assert.equal(walked(upTo(JSON.stringify({ result: false }))), "done");
    assert.equal(walked(upTo("[]")), "done");
    assert.equal(walked(upTo("not json")), "done");
  });

  it("still understands the plain true and false results", () => {
    const upTo = (result: string) => [
      { action: "S3:upload_file", nodeId: "upload", result: "{}" },
      { action: "S3:get_object", nodeId: "read", result: "{}" },
      { action: "PLATFORM:decision", nodeId: "branch", result },
    ];
    assert.equal(walked(upTo("true")), "convert");
    assert.equal(walked(upTo("false")), "done");
  });

  it("matches a step without a node id by its action", () => {
    assert.equal(walked([{ action: "S3:upload_file", result: "{}" }]), "read");
  });
});
