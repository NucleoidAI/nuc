import { describe, it } from "bun:test";
import assert from "node:assert/strict";
import { findNodeAhead, resolveCurrentNode } from "../blueprintNodes";

const node = (
  id: string,
  action: string,
  next: string | null,
  extra: Record<string, unknown> = {},
) => ({
  id,
  type: "NORMAL",
  properties: { action, ...extra },
  next: next ? [next] : null,
});

const nodes = [
  node("find", "ORDER:find_product", "lookup"),
  node("lookup", "PLATFORM:knowledge_lookup", "assign"),
  node("assign", "ORDER:assign_certificate", "po"),
  node("po", "ORDER:create_po", "pay"),
  node("pay", "STRIPE:create_payment_intent", "approval"),
  {
    id: "approval",
    type: "APPROVAL",
    properties: { action: "PLATFORM:customer_approval" },
    true: ["confirm"],
    false: ["cancel"],
  },
  node("confirm", "STRIPE:confirm_payment_intent", null),
  node("cancel", "STRIPE:cancel_payment_intent", null),
];

const byAction = (action: string) => (n: any) =>
  n.properties?.action === action;

describe("resolveCurrentNode", () => {
  it("advances through steps bound to their nodes", () => {
    const current = resolveCurrentNode(nodes, [
      { action: "ORDER:find_product", nodeId: "find" },
      { action: "PLATFORM:knowledge_lookup", nodeId: "lookup" },
      { action: "ORDER:assign_certificate", nodeId: "assign" },
    ]);

    assert.equal(current?.id, "po");
  });

  it("does not let an unbound detour step consume the current node", () => {
    const current = resolveCurrentNode(nodes, [
      { action: "ORDER:find_product", nodeId: "find" },
      { action: "PLATFORM:knowledge_lookup", nodeId: "lookup" },
      { action: "PLATFORM:ask_supervisor", nodeId: null },
      { action: "PLATFORM:knowledge_lookup", nodeId: null },
      { action: "ORDER:assign_certificate", nodeId: "assign" },
      { action: "ORDER:create_po", nodeId: "po" },
    ]);

    assert.equal(current?.id, "pay");
  });

  it("moves past skipped non-force nodes when a later node runs", () => {
    const current = resolveCurrentNode(nodes, [
      { action: "ORDER:find_product", nodeId: "find" },
      { action: "ORDER:create_po", nodeId: "po" },
    ]);

    assert.equal(current?.id, "pay");
  });

  it("follows the approval branch", () => {
    const current = resolveCurrentNode(nodes, [
      { action: "STRIPE:create_payment_intent", nodeId: "pay" },
      {
        action: "PLATFORM:customer_approval",
        nodeId: "approval",
        result: "APPROVED",
      },
    ]);

    assert.equal(current?.id, "confirm");
  });

  it("still matches legacy steps without a nodeId by action", () => {
    const current = resolveCurrentNode(nodes, [
      { action: "ORDER:find_product" },
      { action: "PLATFORM:knowledge_lookup" },
    ]);

    assert.equal(current?.id, "assign");
  });
});

describe("findNodeAhead", () => {
  it("finds a later non-force node", () => {
    const found = findNodeAhead(
      nodes,
      nodes[0],
      byAction("STRIPE:create_payment_intent"),
    );

    assert.equal(found?.id, "pay");
  });

  it("does not look past an approval node", () => {
    const found = findNodeAhead(
      nodes,
      nodes[0],
      byAction("STRIPE:confirm_payment_intent"),
    );

    assert.equal(found, undefined);
  });

  it("does not skip a force node", () => {
    const forced = [
      node("a", "A:run", "b"),
      node("b", "B:run", "c", { force: true }),
      node("c", "C:run", null),
    ];

    assert.equal(
      findNodeAhead(forced, forced[0], byAction("C:run")),
      undefined,
    );
    assert.equal(
      findNodeAhead(forced, forced[1], byAction("C:run")),
      undefined,
    );
    assert.equal(findNodeAhead(forced, forced[1], byAction("B:run"))?.id, "b");
  });

  it("returns nothing for an action outside the blueprint", () => {
    const found = findNodeAhead(
      nodes,
      nodes[2],
      byAction("PLATFORM:ask_supervisor"),
    );

    assert.equal(found, undefined);
  });
});
