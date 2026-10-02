import { describe, it } from "bun:test";
import assert from "node:assert/strict";
import {
  getBoundNodeStep,
  getParameterGenerationContext,
  mergeNodeParameters,
} from "../nodeParameterBindings";
import { resolveParameterRefs } from "../parameterRefs";

const node = {
  type: "NORMAL",
  properties: {
    action: "TEST:run",
    force: true,
    parameters: { xxId: 4, enabled: false },
  },
};
const inputSchema = {
  properties: { xxId: { type: "integer" }, enabled: { type: "boolean" } },
  required: ["xxId"],
};

describe("blueprint parameter generation", () => {
  it("provides a deterministic step for fully bound force nodes without inventing a score", () => {
    assert.deepEqual(getBoundNodeStep({ node, inputSchema }), {
      next_step: {
        action: "TEST:run",
        parameters: {},
        comment: "Executing blueprint node with configured input values.",
      },
      result_score: undefined,
    });
  });

  it("keeps action selection for non-force nodes", () => {
    assert.equal(
      getBoundNodeStep({
        node: { ...node, properties: { ...node.properties, force: false } },
        inputSchema,
      }),
      undefined
    );
  });

  it("still generates unbound optional inputs", () => {
    assert.equal(
      getBoundNodeStep({
        node,
        inputSchema: {
          ...inputSchema,
          properties: { ...inputSchema.properties, limit: { type: "number" } },
        },
      }),
      undefined
    );
  });

  it("does not bypass generation when the input schema is unknown", () => {
    assert.equal(getBoundNodeStep({ node }), undefined);
  });

  it("does not bypass generation for open-ended input schemas", () => {
    assert.equal(
      getBoundNodeStep({
        node,
        inputSchema: { ...inputSchema, additionalProperties: true },
      }),
      undefined
    );
  });

  it("removes supplied fields from both action and MCP generation schemas without mutating context", () => {
    const context = [
      {
        role: "system" as const,
        content: {
          actions: [
            { action: "TEST:run", inputSchema },
            { action: "TEST:other", inputSchema },
          ],
          mcp_tools: [{ action: "TEST:run", inputSchema }],
        },
      },
    ];
    const original = JSON.stringify(context);
    const result = getParameterGenerationContext({ context, node });
    assert.deepEqual(result[0].content, {
      actions: [
        { action: "TEST:run", inputSchema: { properties: {}, required: [] } },
        { action: "TEST:other", inputSchema },
      ],
      mcp_tools: [
        { action: "TEST:run", inputSchema: { properties: {}, required: [] } },
      ],
    });
    assert.equal(result.length, context.length);
    assert.equal(JSON.stringify(context), original);
  });

  it("overrides generated values while retaining unbound fields", () => {
    assert.deepEqual(
      mergeNodeParameters({
        node,
        action: "TEST:run",
        generated: { xxId: 99, enabled: true, limit: 10 },
      }),
      { xxId: 4, enabled: false, limit: 10 }
    );
  });

  it("does not attach node bindings to a different action such as a clarification", () => {
    assert.deepEqual(
      mergeNodeParameters({
        node,
        action: "PLATFORM:user_interaction",
        generated: { question: "Which limit?" },
      }),
      { question: "Which limit?" }
    );
  });

  it("resolves references and preserves zero after skipping generation", () => {
    const referenceNode = {
      ...node,
      properties: {
        ...node.properties,
        parameters: {
          xxId: { $ref: "byNode.previous.result.id" },
          enabled: false,
        },
      },
    };
    const step = getBoundNodeStep({ node: referenceNode, inputSchema });
    assert.ok(step);
    const parameters = mergeNodeParameters({
      node: referenceNode,
      action: step.next_step.action,
      generated: step.next_step.parameters,
    });
    assert.deepEqual(
      resolveParameterRefs(parameters, {
        byNode: { previous: { result: { id: 0 } } },
      }),
      { xxId: 0, enabled: false }
    );
    assert.throws(
      () => resolveParameterRefs(parameters, {}),
      /Unable to resolve/
    );
  });
});
