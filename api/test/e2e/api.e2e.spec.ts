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
      mode: "API",
      nodes: [
        {
          id: "only",
          type: "NORMAL",
          next: null,
          properties: { label: "Only", icon: "x", action: "PLATFORM:complete" },
        },
      ],
    });

    expect(blueprint.mode).toBe("API");
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
      .send({ mode: "CHAT" })
      .expect(200);

    expect(disabled.mode).toBe("CHAT");
    expect(disabled.nodes).toEqual([
      expect.objectContaining({ id: "only", next: null }),
    ]);
  });

  it("runs the flow and responds with values bound from the request", async () => {
    const blueprint = await createBlueprint({
      mode: "API",
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
      mode: "API",
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
      mode: "API",
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
      mode: "API",
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
      mode: "API",
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

  it("runs platform actions without a session and without exposing sessionId as an input", async () => {
    const actions = await supertest(app).get("/mcps/actions").expect(200);
    const exposesSessionId = JSON.stringify(actions.body).includes(
      '"sessionId"'
    );

    expect(exposesSessionId).toBe(false);

    const blueprint = await createBlueprint({
      mode: "API",
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

    expect(response.headers["x-session-id"]).toBeUndefined();

    const taskId = response.headers["x-task-id"];
    const { default: Task } = await import("../../src/models/Task");
    const { default: Step } = await import("../../src/models/Step");

    const task = await Task.findByPk(taskId);
    const notify = await Step.findOne({
      where: { taskId, action: "PLATFORM:message_user" },
    });

    expect(task?.sessionId).toBeNull();
    expect(notify?.status).toBe("COMPLETED");
    expect(notify?.result?.toString()).toContain("Ada");
  }, 60_000);

  it("returns 404 for blueprints without the API feature", async () => {
    const blueprint = await createBlueprint({ nodes: [] });

    await supertest(app).post(`/execute/${blueprint.id}`).send({}).expect(404);
  });
});

describe("Sessionless tasks", () => {
  it("starts a blueprint task without a session and feeds its variables to the nodes", async () => {
    const blueprint = await createBlueprint({
      executionMode: "LITE",
      nodes: [
        {
          id: "notify",
          type: "NORMAL",
          next: null,
          properties: {
            label: "Notify",
            icon: "mdi:message-text",
            action: "PLATFORM:message_user",
            force: true,
            parameters: { message: { $ref: "session_variables.customer" } },
          },
        },
      ],
    });

    const { body: task } = await supertest(app)
      .post("/tasks")
      .send({
        agentId: ORDER_AGENT_ID,
        blueprintId: blueprint.id,
        variables: { customer: "Ada" },
      })
      .expect(200);

    const { default: taskFn } = await import("../../src/functions/task");
    await taskFn.waitFor({ taskId: task.id, timeoutMs: 10_000 });

    const stored = await taskFn.get({ taskId: task.id });

    expect(stored.sessionId).toBeNull();
    expect(stored.variables).toEqual({ customer: "Ada" });
    expect(stored.description).toBe("API blueprint #1");

    const { default: Step } = await import("../../src/models/Step");
    const notify = await Step.findOne({
      where: { taskId: task.id, action: "PLATFORM:message_user" },
    });

    expect(notify?.status).toBe("COMPLETED");
    expect(notify?.result?.toString()).toContain("Ada");
  }, 30_000);
});

describe("JSON mode", () => {
  const JSON_START = "json-start";

  const messageNode = (
    id: string,
    message: unknown,
    next: string[] | null
  ) => ({
    id,
    type: "NORMAL",
    next,
    properties: {
      label: id,
      icon: "mdi:message-text",
      action: "PLATFORM:message_user",
      force: true,
      parameters: { message },
    },
  });

  async function createJsonBlueprint() {
    const blueprint = await createBlueprint({
      mode: "JSON",
      executionMode: "LITE",
      nodes: [
        messageNode("byVariable", { $ref: "session_variables.customer" }, [
          "byNode",
        ]),
        messageNode(
          "byNode",
          { $ref: `byNode.${JSON_START}.result.customer` },
          null
        ),
      ],
    });

    const start = blueprint.nodes.find(
      (node: { type: string }) => node.type === "START"
    );

    return supertest(app)
      .put(`/blueprints/${blueprint.id}`)
      .send({
        title: blueprint.title,
        description: blueprint.description,
        agentId: ORDER_AGENT_ID,
        nodes: [
          {
            ...start,
            properties: {
              ...start.properties,
              fields: [
                { name: "customer", type: "string", minLength: 2 },
                { name: "note", type: "string", required: false },
              ],
            },
          },
          ...blueprint.nodes.filter(
            (node: { type: string }) => node.type !== "START"
          ),
        ],
      })
      .expect(200)
      .then(({ body }) => body);
  }

  it("adds a start node without an end node", async () => {
    const blueprint = await createJsonBlueprint();

    expect(blueprint.mode).toBe("JSON");
    expect(
      blueprint.nodes.map((node: { id: string; type: string }) => [
        node.id,
        node.type,
      ])
    ).toEqual([
      [JSON_START, "START"],
      ["byVariable", "NORMAL"],
      ["byNode", "NORMAL"],
    ]);
  });

  it("rejects variables that do not match the start schema", async () => {
    const blueprint = await createJsonBlueprint();

    const { body } = await supertest(app)
      .post("/tasks")
      .send({
        agentId: ORDER_AGENT_ID,
        blueprintId: blueprint.id,
        variables: { customer: "A" },
      })
      .expect(400);

    expect(body.error).toBe("INVALID_REQUEST");
    expect(body.issues[0].path).toBe("customer");
  });

  it("records the input and exposes it as session variables and start node results", async () => {
    const blueprint = await createJsonBlueprint();

    const { body: task } = await supertest(app)
      .post("/tasks")
      .send({
        agentId: ORDER_AGENT_ID,
        blueprintId: blueprint.id,
        variables: { customer: "Ada", extra: true },
      })
      .expect(200);

    const { default: taskFn } = await import("../../src/functions/task");
    await taskFn.waitFor({ taskId: task.id, timeoutMs: 10_000 });

    const stored = await taskFn.get({ taskId: task.id });
    expect(stored.status).toBe("COMPLETED");
    expect(stored.variables).toEqual({ customer: "Ada", extra: true });

    const { default: Step } = await import("../../src/models/Step");
    const steps = await Step.findAll({
      where: { taskId: task.id },
      order: [["createdAt", "ASC"]],
    });

    expect(steps[0].nodeId).toBe(JSON_START);
    expect(steps[0].comment).toBe("Received JSON input.");

    const messages = steps.filter(
      (step) => step.action === "PLATFORM:message_user"
    );
    expect(messages.map((step) => step.nodeId)).toEqual([
      "byVariable",
      "byNode",
    ]);
    messages.forEach((step) =>
      expect(step.result?.toString()).toContain("Ada")
    );
  }, 30_000);
});
