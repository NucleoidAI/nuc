import { describe, it } from "bun:test";
import assert from "node:assert/strict";
import {
  getBoundNodeStep,
  getForcedActionContext,
  getLiteNodeStep,
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
          mcps: [{ action: "TEST:run", inputSchema }],
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
      mcps: [
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

  it("keeps only the forced action's definition without mutating context", () => {
    const context = [
      { role: "user" as const, content: "translate this" },
      {
        role: "system" as const,
        content: {
          actions: [
            { action: "TEST:run", inputSchema },
            { action: "TEST:other", inputSchema },
          ],
        },
      },
      {
        role: "system" as const,
        content: {
          mcps: [
            { action: "TEST:other", inputSchema },
            { action: "TEST:run", inputSchema },
          ],
        },
      },
      { role: "system" as const, content: { agent: { name: "Translator" } } },
    ];
    const original = JSON.stringify(context);
    const result = getForcedActionContext({ context, action: "TEST:run" });
    assert.deepEqual(result, [
      context[0],
      { role: "system", content: { actions: [{ action: "TEST:run", inputSchema }] } },
      { role: "system", content: { mcps: [{ action: "TEST:run", inputSchema }] } },
      context[3],
    ]);
    assert.equal(JSON.stringify(context), original);
  });

  it("leaves context untouched when there is no forced action", () => {
    const context = [
      { role: "system" as const, content: { actions: [{ action: "TEST:run" }] } },
    ];
    assert.equal(getForcedActionContext({ context }), context);
  });
});

describe("getLiteNodeStep", () => {
  const step = (action: string) => ({
    next_step: {
      action,
      parameters: {},
      comment: "Executing blueprint node without generated parameters.",
    },
    result_score: undefined,
  });

  it("skips parameter generation for branching nodes", () => {
    assert.deepEqual(
      getLiteNodeStep({
        node: { type: "CONDITION", properties: { action: "PLATFORM:decision" } },
      }),
      step("PLATFORM:decision")
    );
    assert.deepEqual(
      getLiteNodeStep({
        node: { type: "SWITCH", properties: { action: "PLATFORM:switch" } },
      }),
      step("PLATFORM:switch")
    );
  });

  it("skips parameter generation for actions without inputs", () => {
    assert.deepEqual(
      getLiteNodeStep({
        node: { type: "NORMAL", properties: { action: "X:none" } },
        inputSchema: { properties: {} },
      }),
      step("X:none")
    );
  });

  it("leaves nodes with inputs, unknown actions or no action to the LLM", () => {
    assert.equal(
      getLiteNodeStep({
        node: { type: "NORMAL", properties: { action: "X:run" } },
        inputSchema,
      }),
      undefined
    );
    assert.equal(
      getLiteNodeStep({
        node: { type: "NORMAL", properties: { action: "X:run" } },
      }),
      undefined
    );
    assert.equal(getLiteNodeStep({ node: { type: "CONDITION" } }), undefined);
  });
});
