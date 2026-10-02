import { ORDER_AGENT_ID } from "./fixtures/ids";
import { mcp } from "./mocks/mcp";
import { randomUUID } from "node:crypto";
import supertest from "supertest";

const START = "api-start";
const END = "api-end";

const startNode = (properties: Record<string, unknown>, next = [END]) => ({
  id: START,
  type: "START",
  next,
  properties: { label: "Request", icon: "mdi:api", ...properties },
});

const endNode = (properties: Record<string, unknown>) => ({
  id: END,
  type: "END",
  next: null,
  properties: { label: "Response", icon: "mdi:export", ...properties },
});

const ref = (field: string) => ({ $ref: `byNode.${START}.result.${field}` });

const requestFields = [
  { name: "name", type: "string", minLength: 2, maxLength: 20 },
  { name: "plan", type: "enum", values: ["FREE", "PRO"] },
  { name: "seats", type: "number", integer: true, min: 1, required: false },
];

const greetingEnd = endNode({
  fields: [
    { name: "customer", type: "string" },
    { name: "plan", type: "enum", values: ["FREE", "PRO"] },
  ],
  parameters: { customer: ref("name"), plan: ref("plan") },
});

async function createBlueprint(body: Record<string, unknown>) {
  const id = randomUUID();

  const { body: blueprint } = await supertest(app)
    .put(`/blueprints/${id}`)
    .send({
      title: "API blueprint",
      description: "Blueprint exposed as an API",
      agentId: ORDER_AGENT_ID,
      ...body,
    })
    .expect(200);

  return blueprint;
}

describe("Blueprint API", () => {
  it("adds wired START/END nodes when enabled and removes them when disabled", async () => {
    const blueprint = await createBlueprint({
      api: true,
      nodes: [
        {
          id: "only",
          type: "NORMAL",
          next: null,
          properties: { label: "Only", icon: "x", action: "PLATFORM:complete" },
        },
      ],
    });

    expect(blueprint.api).toBe(true);
    expect(
      blueprint.nodes.map((node: { id: string; next: string[] | null }) => [
        node.id,
        node.next,
      ])
    ).toEqual([
      [START, ["only"]],
      ["only", [END]],
      [END, null],
    ]);

    const { body: disabled } = await supertest(app)
      .patch(`/blueprints/${blueprint.id}`)
      .send({ api: false })
      .expect(200);

    expect(disabled.api).toBe(false);
    expect(disabled.nodes).toEqual([
      expect.objectContaining({ id: "only", next: null }),
    ]);
  });

  it("runs the flow and responds with values bound from the request", async () => {
    const blueprint = await createBlueprint({
      api: true,
      nodes: [startNode({ fields: requestFields, strict: true }), greetingEnd],
    });

    const response = await supertest(app)
      .post(`/execute/${blueprint.id}`)
      .send({ name: "Ada", plan: "PRO", seats: 3 })
      .expect(200);

    expect(response.body).toEqual({ customer: "Ada", plan: "PRO" });
    expect(response.headers["x-task-id"]).toEqual(expect.any(String));

    await supertest(app)
      .post(`/execute/${blueprint.id}`)
      .send({ name: "Ada", plan: "PRO" })
      .expect(200);

    const { default: Task } = await import("../../src/models/Task");
    const tasks = await Task.findAll({
      where: { blueprintId: blueprint.id },
      order: [["createdAt", "ASC"]],
    });

    expect(tasks.map((task) => task.description)).toEqual([
      "API blueprint #1",
      "API blueprint #2",
    ]);
  }, 60_000);

  it("rejects missing, invalid and unknown fields in strict mode", async () => {
    const blueprint = await createBlueprint({
      api: true,
      nodes: [startNode({ fields: requestFields, strict: true }), greetingEnd],
    });

    const response = await supertest(app)
      .post(`/execute/${blueprint.id}`)
      .send({ name: "A", seats: 1.5, extra: true })
      .expect(400);

    expect(response.body.error).toBe("INVALID_REQUEST");
    expect(
      response.body.issues
        .map((issue: { path: string; code: string }) => issue.code)
        .sort()
    ).toEqual([
      "invalid_type",
      "invalid_type",
      "too_small",
      "unrecognized_keys",
    ]);
  });

  it("drops unknown fields when not strict", async () => {
    const blueprint = await createBlueprint({
      api: true,
      nodes: [
        startNode({ fields: requestFields, strict: false }),
        endNode({
          fields: [{ name: "echo", type: "object", fields: requestFields }],
          parameters: { echo: { $ref: `byNode.${START}.result` } },
        }),
      ],
    });

    const response = await supertest(app)
      .post(`/execute/${blueprint.id}`)
      .send({ name: "Ada", plan: "FREE", extra: true })
      .expect(200);

    expect(response.body).toEqual({ echo: { name: "Ada", plan: "FREE" } });
  }, 60_000);

  it("fails the task when the response does not match its schema", async () => {
    const blueprint = await createBlueprint({
      api: true,
      nodes: [
        startNode({ fields: requestFields }),
        endNode({
          fields: [{ name: "count", type: "number" }],
          parameters: { count: ref("name") },
        }),
      ],
    });

    const response = await supertest(app)
      .post(`/execute/${blueprint.id}`)
      .send({ name: "Ada", plan: "FREE" })
      .expect(422);

    expect(response.body).toMatchObject({
      error: "TASK_FAILED",
      message: expect.stringContaining("count"),
    });
  }, 60_000);

  it("returns 504 when the task outlives the configured timeout", async () => {
    const blueprint = await createBlueprint({
      api: true,
      nodes: [
        startNode({ fields: requestFields, timeout: 1 }, ["approve"]),
        {
          id: "approve",
          type: "APPROVAL",
          true: [END],
          false: [END],
          properties: {
            label: "Approve",
            icon: "mdi:account-check",
            question: "Approve?",
            force: true,
          },
        },
        greetingEnd,
      ],
    });

    const response = await supertest(app)
      .post(`/execute/${blueprint.id}`)
      .send({ name: "Ada", plan: "FREE" })
      .expect(504);

    expect(response.body).toEqual({
      error: "TIMEOUT",
      taskId: expect.any(String),
    });
  }, 60_000);

  it("fills session and agent for platform actions without exposing them as inputs", async () => {
    const actions = await supertest(app).get("/mcps/actions").expect(200);
    const exposesSessionId = JSON.stringify(actions.body).includes(
      '"sessionId"'
    );

    expect(exposesSessionId).toBe(false);

    const blueprint = await createBlueprint({
      api: true,
      nodes: [
        startNode({ fields: requestFields }, ["notify"]),
        {
          id: "notify",
          type: "NORMAL",
          next: [END],
          properties: {
            label: "Notify",
            icon: "mdi:message-text",
            action: "PLATFORM:message_user",
            force: true,
            parameters: { message: ref("name") },
          },
        },
        greetingEnd,
      ],
    });

    const response = await supertest(app)
      .post(`/execute/${blueprint.id}`)
      .send({ name: "Ada", plan: "FREE" })
      .expect(200);

    const sessionId = response.headers["x-session-id"];
    const conversations = await supertest(app)
      .get(`/sessions/${sessionId}`)
      .expect(200);

    expect(
      conversations.body.map(
        (conversation: { content: string }) => conversation.content
      )
    ).toContain("Ada");
  }, 60_000);

  it("returns 404 for blueprints without the API feature", async () => {
    const blueprint = await createBlueprint({ nodes: [] });

    await supertest(app).post(`/execute/${blueprint.id}`).send({}).expect(404);
  });
});

describe("Blueprint API in LITE mode", () => {
  const llmCalls = async (taskId: string) => {
    const { default: LLMLog } = await import("../../src/models/LLMLog");
    return LLMLog.count({ where: { taskId } });
  };

  const stepsOf = async (taskId: string) => {
    const { default: Step } = await import("../../src/models/Step");
    const steps = await Step.findAll({
      where: { taskId },
      order: [["createdAt", "ASC"]],
    });
    return steps.map((step) => [step.action, step.status]);
  };

  const findNode = (next: string[]) => ({
    id: "find",
    type: "NORMAL",
    next,
    properties: {
      label: "Find",
      icon: "mdi:magnify",
      action: "ORDER:find_product",
      parameters: { product_id: ref("name"), name: ref("name") },
    },
  });

  it("runs every node in graph order without calling the LLM", async () => {
    mcp
      .tool("ORDER:find_product")
      .returns({ product_id: "prd-1", name: "product-1" });

    const blueprint = await createBlueprint({
      api: true,
      executionMode: "LITE",
      nodes: [
        startNode({ fields: requestFields }, ["find"]),
        findNode([END]),
        endNode({
          fields: [{ name: "product", type: "string" }],
          parameters: { product: { $ref: "byNode.find.result.product_id" } },
        }),
      ],
    });

    const response = await supertest(app)
      .post(`/execute/${blueprint.id}`)
      .send({ name: "product-1", plan: "FREE" })
      .expect(200);

    const taskId = response.headers["x-task-id"];

    expect(response.body).toEqual({ product: "prd-1" });
    expect(mcp.tool("ORDER:find_product").lastCall).toEqual({
      product_id: "product-1",
      name: "product-1",
    });
    expect(await llmCalls(taskId)).toBe(0);
  }, 60_000);

  describe("Text Translation blueprint", () => {
    const TRANSLATION_BLUEPRINT_ID = "d7aaf3a2-40b9-480f-9f70-5c4b13f3f934";

    it("returns the translation without calling the LLM", async () => {
      mcp
        .tool("TELCO:translate")
        .returns({ translation: "Hello", target_lang: "en" });

      const response = await supertest(app)
        .post(`/execute/${TRANSLATION_BLUEPRINT_ID}`)
        .send({ content: "Merhaba", target_lang: "en", source_lang: "tr" })
        .expect(200);

      expect(response.body).toEqual({ translation: "Hello" });
      expect(mcp.tool("TELCO:translate").lastCall).toEqual({
        content: "Merhaba",
        target_lang: "en",
        source_lang: "tr",
      });
      expect(await llmCalls(response.headers["x-task-id"])).toBe(0);
    }, 60_000);

    it("leaves source_lang out when the request omits it", async () => {
      mcp
        .tool("TELCO:translate")
        .returns({ translation: "Hello", target_lang: "en" });

      const response = await supertest(app)
        .post(`/execute/${TRANSLATION_BLUEPRINT_ID}`)
        .send({ content: "Merhaba", target_lang: "en" })
        .expect(200);

      expect(response.body).toEqual({ translation: "Hello" });
      expect(mcp.tool("TELCO:translate").lastCall).toEqual({
        content: "Merhaba",
        target_lang: "en",
      });
      expect(await llmCalls(response.headers["x-task-id"])).toBe(0);
    }, 60_000);
  });

  it("skips a failed node and continues when blocking is off", async () => {
    mcp.tool("ORDER:find_product").fails({ error: "catalog unavailable" });

    const blueprint = await createBlueprint({
      api: true,
      executionMode: "LITE",
      blocking: false,
      nodes: [
        startNode({ fields: requestFields }, ["find"]),
        findNode(["notify"]),
        {
          id: "notify",
          type: "NORMAL",
          next: [END],
          properties: {
            label: "Notify",
            icon: "mdi:message-text",
            action: "PLATFORM:message_user",
            parameters: { message: ref("name") },
          },
        },
        greetingEnd,
      ],
    });

    const response = await supertest(app)
      .post(`/execute/${blueprint.id}`)
      .send({ name: "Ada", plan: "PRO" })
      .expect(200);

    const taskId = response.headers["x-task-id"];

    expect(response.body).toEqual({ customer: "Ada", plan: "PRO" });
    expect(await stepsOf(taskId)).toEqual([
      ["PLATFORM:api_request", "COMPLETED"],
      ["ORDER:find_product", "FAILED"],
      ["PLATFORM:message_user", "COMPLETED"],
    ]);
    expect(await llmCalls(taskId)).toBe(0);
  }, 60_000);

  it("retries a failed node without asking the supervisor when blocking is on", async () => {
    mcp.tool("ORDER:find_product").fails({ error: "catalog unavailable" });

    const blueprint = await createBlueprint({
      api: true,
      executionMode: "LITE",
      blocking: true,
      nodes: [
        startNode({ fields: requestFields, timeout: 20 }, ["find"]),
        findNode([END]),
        greetingEnd,
      ],
    });

    const response = await supertest(app)
      .post(`/execute/${blueprint.id}`)
      .send({ name: "Ada", plan: "PRO" })
      .expect(422);

    const steps = await stepsOf(response.body.taskId);

    expect(response.body.message).toBe("Failed due to too many steps");
    expect(steps).not.toContainEqual(
      expect.arrayContaining(["PLATFORM:ask_supervisor"])
    );
    expect(steps.slice(1)).toEqual(
      Array(steps.length - 1).fill(["ORDER:find_product", "FAILED"])
    );
    expect(await llmCalls(response.body.taskId)).toBe(0);
  }, 60_000);
});
