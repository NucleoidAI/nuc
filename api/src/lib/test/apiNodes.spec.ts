import { describe, it } from "bun:test";
import assert from "node:assert/strict";
import {
  API_END_NODE_ID,
  API_START_NODE_ID,
  applyApiNodes,
  type FlowNode,
} from "../apiNodes";
import Node from "../../schemas/Node";
import { resolveCurrentNode } from "../blueprintNodes";

const flow = (): FlowNode[] => [
  {
    id: "check",
    type: "CONDITION",
    properties: { label: "Check", icon: "x" },
    true: ["a"],
    false: ["b"],
  },
  {
    id: "a",
    type: "NORMAL",
    properties: { label: "A", icon: "x" },
    next: null,
  },
  { id: "b", type: "NORMAL", properties: { label: "B", icon: "x" }, next: [] },
];

describe("applyApiNodes", () => {
  it("adds START before the roots and wires leaves to END", () => {
    const nodes = applyApiNodes(flow(), true);

    assert.equal(nodes[0].id, API_START_NODE_ID);
    assert.deepEqual(nodes[0].next, ["check"]);
    assert.equal(nodes[nodes.length - 1].id, API_END_NODE_ID);
    assert.deepEqual(nodes.find((n) => n.id === "a")?.next, [API_END_NODE_ID]);
    assert.deepEqual(nodes.find((n) => n.id === "b")?.next, [API_END_NODE_ID]);
    assert.ok(nodes.every((node) => Node.safeParse(node).success));
  });

  it("connects START straight to END on an empty flow", () => {
    const nodes = applyApiNodes([], true);

    assert.deepEqual(
      nodes.map((n) => [n.id, n.next]),
      [
        [API_START_NODE_ID, [API_END_NODE_ID]],
        [API_END_NODE_ID, null],
      ]
    );
  });

  it("is idempotent and keeps existing START/END settings", () => {
    const once = applyApiNodes(flow(), true);
    once[0].properties = { ...once[0].properties, strict: true };

    const twice = applyApiNodes(once, true);

    assert.deepEqual(twice, once);
  });

  it("removes START/END and their references when disabled", () => {
    const nodes = applyApiNodes(applyApiNodes(flow(), true), false);

    assert.deepEqual(
      nodes.map((n) => n.id),
      ["check", "a", "b"]
    );
    assert.equal(nodes.find((n) => n.id === "a")?.next, null);
    assert.deepEqual(nodes.find((n) => n.id === "check")?.true, ["a"]);
  });
});

describe("resolveCurrentNode with START", () => {
  const nodes = applyApiNodes(flow(), true);

  it("treats the request step as completing START", () => {
    const current = resolveCurrentNode(nodes, [
      { action: "PLATFORM:api_request", nodeId: API_START_NODE_ID },
    ]);

    assert.equal(current?.id, "check");
  });

  it("skips START when no request was recorded", () => {
    assert.equal(resolveCurrentNode(nodes, [])?.id, "check");
  });

  it("reaches END after the last node", () => {
    const current = resolveCurrentNode(nodes, [
      { action: "PLATFORM:api_request", nodeId: API_START_NODE_ID },
      { action: "PLATFORM:decision", nodeId: "check", result: "true" },
      { action: "X", nodeId: "a" },
    ]);

    assert.equal(current?.id, API_END_NODE_ID);
  });
});
