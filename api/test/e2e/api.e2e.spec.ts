import { ORDER_AGENT_ID } from "./fixtures/ids";
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
