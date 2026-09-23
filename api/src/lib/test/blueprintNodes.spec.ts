import { describe, it } from "bun:test";
import assert from "node:assert/strict";
import { resolveCurrentNode, switchCases } from "../blueprintNodes";

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

const switchNodes = [
  {
    id: "route",
    type: "SWITCH",
    properties: {
      action: "PLATFORM:switch",
      label: "Route by intent",
      cases: [
        { nodeId: "refund", label: "Refund request" },
        { nodeId: "shipping", label: "Shipping question" },
      ],
    },
    next: ["refund", "shipping", "other"],
  },
  {
    id: "refund",
    type: "NORMAL",
    properties: { action: "ORDER:refund", label: "Refund" },
  },
  {
    id: "shipping",
    type: "NORMAL",
    properties: { action: "ORDER:track", label: "Track shipment" },
  },
  {
    id: "other",
    type: "NORMAL",
    properties: { action: "PLATFORM:complete", label: "Fallback" },
    next: null,
  },
];

const switched = (result: string) =>
  resolveCurrentNode(switchNodes, [
    { action: "PLATFORM:switch", nodeId: "route", result },
  ])?.id;

describe("switch node walking", () => {
  it("starts at the switch when nothing points to it", () => {
    assert.equal(resolveCurrentNode(switchNodes, [])?.id, "route");
  });

  it("follows the branch the step result selected", () => {
    assert.equal(switched(JSON.stringify({ nodeId: "shipping" })), "shipping");
    assert.equal(switched(JSON.stringify({ nodeId: "refund" })), "refund");
  });

  it("accepts a bare node id as the result", () => {
    assert.equal(switched("other"), "other");
  });

  it("falls back to the first branch on an unknown or unparsable result", () => {
    assert.equal(switched(JSON.stringify({ nodeId: "missing" })), "refund");
    assert.equal(switched("not json"), "refund");
  });
});

describe("switch cases", () => {
  it("lists one case per next id, labelled from the node or its target", () => {
    assert.deepEqual(switchCases(switchNodes[0], switchNodes), [
      { nodeId: "refund", label: "Refund request" },
      { nodeId: "shipping", label: "Shipping question" },
      { nodeId: "other", label: "Fallback" },
    ]);
  });

  it("falls back to the node id when no label is available", () => {
    assert.deepEqual(switchCases({ type: "SWITCH", next: ["a"] }), [
      { nodeId: "a", label: "a" },
    ]);
  });
});
