# API Architecture — Rule Catalog

## 1. Layer boundaries

### `layer/routes-are-http-only`

**Severity: `error`**

A route handler validates input, authorizes against the session tenant, calls a
function, and maps the result to a status code — persistence, derivation and
domain rules belong in `functions/`.

Rationale: logic in a route can only ever be reached over HTTP. It cannot be
called from an event subscription, from another function, or from a test that
does not spin up the app — and this API drives most of its work from event
subscriptions in `app.ts`, not from requests.

Incorrect:

```ts
router.get("/:agentId/sessions", async (req, res) => {
  const sessions = await Session.findAll({
    where: { agentId },
    include: [{ association: "conversations", separate: true, order: [["createdAt", "ASC"]] }],
  });

  const sorted = sessions
    .map((session) => session.toJSON())
    .filter((session) => session.conversations.length > 0)
    .sort((a, b) => {
      const aLast = a.conversations[a.conversations.length - 1]?.createdAt;
      const bLast = b.conversations[b.conversations.length - 1]?.createdAt;
      return new Date(bLast).getTime() - new Date(aLast).getTime();
    })
    .slice(0, 5);

  res.json(sorted);
});
```

Incorrect:

```ts
router.post("/:agentId/knowledge", async (req, res) => {
  const { type, question, answer, url } = req.body;

  if (type === "QA" && (!question || !answer)) {
    return res.status(400).json({ error: "INVALID_QA_KNOWLEDGE" });
  }

  const knowledge = await Knowledge.create({
    agentId: req.params.agentId,
    type,
    question,
    answer,
    url,
    status: url ? "PENDING" : "COMPLETED",
  });

  if (url) {
    await event.publish("KNOWLEDGE_URL_ADDED", { knowledgeId: knowledge.id });
  }

  res.status(201).json(knowledge);
});
```

Incorrect:

```ts
router.patch("/:taskId/steps/:stepId", async (req, res) => {
  const step = await Step.findByPk(req.params.stepId);

  await step.update({ status: req.body.status });

  const siblings = await Step.findAll({ where: { taskId: req.params.taskId } });
  const remaining = siblings.filter((s) => s.status !== "COMPLETED");

  if (remaining.length === 0) {
    await Task.update(
      { status: "COMPLETED" },
      { where: { id: req.params.taskId } }
    );
  }

  res.json(step);
});
```

Correct:

```ts
router.post("/blueprints", async (req, res) => {
  const { body } = req;

  const { history, content } = Blueprint.create.parse(body);

  const response = await agentFn.Blueprint({
    history,
    content,
    meta: { teamId: req.session.projectId },
  });

  res.json({ response: response.response, flow: response.flow });
});
```

Correct:

```ts
router.get("/:agentId/sessions", async (req, res) => {
  const { projectId: teamId } = req.session;

  const { agentId } = Joi.attempt(
    req.params,
    Joi.object({ agentId: Joi.string().guid().required() })
  );

  const agent = await Agent.findOne({ where: { id: agentId, teamId } });

  if (!agent) {
    return res.status(404).end();
  }

  const sessions = await sessionFn.listRecent({ agentId, limit: 5 });

  res.json(sessions);
});
```

Correct:

```ts
router.patch("/:taskId/steps/:stepId", async (req, res) => {
  const { projectId: teamId } = req.session;

  const { taskId, stepId } = Joi.attempt(
    req.params,
    Joi.object({
      taskId: Joi.string().guid().required(),
      stepId: Joi.string().guid().required(),
    })
  );

  const { status } = Joi.attempt(req.body, schemas.Step.patch);

  const step = await taskFn.updateStep({ teamId, taskId, stepId, status });

  res.json(step);
});
```

Validate, delegate, respond. The session tenant is passed down as `meta` or as a
named argument, never re-read inside the function.

---

### `layer/functions-are-transport-agnostic`

**Severity: `error`**

A function in `functions/` takes a single destructured object of domain
arguments, returns a domain value, throws on failure, and never receives `req`
or `res` or references status codes.

Rationale: the same functions serve HTTP routes, the internal `/internal/knowledge`
endpoint in `server.ts`, and seven event subscriptions in `app.ts`. A function
that writes to `res` works in exactly one of those three callers.

Incorrect:

```ts
async function create({ teamId, knowledge }, res) {
  if (!teamId) {
    return res.status(400).json({ error: "INVALID_TEAM" });
  }
}
```

Incorrect:

```ts
async function list(req) {
  const { agentId } = req.query;
  const { projectId: teamId } = req.session;

  return Knowledge.findAll({ where: { agentId, teamId } });
}
```

Incorrect:

```ts
async function get({ knowledgeId }) {
  const knowledge = await Knowledge.findByPk(knowledgeId);

  if (!knowledge) {
    return { status: 404, body: { error: "NOT_FOUND" } };
  }

  return { status: 200, body: knowledge.toJSON() };
}
```

Correct:

```ts
async function create({
  teamId,
  agentId,
  knowledge,
}: {
  teamId?: string;
  agentId?: string;
  knowledge: {
    type: "QA" | "URL" | "TEXT" | "TASK" | "DATA";
    url?: string;
    text?: string;
    question?: string;
    answer?: string;
  };
}) {
  if (!teamId && !agentId) {
    throw new Error("INVALID_TEAM_OR_AGENT");
  }

  if (knowledge.type === "QA" && (!knowledge.question || !knowledge.answer)) {
    throw new Error("INVALID_QA_KNOWLEDGE");
  }

  return knowledgeItem.toJSON();
}

export default { create, list, get };
```

Correct:

```ts
async function list({ agentId, teamId }: { agentId?: string; teamId?: string }) {
  if (!agentId && !teamId) {
    throw new Error("INVALID_TEAM_OR_AGENT");
  }

  const knowledges = await Knowledge.findAll({
    where: agentId ? { agentId } : { teamId },
  });

  return knowledges.map((knowledge) => knowledge.toJSON());
}
```

Correct:

```ts
async function get({ knowledgeId }: { knowledgeId: string }) {
  const knowledge = await Knowledge.findByPk(knowledgeId);

  if (!knowledge) {
    throw new NotFoundError("KNOWLEDGE_NOT_FOUND");
  }

  return knowledge.toJSON();
}
```

The module default-exports an object of named functions, which is why callers
read `knowledgeFn.list({ agentId })`. Returning `.toJSON()` rather than the
Sequelize instance keeps the model out of the caller's hands.

---

### `layer/lib-wraps-providers-only`

**Severity: `error`**

`lib/` translates between this application and an external SDK, and must not
contain tenant rules, plan checks, or any decision that depends on domain state.

Rationale: `lib/` is selected at runtime by provider key. A policy placed in one
adapter silently does not apply when a different provider is configured.

Incorrect:

```ts
export default {
  async generate(params: GenerateParams) {
    if (params.meta?.teamId && (await isFreeTier(params.meta.teamId))) {
      throw new Error("UPGRADE_REQUIRED");
    }

    return client.chat.completions.create(params);
  },
};
```

Incorrect:

```ts
export default {
  async generate(params: GenerateParams) {
    const agent = await Agent.findByPk(params.meta?.agentId);

    const messages = [
      { role: "system" as const, content: agent.description },
      ...params.messages,
    ];

    return client.chat.completions.create({ ...params, messages });
  },
};
```

Incorrect:

```ts
export default {
  async generate(params: GenerateParams) {
    const monthly = await LLMLog.count({ where: { teamId: params.meta?.teamId } });

    if (monthly > 1000) {
      return { error: "QUOTA_EXCEEDED" };
    }

    return client.messages.create(params);
  },
};
```

Correct:

```ts
type GenerateParams = {
  model?: string;
  messages: { role: "user" | "assistant" | "system"; content: string }[];
  responseFormat?: string;
  temperature?: number;
  max_tokens?: number;
  meta?: LLMMeta;
};

type LLMAdapter = {
  generate(params: GenerateParams): Promise<Record<string, unknown>>;
};
```

Correct:

```ts
export default {
  async generate({ model, messages, responseFormat, max_tokens }: GenerateParams) {
    const completion = await client.chat.completions.create({
      model: model || DEFAULT_MODEL,
      messages,
      max_tokens,
      response_format: responseFormat === "json" ? { type: "json_object" } : undefined,
    });

    return parseJsonContent(completion.choices[0].message.content, "OpenAI");
  },
};
```

Correct:

```ts
async function chat({ agentId, sessionId, content, meta }) {
  const agent = await Agent.findByPk(agentId);

  if (await isFreeTier(agent.teamId)) {
    throw new Error("UPGRADE_REQUIRED");
  }

  return generate({ policy, content, meta });
}
```

Every adapter implements exactly the `LLMAdapter` shape, and nothing more. Tier
and policy checks belong in `functions/`, before `generate` is called.

`jsonParse.ts` and `parameterRefs.ts` show the other legitimate `lib/` role:
pure, provider-agnostic helpers with their own unit specs under `lib/test/`.

---

### `layer/schemas-and-models-are-the-contract`

**Severity: `error`**

A field a route accepts is defined in `schemas/` and a field it persists is
defined in `models/`, so code must not read or write attributes that appear in
neither.

Rationale: `schemas/` is what the client is promised, `models/` is what the
database holds, and drift between them surfaces as silently dropped fields
rather than errors — Joi strips unknown keys and Sequelize ignores unmapped
attributes.

Incorrect:

```ts
const { body } = await request(app)
  .post("/agents")
  .send({
    name: "Test Agent",
    avatar: "Test Avatar",
    character: "Test Character",
    title: "Test Title",
    role: "Test Role",
  })
  .expect(201);
```

Incorrect:

```ts
const agent = await Agent.findByPk(agentId);

res.json({
  id: agent.id,
  name: agent.name,
  personality: agent.personality,
});
```

Incorrect:

```ts
const Agent = Joi.object({
  name: Joi.string().required(),
  icon: Joi.string().required(),
  teamId: Joi.string().guid().required(),
  aiEngineId: Joi.string().guid().required(),
  description: Joi.string().required(),
  temperature: Joi.number().optional(),
});
```

Correct:

```ts
const Agent = Joi.object({
  name: Joi.string().required(),
  icon: Joi.string().required(),
  teamId: Joi.string().guid().required(),
  aiEngineId: Joi.string().guid().required(),
  description: Joi.string().required(),
});
```

Correct:

```ts
export interface AgentAttributes {
  id: string;
  name: string;
  icon: string;
  aiEngineId: string;
  teamId: string;
  description: string;
}
```

Correct:

```ts
const { body } = await request(app)
  .post("/agents")
  .send({
    name: "Test Agent",
    icon: ":5:",
    teamId: "cb16e069-6214-47f1-9922-1f7fe7629525",
    aiEngineId: "289a3c9a-f23b-421a-ac6e-f14052a2d57c",
    description: "Test description",
  })
  .expect(201);
```

`avatar`, `character`, `title`, `role`, `personality` and `temperature` exist in
neither `schemas/Agent.ts` nor `models/Agent.ts`. The schema and the model agree
field for field. Change them together, and update the specs and `seeds/` in the
same commit.

---

## 2. HTTP correctness and authorization

### `http/terminate-every-response`

**Severity: `error`**

Every branch that means "stop" must both send and return —
`return res.status(404).end()` — because `res.status(n)` on its own only sets a
number on the response object.

Rationale: this is the single most damaging pattern in this codebase. A bare
`res.status(401);` sets the code, execution continues into the code that was
supposed to be forbidden, and a later `res.json(...)` or `res.status(204).end()`
overwrites the status on the way out. The client sees success and the operation
happened.

Thirteen such branches exist today, in `routes/agents.ts` and
`routes/supervisings.ts`. Every other route file uses `return res.status(...)`
correctly.

Incorrect:

```ts
router.delete("/:id", async (req, res) => {
  const { projectId: teamId } = req.session;
  const agent = await Agent.findByPk(validatedId);

  if (!agent) {
    res.status(404);
  }

  if (agent && agent.teamId !== teamId) {
    res.status(401);
  }

  await agent?.destroy();

  res.status(204).end();
});
```

Incorrect:

```ts
router.get("/:id", async (req, res) => {
  const agent = await Agent.findByPk(validatedId);

  if (!agent) {
    res.status(404).end();
  }

  res.json(agent);
});
```

Incorrect:

```ts
router.post("/", async (req, res) => {
  if (!req.body.name) {
    res.status(400).json({ error: "NAME_REQUIRED" });
  }

  const agent = await Agent.create(req.body);

  res.status(201).json(agent);
});
```

Correct:

```ts
router.get("/:agentId/sessions", async (req, res) => {
  const agent = await Agent.findByPk(agentId);

  if (!agent) {
    return res.status(404).end();
  }

  if (agent.teamId !== teamId) {
    return res.status(401).end();
  }

  const sessions = await sessionFn.listRecent({ agentId });

  res.json(sessions);
});
```

Correct:

```ts
router.delete("/:id", async (req, res) => {
  const { projectId: teamId } = req.session;

  const agent = await Agent.findOne({ where: { id: validatedId, teamId } });

  if (!agent) {
    return res.status(404).end();
  }

  await agentFn.remove({ agentId: agent.id });

  res.status(204).end();
});
```

Correct:

```ts
router.post("/", async (req, res) => {
  const { projectId: teamId } = req.session;

  const validatedBody = Joi.attempt(req.body, schemas.Agent);

  const agent = await Agent.create({ ...validatedBody, teamId });

  return res.status(201).json(agent);
});
```

The first `Incorrect` and the first `Correct` come from the same file. The
`return` is the whole difference. The second `Incorrect` still calls `.end()`,
which is not enough — `res.json` after it throws
`ERR_HTTP_HEADERS_SENT`.

---

### `http/authorize-before-mutating`

**Severity: `error`**

The tenant check runs, and returns, before any create, update or destroy — never
authorize and mutate in sequence without a `return` between them.

Rationale: this is [`http/terminate-every-response`](#httpterminate-every-response)
at its most expensive, and it is worth stating separately because the failure is
a cross-tenant authorization bypass rather than a wrong status code. Both
mutating agent routes have it today.

Incorrect:

```ts
router.put("/:id", async (req, res) => {
  const agent = await Agent.findByPk(validatedId);

  if (!agent) {
    res.status(404);
  }

  if (agent.teamId !== teamId) {
    res.status(401);
  }

  await agent.update(validatedBody);

  res.json(agent);
});
```

Incorrect:

```ts
router.delete("/:id", async (req, res) => {
  const agent = await Agent.findByPk(validatedId);

  await agent?.destroy();

  if (agent && agent.teamId !== teamId) {
    return res.status(401).end();
  }

  res.status(204).end();
});
```

Incorrect:

```ts
router.post("/:agentId/knowledge", async (req, res) => {
  const knowledge = await knowledgeFn.create({ agentId, knowledge: validatedBody });

  const agent = await Agent.findByPk(agentId);

  if (agent.teamId !== teamId) {
    return res.status(401).end();
  }

  res.status(201).json(knowledge);
});
```

Correct:

```ts
router.put("/:id", async (req, res) => {
  const { projectId: teamId } = req.session;

  const validatedId = Joi.attempt(id, Joi.string().guid().required());
  const validatedBody = Joi.attempt(body, schemas.Agent);

  const agent = await Agent.findByPk(validatedId);

  if (!agent) {
    return res.status(404).end();
  }

  if (agent.teamId !== teamId) {
    return res.status(401).end();
  }

  const updated = await agentFn.update({ agentId: agent.id, ...validatedBody });

  res.json(updated);
});
```

Correct:

```ts
router.delete("/:id", async (req, res) => {
  const { projectId: teamId } = req.session;

  const validatedId = Joi.attempt(id, Joi.string().guid().required());

  const agent = await Agent.findOne({ where: { id: validatedId, teamId } });

  if (!agent) {
    return res.status(404).end();
  }

  await agentFn.remove({ agentId: agent.id });

  res.status(204).end();
});
```

Correct:

```ts
router.post("/:agentId/knowledge", async (req, res) => {
  const { projectId: teamId } = req.session;

  const agent = await Agent.findOne({ where: { id: agentId, teamId } });

  if (!agent) {
    return res.status(404).end();
  }

  const knowledge = await knowledgeFn.create({
    agentId: agent.id,
    knowledge: validatedBody,
  });

  res.status(201).json(knowledge);
});
```

Prefer scoping the lookup so the check cannot be skipped at all — see
[`http/scope-queries-to-session-tenant`](#httpscope-queries-to-session-tenant).

---

### `http/guard-before-dereference`

**Severity: `error`**

After a lookup that can miss, return on the miss before touching the result.

Rationale: `if (!agent) { res.status(404); }` followed by `agent.teamId` throws
`TypeError` on null, so the client gets a 500 from the error handler instead of
the 404 the code intended. The `agent && ...` spelling avoids the throw but then
falls through to the same unguarded mutation.

Incorrect:

```ts
const agent = await Agent.findByPk(agentId);

if (!agent) {
  res.status(404);
}

if (agent.teamId !== teamId) {
  res.status(401);
}

const conversation = await Conversation.findByPk(conversationId);

if (!conversation) {
  res.status(404);
}

const createdSupervising = await supervising.create({
  question: conversation.content,
});
```

Incorrect:

```ts
const session = await Session.findByPk(sessionId);

if (session && session.agentId !== agentId) {
  res.status(401);
}

res.json(session.toJSON());
```

Incorrect:

```ts
const task = await Task.findByPk(taskId);

const steps = await taskFn.listSteps({ taskId: task.id });

if (!task) {
  return res.status(404).end();
}

res.json(steps);
```

Correct:

```ts
const agent = await Agent.findByPk(agentId);

if (!agent) {
  return res.status(404).end();
}

if (agent.teamId !== teamId) {
  return res.status(401).end();
}

const conversation = await Conversation.findByPk(conversationId);

if (!conversation) {
  return res.status(404).end();
}

const createdSupervising = await supervisingFn.create({
  question: conversation.content,
});
```

Correct:

```ts
const session = await Session.findByPk(sessionId);

if (!session) {
  return res.status(404).end();
}

if (session.agentId !== agentId) {
  return res.status(401).end();
}

res.json(session.toJSON());
```

Correct:

```ts
const task = await Task.findByPk(taskId);

if (!task) {
  return res.status(404).end();
}

const steps = await taskFn.listSteps({ taskId: task.id });

res.json(steps);
```

---

### `http/no-duplicate-route-registration`

**Severity: `error`**

One method-and-path pair is registered once per router.

Rationale: Express matches the first registration and never reaches the second,
so the duplicate is dead code that reads as live. `routes/agents.ts` registers
`GET /:agentId/blueprints` twice; the second version — the one that validates
`agentId` as a GUID and returns bare status codes — never runs.

Incorrect:

```ts
router.get("/:agentId/blueprints", async (req, res) => {
  const agent = await Agent.findByPk(agentId);

  if (!agent) {
    return res.status(404).json({ message: "Agent not found" });
  }

  const blueprints = await BlueprintModel.findAll({ where: { agentId } });

  res.json(blueprints);
});

router.get("/:agentId/blueprints", async (req, res) => {
  const { agentId } = Joi.attempt(
    req.params,
    Joi.object({ agentId: Joi.string().guid().required() })
  );

  const blueprints = await BlueprintModel.findAll({ where: { agentId } });

  res.json(blueprints);
});
```

Incorrect:

```ts
router.delete("/:id", async (req, res) => {
  await agentFn.remove({ agentId: req.params.id });

  res.status(204).end();
});

router.delete("/:agentId", async (req, res) => {
  await agentFn.archive({ agentId: req.params.agentId });

  res.status(204).end();
});
```

Incorrect:

```ts
router.use("/agents", agents);
router.use("/agents", agentsV2);
```

Correct:

Keep one handler with the validation from the second and the error bodies from
the first:

```ts
router.get("/:agentId/blueprints", async (req, res) => {
  const { projectId: teamId } = req.session;

  const { agentId } = Joi.attempt(
    req.params,
    Joi.object({ agentId: Joi.string().guid().required() })
  );

  const agent = await Agent.findByPk(agentId);

  if (!agent) {
    return res.status(404).json({ message: "Agent not found" });
  }

  if (agent.teamId !== teamId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const blueprints = await BlueprintModel.findAll({ where: { agentId } });

  res.json(blueprints);
});
```

Correct:

```ts
router.post("/blueprints", async (req, res) => {
  const response = await agentFn.Blueprint({ history, content, meta });

  res.json(response);
});

router.post("/:agentId/blueprints", async (req, res) => {
  const blueprint = await agentFn.upsertBlueprint({ agentId, nodes });

  res.status(201).json(blueprint);
});
```

Correct:

```ts
router.delete("/:id", async (req, res) => {
  const { archive } = Joi.attempt(
    req.query,
    Joi.object({ archive: Joi.boolean().default(false) })
  );

  if (archive) {
    await agentFn.archive({ agentId: validatedId });
  } else {
    await agentFn.remove({ agentId: validatedId });
  }

  res.status(204).end();
});
```

Distinct paths that merely look similar are fine — `POST /blueprints` and
`POST /:agentId/blueprints` are different routes. Two registrations that differ
only in the parameter's name — `/:id` and `/:agentId` — are the same route, and
the second never runs.

---

### `http/scope-queries-to-session-tenant`

**Severity: `error`**

Reads and writes are scoped to `req.session.projectId` in the query itself
wherever the model carries `teamId`, never fetched globally and compared
afterwards.

Rationale: `app.ts` declares `req.session` with `userId`, `appId`,
`organizationId` and `projectId`, and every agent-owned table carries `teamId`.
Scoping in the `where` clause makes a cross-tenant hit impossible; comparing
after the fact makes it possible to forget, which is exactly what happened in
the two routes above.

Incorrect:

```ts
const agent = await Agent.findByPk(validatedId);

if (agent.teamId !== teamId) {
  return res.status(401).end();
}
```

Incorrect:

```ts
router.get("/", async (req, res) => {
  const agents = await Agent.findAll({
    include: ["AIEngine"],
  });

  res.json(agents);
});
```

Incorrect:

```ts
router.put("/:id", async (req, res) => {
  const { projectId: teamId } = req.session;

  const [count] = await Agent.update(validatedBody, {
    where: { id: validatedId },
  });

  if (count === 0) {
    return res.status(404).end();
  }

  res.json(await Agent.findByPk(validatedId));
});
```

Correct:

```ts
router.get("/", async (req, res) => {
  const { projectId: teamId } = req.session;

  const agents = await Agent.findAll({
    where: { teamId },
    attributes: { exclude: ["aiEngineId"] },
    include: ["AIEngine"],
  });

  res.json(agents);
});
```

Correct:

```ts
const agent = await Agent.findOne({ where: { id: validatedId, teamId } });

if (!agent) {
  return res.status(404).end();
}
```

Correct:

```ts
router.put("/:id", async (req, res) => {
  const { projectId: teamId } = req.session;

  const [count] = await Agent.update(validatedBody, {
    where: { id: validatedId, teamId },
  });

  if (count === 0) {
    return res.status(404).end();
  }

  res.json(await Agent.findOne({ where: { id: validatedId, teamId } }));
});
```

A foreign id and a missing id both become 404, which also avoids leaking whether
another team's agent exists. The first `Incorrect` is correct as written and one
missing `return` away from a bypass — which is why the scoped lookup is the rule.

Note `attributes: { exclude: ["aiEngineId"] }` alongside `include: ["AIEngine"]`
— the foreign key is dropped from the response and the association is returned
instead. Keep that shape; the dashboard reads `agent.AIEngine.vendor`.

---

### `http/every-handler-scopes-or-declares-global`

**Severity: `error`**

Every handler either scopes to `req.session.projectId` or is a deliberately
global resource with a comment saying so — there is no third case.

Rationale:
[`http/scope-queries-to-session-tenant`](#httpscope-queries-to-session-tenant)
says how to scope; this rule says every handler must be checked. Four route files
never mention `req.session` at all, and only three of them have a defensible
reason.

Legitimately global, because the data is not tenant-owned:

- `engines.ts` — the AI engine catalogue
- `modelPricings.ts` — the public pricing table
- `metrics.ts` — the Prometheus scrape endpoint

Not legitimately global:

- `communications.ts` — all four handlers, on data reached through
  `blueprintId` → `agentId` → `teamId`
- `tasks.ts` — `PATCH /:taskId/steps/:stepId`

Incorrect:

```ts
router.get("/", async (req, res) => {
  const comms = await communication.list();
  res.status(200).json(comms);
});

router.delete("/:id", async (req, res) => {
  await communication.remove({ communicationId: req.params.id });
  res.sendStatus(204);
});
```

Incorrect:

```ts
router.patch("/:taskId/steps/:stepId", async (req, res) => {
  const step = await taskFn.updateStep({
    taskId: req.params.taskId,
    stepId: req.params.stepId,
    status: req.body.status,
  });

  res.json(step);
});
```

Incorrect:

```ts
router.get("/", async (_req, res) => {
  const engines = await AIEngine.findAll();

  res.json(engines);
});
```

The engine catalogue is genuinely global, but nothing here says so, so a reviewer
cannot tell it apart from the two above.

Correct:

```ts
router.get("/", async (req, res) => {
  const { projectId: teamId } = req.session;

  const comms = await communication.list({ teamId });

  res.status(200).json(comms);
});

router.delete("/:id", async (req, res) => {
  const { projectId: teamId } = req.session;

  const { id } = Joi.attempt(
    req.params,
    Joi.object({ id: Joi.string().guid().required() })
  );

  const removed = await communication.remove({ communicationId: id, teamId });

  if (!removed) {
    return res.status(404).end();
  }

  res.sendStatus(204);
});
```

Correct:

```ts
router.patch("/:taskId/steps/:stepId", async (req, res) => {
  const { projectId: teamId } = req.session;

  const { taskId, stepId } = Joi.attempt(
    req.params,
    Joi.object({
      taskId: Joi.string().guid().required(),
      stepId: Joi.string().guid().required(),
    })
  );

  const step = await taskFn.updateStep({
    teamId,
    taskId,
    stepId,
    status: Joi.attempt(req.body, schemas.Step.patch).status,
  });

  if (!step) {
    return res.status(404).end();
  }

  res.json(step);
});
```

Correct:

```ts
router.get("/", async (_req, res) => {
  const engines = await AIEngine.findAll();

  res.json(engines);
});
```

`AIEngine` is a shared catalogue with no tenant column. Declare that where a
reviewer will see it — in the route's own file — not in a reviewer's memory.

---

### `function/list-takes-a-scope`

**Severity: `error`**

A function that lists rows takes the scope as an argument and applies it in the
query, because a bare `Model.findAll()` with no `where` is a cross-tenant read.

Rationale: routes are thin by rule, so the tenant filter lives in the function.
`communication.list()` takes no arguments at all and returns every row in the
table, which is what makes the unscoped route above a data exposure rather than
just an oversight.

Incorrect:

```ts
async function list() {
  const communications = await Communication.findAll();

  return communications.map((communication) => communication.toJSON());
}
```

Incorrect:

```ts
async function list({ teamId }: { teamId?: string }) {
  const communications = await Communication.findAll();

  return communications
    .map((communication) => communication.toJSON())
    .filter((communication) => communication.teamId === teamId);
}
```

Filtering after the fact still reads every tenant's rows out of the database, and
returns everything when `teamId` is `undefined`.

Incorrect:

```ts
async function listSteps({ taskId }: { taskId?: string }) {
  return Step.findAll({ where: taskId ? { taskId } : {} });
}
```

Correct:

```ts
async function list({ teamId }: { teamId: string }) {
  if (!teamId) {
    throw new Error("INVALID_TEAM");
  }

  const communications = await Communication.findAll({
    include: [
      {
        association: "Blueprint",
        required: true,
        include: [{ association: "Agent", required: true, where: { teamId } }],
      },
    ],
  });

  return communications.map((communication) => communication.toJSON());
}
```

`Communication` has no `teamId` column of its own, so the scope travels through
the association chain registered in `models/models.ts`. `required: true` makes
each join an inner join, so a row whose chain does not reach the team is not
returned at all.

Correct:

```ts
async function list({ agentId }: { agentId: string }) {
  if (!agentId) {
    throw new Error("INVALID_AGENT");
  }

  return Knowledge.findAll({ where: { agentId } });
}
```

Correct:

```ts
async function listSteps({ taskId }: { taskId: string }) {
  if (!taskId) {
    throw new Error("INVALID_TASK");
  }

  const steps = await Step.findAll({ where: { taskId } });

  return steps.map((step) => step.toJSON());
}
```

Where the model carries the tenant column, scope directly; where it does not,
scope through the association chain as in the first `Correct` above.

---

### `http/status-codes`

**Severity: `warn`**

`201` for a create that returns the resource, `204` with `.end()` for a delete,
`200` via `res.json(...)` for reads and updates, `400` for validation, `401` for
a tenant mismatch, `404` for a missing resource.

Rationale: the dashboard branches on these, and the route specs assert them
directly with `.expect(201)`.

Incorrect:

```ts
const agent = await Agent.create(validatedBody);

res.json(agent);
```

Incorrect:

```ts
await agentFn.remove({ agentId: agent.id });

res.status(200).json({ deleted: true });
```

Incorrect:

```ts
if (agent.teamId !== teamId) {
  return res.status(403).json({ error: "FORBIDDEN" });
}

if (!Joi.isSchema(schemas.Agent)) {
  return res.status(500).end();
}
```

Correct:

```ts
router.post("/", async (req, res) => {
  const { projectId: teamId } = req.session;

  const validatedBody = Joi.attempt(body, schemas.Agent);
  validatedBody.teamId = teamId;

  const agent = await Agent.create(validatedBody);

  res.status(201).json(agent);
});
```

Correct:

```ts
await agentFn.remove({ agentId: agent.id });

res.status(204).end();
```

Correct:

```ts
const updated = await agentFn.update({ agentId: agent.id, ...validatedBody });

res.json(updated);
```

Correct:

```ts
if (agent.teamId !== teamId) {
  return res.status(401).end();
}
```

---

## 3. Validation

### `validation/one-library`

**Severity: `error`**

Request validation uses Joi, and no second validation library is introduced.

Rationale: `schemas/` currently contains both — Joi in eleven files consumed as
`Joi.attempt(body, schemas.Agent)`, and Zod in `Blueprint.ts` and `Node.ts`
consumed as `Blueprint.create.parse(body)`. The two throw different error types,
so `platform.error.handle` cannot map both consistently, and neither library is
declared in `package.json` (see
[`deps/declare-what-you-import`](#depsdeclare-what-you-import)).

Incorrect:

```ts
const validatedBody = Joi.attempt(body, schemas.Agent);

const { history, content } = Blueprint.create.parse(body);
```

Incorrect:

```ts
import { z } from "zod";

const Node = z.object({
  id: z.string().uuid(),
  type: z.enum(["ACTION", "CONDITION"]),
});

export default { create: Node };
```

Incorrect:

```ts
import Ajv from "ajv";

const ajv = new Ajv();
const validate = ajv.compile(agentJsonSchema);

if (!validate(req.body)) {
  return res.status(400).json({ errors: validate.errors });
}
```

Correct:

```ts
import Joi from "joi";

const Agent = Joi.object({
  name: Joi.string().required(),
  icon: Joi.string().required(),
  teamId: Joi.string().guid().required(),
  aiEngineId: Joi.string().guid().required(),
  description: Joi.string().required(),
});

export default Agent;
```

Correct:

```ts
import Joi from "joi";

const Node = Joi.object({
  id: Joi.string().guid().required(),
  type: Joi.string().valid("ACTION", "CONDITION").required(),
});

export default { create: Node };
```

Correct:

```ts
const validatedBody = Joi.attempt(body, schemas.Agent);

const { history, content } = Joi.attempt(body, schemas.Blueprint.create);
```

Joi is the majority by a wide margin and is what `schemas/index.ts` aggregates,
so converting the two Zod schemas is the smaller change. Whichever way it is
settled, settle it — and add the winner to `dependencies`.

---

### `validation/validate-at-the-boundary`

**Severity: `error`**

Every route validates its params, query and body before use, with path ids
validated as GUIDs.

Rationale: an unvalidated id reaches Sequelize directly, and an unvalidated body
reaches `Model.create`. Validation is also what strips unknown keys, which is
what keeps the response shape stable.

Incorrect:

```ts
router.post("/:agentId/blueprints", async (req, res) => {
  const { agentId } = req.params;
  const { history, content } = Blueprint.createBlueprintName.parse(body);

  const response = await agentFn.blueprintName({ history, content, agentId });

  res.json(response);
});
```

Incorrect:

```ts
router.get("/", async (req, res) => {
  const { status } = req.query;

  const supervisings = await Supervising.findAll({ where: { status } });

  res.json(supervisings);
});
```

Incorrect:

```ts
const id = Joi.attempt(req.params.id, Joi.string().guid().required());
const limit = Joi.attempt(req.query.limit, Joi.number().optional());
```

Validating fields one at a time lets unexpected keys through — `req.query.order`
here is never rejected and never seen.

Correct:

```ts
const { agentId } = Joi.attempt(
  req.params,
  Joi.object({ agentId: Joi.string().guid().required() })
);
```

Correct:

```ts
const { status } = Joi.attempt(
  req.query,
  Joi.object({
    status: Joi.string().valid("ANSWERED", "IN_PROGRESS").optional(),
  })
);
```

Correct:

```ts
router.post("/:agentId/blueprints", async (req, res) => {
  const { projectId: teamId } = req.session;

  const { agentId } = Joi.attempt(
    req.params,
    Joi.object({ agentId: Joi.string().guid().required() })
  );

  const { history, content } = Joi.attempt(
    req.body,
    schemas.Blueprint.createBlueprintName
  );

  const agent = await Agent.findOne({ where: { id: agentId, teamId } });

  if (!agent) {
    return res.status(404).end();
  }

  const response = await agentFn.blueprintName({
    history,
    content,
    agentId: agent.id,
  });

  res.json(response);
});
```

Validating the whole `req.params` or `req.query` object at once is preferable to
validating fields individually — it rejects unexpected keys as well.

---

### `validation/schema-per-resource`

**Severity: `warn`**

Each resource has one schema module in `schemas/`, registered in
`schemas/index.ts`, exporting either a single Joi object or a named map of
operations.

Rationale: `schemas/index.ts` is the single import surface routes use, so a
schema that is not registered there gets imported by a deep path and drifts out
of sight.

Incorrect:

```ts
router.post("/", async (req, res) => {
  const validatedBody = Joi.attempt(
    body,
    Joi.object({
      name: Joi.string().required(),
      icon: Joi.string().required(),
    })
  );
});
```

Incorrect:

```ts
import Step from "../schemas/Step";

const validatedBody = Joi.attempt(req.body, Step.patch);
```

Reaching a schema by deep path works, but it is not registered in
`schemas/index.ts`, so nothing lists it and nothing notices when it drifts.

Incorrect:

```ts
const AgentCreate = Joi.object({ name: Joi.string().required() });
const AgentUpdate = Joi.object({ name: Joi.string().optional() });

export { AgentCreate, AgentUpdate };
```

Two exported schemas for one resource, and no default export for
`schemas/index.ts` to aggregate.

Correct:

```ts
import Agent from "./Agent";
import Blueprint from "./Blueprint";
import Knowledge from "./Knowledge";

export default {
  Project,
  Team,
  Agent,
  Knowledge,
  Message,
  Session,
  Supervising,
  Command,
  Blueprint,
  MCP,
  Communication,
  StepScore,
};
```

Correct:

```ts
import Joi from "joi";

const Supervising = {
  create: Joi.object({
    agentId: Joi.string().guid().required(),
    conversationId: Joi.string().guid().required(),
  }),
  answer: Joi.object({
    answer: Joi.string().required(),
  }),
};

export default Supervising;
```

Correct:

```ts
const validatedBody = Joi.attempt(req.body, schemas.Supervising.answer);
```

Multi-operation resources use a named map, as `Supervising.create` and
`Blueprint.upsert` do, so the operation is visible at the call site.

---

## 4. Errors and observability

### `error/throw-domain-codes`

**Severity: `error`**

Functions signal failure by throwing — either a platform error class from
`@canmingir/link-express/error`, or an `Error` whose message is an
`UPPER_SNAKE_CASE` code — never by returning `null` or an HTTP shape.

Rationale: the code is the contract. `platform.error.handle`, mounted last in
`app.ts`, maps thrown errors to responses, and a code survives being logged,
compared and tested in a way that prose does not.

Incorrect:

```ts
async function create({ teamId, agentId, knowledge }) {
  if (!teamId && !agentId) {
    return null;
  }

  if (knowledge.type === "QA" && !knowledge.question) {
    throw new Error("The question field is required when creating QA knowledge");
  }
}
```

Incorrect:

```ts
async function get({ knowledgeId }) {
  const knowledge = await Knowledge.findByPk(knowledgeId);

  if (!knowledge) {
    return { status: 404, message: "Knowledge not found" };
  }

  return knowledge.toJSON();
}
```

Incorrect:

```ts
async function remove({ agentId }) {
  const agent = await Agent.findByPk(agentId);

  if (!agent) {
    return false;
  }

  await agent.destroy();

  return true;
}
```

A boolean return forces every caller to invent its own status mapping, and the
two failure modes — missing agent, failed delete — collapse into one value.

Correct:

```ts
import { NotFoundError } from "@canmingir/link-express/error";

if (!teamId && !agentId) {
  throw new Error("INVALID_TEAM_OR_AGENT");
}

if (knowledge.type === "QA" && (!knowledge.question || !knowledge.answer)) {
  throw new Error("INVALID_QA_KNOWLEDGE");
}

if (knowledge.type === "URL" && !knowledge.url && knowledge.content) {
  throw new Error("INVALID_URL_KNOWLEDGE");
}
```

Correct:

```ts
import { NotFoundError } from "@canmingir/link-express/error";

async function get({ knowledgeId }: { knowledgeId: string }) {
  const knowledge = await Knowledge.findByPk(knowledgeId);

  if (!knowledge) {
    throw new NotFoundError("KNOWLEDGE_NOT_FOUND");
  }

  return knowledge.toJSON();
}
```

Correct:

```ts
async function remove({ agentId }: { agentId: string }) {
  const agent = await Agent.findByPk(agentId);

  if (!agent) {
    throw new NotFoundError("AGENT_NOT_FOUND");
  }

  await agent.destroy();
}
```

`NotFoundError` and its siblings are preferred where one fits, because the
platform handler already knows their status codes.

---

### `obs/platform-logger-not-console`

**Severity: `error`**

Diagnostics go through `platform.logger`, and `console.log` must not ship.

Rationale: `platform.logger` is structured and is what the OpenTelemetry
instrumentation and the Prometheus pushgateway are wired to; `console.log` is
unstructured, unleveled, and invisible to both. Twenty-four `console.log` calls
are in `src` today, including two inside the `SUPERVISING_ANSWERED` subscription
in `app.ts` that print on every supervision answer in production.

Incorrect:

```ts
const steps = await taskFn.listSteps({ taskId });

console.log("steps", steps);

const supervisedIndex = sortedSteps.findIndex(
  (step) => step.status === "SUPERVISED_NEEDED",
);

console.log("supervisedIndex", supervisedIndex);
```

Incorrect:

```ts
try {
  await agentFn.chat({ agentId, sessionId, content });
} catch (error) {
  console.error("chat failed", error);
}
```

Incorrect:

```ts
platform.logger.info("agent " + agent.id + " created in team " + teamId);
```

A single interpolated string is structured logging in name only — nothing can
filter on `agentId` because there is no `agentId` field.

Correct:

```ts
platform.logger.error({
  message: "Uncaught Exception",
  error_message: err.message,
  error_stack: err.stack,
});
```

Correct:

```ts
const logger = platform.logger;

logger.info("Platform Logger Initialized");
```

Correct:

```ts
try {
  await agentFn.chat({ agentId, sessionId, content });
} catch (error) {
  platform.logger.error({
    message: "Agent chat failed",
    agentId,
    sessionId,
    error_message: error instanceof Error ? error.message : String(error),
  });
}
```

Correct:

```ts
platform.logger.info({ message: "Agent created", agentId: agent.id, teamId });
```

Log an object with named fields rather than positional arguments or an
interpolated string — that is what makes the record queryable.

---

### `error/let-platform-map-to-http`

**Severity: `warn`**

Routes let thrown errors reach `platform.error.handle` instead of wrapping every
handler in `try/catch`.

Rationale: `app.ts` mounts the handler after all routers, inside `setImmediate`,
together with the 404 fallback. Per-route `try/catch` duplicates that mapping and
tends to flatten distinct failures into one generic 500.

Incorrect:

```ts
router.post("/", async (req, res) => {
  try {
    const agent = await agentFn.create(validatedBody);
    res.status(201).json(agent);
  } catch (err) {
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});
```

Incorrect:

```ts
router.get("/:id", async (req, res) => {
  try {
    const agent = await agentFn.get({ agentId: validatedId });
    res.json(agent);
  } catch (err) {
    platform.logger.error(err);
    throw err;
  }
});
```

Catching only to log and rethrow adds a frame and no behaviour — the platform
handler already logs.

Correct:

```ts
setImmediate(() => {
  app.use((_req, res) => res.status(404).end());
  app.use(platform.error.handle);
});
```

Correct:

```ts
router.post("/", async (req, res) => {
  const validatedBody = Joi.attempt(body, schemas.Agent);
  validatedBody.teamId = teamId;

  const agent = await Agent.create(validatedBody);

  res.status(201).json(agent);
});
```

Correct:

```ts
server.on("request", async (req, res) => {
  if (req.url !== "/internal/knowledge") {
    return;
  }

  try {
    const knowledge = await knowledgeFn.create(JSON.parse(body));

    res.writeHead(201, { "Content-Type": "application/json" });
    res.end(JSON.stringify(knowledge));
  } catch (error) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: (error as Error).message }));
  }
});
```

The exception is a boundary the platform does not own — the raw
`/internal/knowledge` handler in `server.ts` runs outside Express and correctly
maps its own errors.

---

## 5. Persistence

### `model/decorator-table-definition`

**Severity: `warn`**

Models are classes extending `Model<Attributes>` with the decorator set imported
from `@canmingir/link-express/sequelize`, declaring
`@Table({ tableName, timestamps, underscored })` and `declare`-ed columns.

Rationale: the decorators come from the platform re-export, not from
`sequelize-typescript` directly, so the whole application shares one Sequelize
instance and one registry. `declare` is required because the fields are defined
by the decorator, not by the class body.

Incorrect:

```ts
import { DataTypes } from "sequelize";

const Agent = sequelize.define("Agent", {
  id: { type: DataTypes.UUID, primaryKey: true },
  name: DataTypes.STRING,
});
```

Incorrect:

```ts
import { Column, DataType, Model, Table } from "sequelize-typescript";

@Table({ tableName: "Agent" })
class Agent extends Model<AgentAttributes> {
  @Column(DataType.STRING)
  declare name: string;
}
```

Importing the decorators from `sequelize-typescript` directly gives this model a
different registry from the one the platform initialised.

Incorrect:

```ts
@Table({ tableName: "Agent", timestamps: false, underscored: true })
class Agent extends Model<AgentAttributes> {
  @Column(DataType.STRING)
  name: string;
}
```

Without `declare`, the class body emits a real field that shadows the decorator's
accessor, so reads return `undefined`.

Correct:

```ts
@Table({
  tableName: "Agent",
  timestamps: false,
  underscored: true,
})
class Agent extends Model<AgentAttributes> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare name: string;

  @ForeignKey(() => AIEngine)
  @Column(DataType.UUID)
  declare aiEngineId: string;
}

export default Agent;
```

Correct:

```ts
import {
  AllowNull,
  Column,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
} from "@canmingir/link-express/sequelize";

@Table({
  tableName: "Knowledge",
  timestamps: true,
  underscored: true,
})
class Knowledge extends Model<KnowledgeAttributes> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.ENUM("QA", "URL", "TEXT", "TASK", "DATA"))
  declare type: string;
}

export default Knowledge;
```

New models are registered through `models/models.ts`, which `models/index.ts`
re-exports and `server.ts` initialises with `await models.init()`.

---

### `model/export-attributes-interface`

**Severity: `warn`**

Each model exports a named `XAttributes` interface and parameterises
`Model<XAttributes>`.

Rationale: it is the only place the row shape exists as a type. Functions that
return `.toJSON()` have nothing else to be typed against.

Incorrect:

```ts
class Agent extends Model {
  declare id: string;
  declare name: string;
}
```

`Model` without a type argument makes every attribute `any`.

Incorrect:

```ts
interface AgentAttributes {
  id: string;
  name: string;
}

class Agent extends Model<AgentAttributes> {}

export default Agent;
```

The interface is not exported, so nothing outside the file can type a
`.toJSON()` result against it.

Incorrect:

```ts
class Agent extends Model<any> {
  declare id: string;
}
```

Correct:

```ts
export interface AgentAttributes {
  id: string;
  name: string;
  icon: string;
  aiEngineId: string;
  teamId: string;
  description: string;
}

class Agent extends Model<AgentAttributes> {}
```

Correct:

```ts
export interface KnowledgeAttributes {
  id: string;
  type: "QA" | "URL" | "TEXT" | "TASK" | "DATA";
  url?: string;
  text?: string;
  question?: string;
  answer?: string;
  agentId?: string;
  teamId?: string;
}

class Knowledge extends Model<KnowledgeAttributes> {}
```

Correct:

```ts
import Knowledge, { KnowledgeAttributes } from "../models/Knowledge";

async function get({ knowledgeId }): Promise<KnowledgeAttributes> {
  const knowledge = await Knowledge.findByPk(knowledgeId);

  return knowledge.toJSON();
}
```

---

### `model/association-alias-matches-cardinality`

**Severity: `error`**

An `as:` alias names what you get when you traverse it — plural on `hasMany` and
`belongsToMany`, singular on `belongsTo` and `hasOne` — and is never reused for
both sides of a pair.

Rationale: the alias becomes the property name and the `include` key. A plural
alias on a `belongsTo` makes `agent.agents` return a single Project, which reads
as a bug at every call site and makes the `include: ["agents"]` in a query
ambiguous about which side is meant.

`models/models.ts` uses `as:` on only four associations, and one of them is
wrong.

Incorrect:

```ts
models.Project.hasMany(models.Agent, {
  foreignKey: "teamId",
  as: "agents",
});
models.Agent.belongsTo(models.Project, {
  foreignKey: "teamId",
  as: "agents",
});
```

The second line means "an Agent has one parent, reachable as `.agents`".

Incorrect:

```ts
models.Session.hasMany(models.Conversation, {
  foreignKey: "sessionId",
  as: "conversation",
});
```

A singular alias on `hasMany` makes `session.conversation` an array.

Incorrect:

```ts
models.Blueprint.hasMany(models.BlueprintMessage, {
  foreignKey: "blueprintId",
  as: "messages",
});
models.BlueprintMessage.belongsTo(models.Blueprint, {
  foreignKey: "blueprintId",
  as: "messages",
});
```

Correct:

```ts
models.Project.hasMany(models.Agent, {
  foreignKey: "teamId",
  as: "agents",
});
models.Agent.belongsTo(models.Project, {
  foreignKey: "teamId",
  as: "team",
});
```

Correct:

```ts
models.Session.hasMany(models.Conversation, {
  foreignKey: "sessionId",
  as: "conversations",
});
models.Conversation.belongsTo(models.Session, {
  foreignKey: "sessionId",
});
```

Correct:

```ts
models.Blueprint.hasMany(models.BlueprintMessage, {
  foreignKey: "blueprintId",
  as: "messages",
});
models.BlueprintMessage.belongsTo(models.Blueprint, {
  foreignKey: "blueprintId",
});
```

The other aliased associations in the file are already right — `messages` on
`Blueprint.hasMany(BlueprintMessage)`, and `supervisings` and `conversations` on
`Session.hasMany(...)`. Every other `belongsTo` in the file omits `as:` entirely
and takes the default singular model name, which is the simplest way to stay
correct.

`routes/agents.ts` reads `include: ["AIEngine"]` and
`association: "conversations"` — both defaults or correct aliases, so renaming
the Project alias is safe. Check `include` call sites when changing any alias,
because Sequelize fails at query time, not at startup.

---

### `model/associations-in-init`

**Severity: `warn`**

Associations are declared in `init()` in `src/models/models.ts`, grouped by pair
with the models obtained from `platform.getModules()`, never inside individual
model files.

Rationale: associations are inherently two-sided, and the platform owns the
Sequelize instance. Declaring them centrally after the platform has registered
its models is what avoids circular imports between model files and guarantees
both sides exist when the association is made. `server.ts` calls
`await models.init()` once, after `platform.init(config)`.

Incorrect:

```ts
import Project from "./Project";

@Table({ tableName: "Agent" })
class Agent extends Model<AgentAttributes> {
  @BelongsTo(() => Project)
  declare team: Project;
}
```

Incorrect:

```ts
import Agent from "./Agent";
import Project from "./Project";

Project.hasMany(Agent, { foreignKey: "teamId", as: "agents" });
```

Declared at module scope, this runs at import time — before
`platform.init(config)` has registered either model — and imports the two model
files into a cycle.

Incorrect:

```ts
async function init() {
  const {
    Postgres: { sequelize },
  } = await platform.getModules();

  sequelize.models.Blueprint.hasMany(sequelize.models.BlueprintMessage, {
    foreignKey: "blueprintId",
    as: "messages",
  });
}

await init();
await init();
```

Correct:

```ts
import platform from "@canmingir/link-express";

async function init() {
  const {
    Postgres: { sequelize },
  } = await platform.getModules();

  const models = sequelize.models;

  models.Blueprint.hasMany(models.BlueprintMessage, {
    foreignKey: "blueprintId",
    as: "messages",
  });
  models.BlueprintMessage.belongsTo(models.Blueprint, {
    foreignKey: "blueprintId",
  });
}
```

Correct:

```ts
await platform.init(config);
await models.init();
```

Correct:

```ts
async function init() {
  const {
    Postgres: { sequelize },
  } = await platform.getModules();

  const models = sequelize.models;

  models.Session.hasMany(models.Conversation, {
    foreignKey: "sessionId",
    as: "conversations",
  });
  models.Conversation.belongsTo(models.Session, { foreignKey: "sessionId" });

  models.Session.hasMany(models.Supervising, {
    foreignKey: "sessionId",
    as: "supervisings",
  });
  models.Supervising.belongsTo(models.Session, { foreignKey: "sessionId" });
}

export default { init };
```

The file groups each pair together with a short label. Keep that grouping — it is
what makes an asymmetric alias like the one above visible at a glance.

---

### `model/timestamps-match-consumers`

**Severity: `warn`**

A model sets `timestamps: true` if any consumer displays or sorts by
`createdAt` / `updatedAt`.

Rationale: `timestamps: false` means the columns do not exist, so `createdAt`
comes back `undefined` rather than erroring — the consumer just renders blank.
`models/Agent.ts` sets `timestamps: false`, while the dashboard's `AgentCard`
renders `{agent.createdAt}` under the agent name.

Incorrect:

```ts
@Table({
  tableName: "Agent",
  timestamps: false,
  underscored: true,
})
```

against a consumer that renders the column:

```tsx
<Typography variant="caption" color="text.secondary">
  {agent.createdAt}
</Typography>
```

Incorrect:

```ts
@Table({ tableName: "Session", timestamps: false })
```

against a sort that reads it:

```ts
sessions.sort(
  (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
);
```

`new Date(undefined).getTime()` is `NaN`, so the comparator returns `NaN` and the
order is left untouched — silently, with no error.

Correct:

```ts
@Table({
  tableName: "Agent",
  timestamps: true,
  underscored: true,
})
```

Correct:

```ts
@Table({ tableName: "Session", timestamps: true, underscored: true })
```

with the sort now reading a real column:

```ts
const sessions = await Session.findAll({
  where: { agentId },
  order: [["createdAt", "DESC"]],
});
```

Correct:

```ts
@Table({ tableName: "ModelPricing", timestamps: false, underscored: true })
```

`timestamps: false` is right here — `ModelPricing` is a static catalogue and no
consumer displays or sorts by a timestamp.

Either enable the timestamps or remove the consumer. Sorting code that already
depends on them — `new Date(a.createdAt).getTime()` in the sessions route and in
the `SUPERVISING_ANSWERED` handler — is a stronger reason than display.

---

## 6. LLM provider layer

### `llm/adapter-interface`

**Severity: `error`**

Every provider module in `lib/` default-exports an object satisfying
`LLMAdapter` from `lib/types.ts`, and callers use `generate` from `lib/llm.ts`
rather than importing a provider module directly.

Rationale: the provider is chosen at runtime from an environment variable. A
caller that imports `./openai` pins itself to one vendor and bypasses the
logging and source inference in `lib/llm.ts`.

Incorrect:

```ts
import openai from "../lib/openai";

const result = await openai.generate({ messages });
```

Incorrect:

```ts
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const result = await client.chat.completions.create({ model, messages });
```

Incorrect:

```ts
export default {
  generate: (params: GenerateParams) => client.messages.create(params),
  embed: (text: string) => client.embeddings.create({ input: text }),
  countTokens: (text: string) => encoder.encode(text).length,
};
```

An adapter with methods beyond `generate` is an adapter only some providers
implement, so any caller reaching for `embed` breaks on the next vendor switch.

Correct:

```ts
import { generate } from "../lib/llm";
```

Correct:

```ts
type LLMAdapter = {
  generate(params: GenerateParams): Promise<Record<string, unknown>>;
};
```

Correct:

```ts
import type { GenerateParams, LLMAdapter } from "./types";

const adapter: LLMAdapter = {
  async generate({ model, messages, max_tokens, meta }) {
    const response = await client.messages.create({
      model: model || DEFAULT_MODEL,
      messages,
      max_tokens: max_tokens ?? 4096,
    });

    logLLM({ provider: "ANTHROPIC", model, messages, response, meta });

    return response;
  },
};

export default adapter;
```

A new provider means a new module implementing that one method, plus a key in
`PROVIDER_LOADERS`. Nothing else changes.

---

### `llm/provider-from-env`

**Severity: `error`**

The active provider and model come from `PLATFORM_LLM`, in
`"<provider>/<model>"` form, never from a hardcoded vendor or model id.

Rationale: the six adapters exist so a deployment can switch vendors, and the
test suite can select `MOCK`, without a code change. A hardcoded model also goes
stale silently.

Incorrect:

```ts
const result = await generate({
  model: "gpt-4o-mini",
  messages,
});
```

Incorrect:

```ts
const provider = process.env.NODE_ENV === "test" ? "MOCK" : "OPENAI";
```

Incorrect:

```ts
const raw = process.env.PLATFORM_LLM || "local";
const provider = raw.split("/")[0].toUpperCase() as ProviderKey;

const adapter = await PROVIDER_LOADERS[provider]();
```

An unknown provider makes `PROVIDER_LOADERS[provider]` `undefined`, and the
failure is `is not a function` at the first generation rather than at startup.

Correct:

```ts
type ProviderKey =
  | "OPENAI"
  | "ANTHROPIC"
  | "OPENROUTER"
  | "BEDROCK"
  | "LOCAL"
  | "MOCK";

function parseProviderModel(raw: string): { provider: ProviderKey; model?: string } {
  const slashIdx = raw.indexOf("/");
  const providerPart = slashIdx === -1 ? raw : raw.slice(0, slashIdx);
  const modelPart = slashIdx === -1 ? undefined : raw.slice(slashIdx + 1);
  const provider = providerPart.trim().toUpperCase() as ProviderKey;

  if (!(provider in PROVIDER_LOADERS)) {
    throw new Error(
      `Unknown LLM provider "${providerPart}" in PLATFORM_LLM="${raw}". ` +
        `Expected "<provider>/<model>" (or just "<provider>") where provider is one of: ` +
        Object.keys(PROVIDER_LOADERS).join(", "),
    );
  }

  return { provider, model: modelPart };
}

const { provider, model: configuredModel } = parseProviderModel(
  process.env.PLATFORM_LLM || "local",
);
```

Correct:

```ts
const result = await generate({
  policy,
  content,
  json_format,
  meta,
});
```

No `model` at all — `lib/llm.ts` supplies `configuredModel` from `PLATFORM_LLM`.

Correct:

```
PLATFORM_LLM=anthropic/claude-sonnet-5
PLATFORM_LLM=openai/gpt-4o-mini
PLATFORM_LLM=mock
```

The error message names the variable, the received value and the valid set —
copy that shape for other environment parsing.

---

### `llm/lazy-provider-loaders`

**Severity: `warn`**

Providers are registered as dynamic-import thunks in a `Record<ProviderKey, ...>`
and resolved once into a memoized promise.

Rationale: static imports would load every vendor SDK — the Anthropic SDK, the
OpenAI SDK, and the AWS Bedrock client — into every process regardless of which
one is configured. The map also makes the valid provider set enumerable, which is
what the error message above uses.

Incorrect:

```ts
import anthropic from "./anthropic";
import bedrock from "./bedrock";
import openai from "./openai";

const adapters = { OPENAI: openai, ANTHROPIC: anthropic, BEDROCK: bedrock };
```

Incorrect:

```ts
async function getLLM(): Promise<LLMAdapter> {
  const mod = await PROVIDER_LOADERS[provider]();

  return mod.default;
}
```

Correct in shape but unmemoized — every generation re-resolves the module, and
the SDK's initialisation cost is paid on every call.

Incorrect:

```ts
const PROVIDER_LOADERS = {
  OPENAI: () => import("./openai"),
  ANTHROPIC: () => import("./anthropic"),
};
```

An untyped map loses the `ProviderKey` exhaustiveness check, so a new key in
`ProviderKey` compiles with no loader behind it.

Correct:

```ts
const PROVIDER_LOADERS: Record<ProviderKey, () => Promise<{ default: LLMAdapter }>> = {
  OPENAI: () => import("./openai"),
  ANTHROPIC: () => import("./anthropic"),
  OPENROUTER: () => import("./openrouter"),
  BEDROCK: () => import("./bedrock"),
  LOCAL: () => import("./local"),
  MOCK: () => import("./mock"),
};

let llmPromise: Promise<LLMAdapter> | null = null;

function getLLM(): Promise<LLMAdapter> {
  if (!llmPromise) {
    llmPromise = PROVIDER_LOADERS[provider]().then((mod) => mod.default);
  }
  return llmPromise;
}
```

Correct:

```ts
async function generate(params: DomainGenerateParams) {
  const llm = await getLLM();

  return llm.generate({ model: configuredModel, messages, meta: params.meta });
}
```

---

### `llm/log-every-generation`

**Severity: `warn`**

Calls to `generate` pass `meta` so the generation is recorded through
`lib/llmLog.ts`.

Rationale: `LLMLog` and `ModelPricing` back the dashboard's cost screen. A
generation without `meta` still runs, still costs money, and never appears in
`GET /llm-logs` — so the reported spend is quietly low.

Incorrect:

```ts
const response = await generate({ messages, responseFormat: "json" });
```

Incorrect:

```ts
async function chat({ agentId, sessionId, content }) {
  return generate({ policy, content });
}
```

The function has `agentId` and `sessionId` in hand and drops both, so the log row
cannot be attributed to an agent, a session or a team.

Incorrect:

```ts
const response = await generate({
  policy,
  content,
  meta: { teamId, source: "agents.ts:412" },
});
```

`source` is inferred by `lib/llm.ts` from the call site; passing it by hand
overwrites the inference with a value that goes stale on the next edit.

Correct:

```ts
const response = await agentFn.Blueprint({
  history,
  content,
  meta: { teamId: req.session.projectId },
});
```

Correct:

```ts
async function chat({ agentId, sessionId, content, meta }) {
  const agent = await Agent.findByPk(agentId);

  return generate({
    policy,
    content,
    meta: { ...meta, agentId, sessionId, teamId: agent.teamId },
  });
}
```

Correct:

```ts
await event.subscribe<{ taskId: string }>("TASK_CREATED", async ({ taskId }) => {
  const task = await Task.findByPk(taskId);

  await agentFn.task({
    taskId,
    meta: { taskId, agentId: task.agentId, teamId: task.teamId },
  });
});
```

`meta` is typed as `LLMMeta` in `lib/llmLog.ts` and threaded down from the route
or the subscription, so the log row carries the tenant. `lib/llm.ts` infers the
calling module for the `source` field on its own; do not pass that by hand.

---

## 7. Events

### `event/single-client`

**Severity: `error`**

The event client is `@canmingir/link-express/event/client`, and there is exactly
one.

Rationale: `server.ts` initialises the bus with `await event.init(config.event)`
and disconnects it on `SIGINT`/`SIGTERM`. A second client imported from a
different package is a separate, uninitialised connection — publishes go nowhere
and are not covered by the shutdown hook. `routes/agents.ts` imports one from
`node-event-test-package/client` today; it is unused, which is the only reason
nothing has broken.

Incorrect:

```ts
import { event } from "node-event-test-package/client";
```

Incorrect:

```ts
import { EventEmitter } from "events";

const bus = new EventEmitter();

bus.emit("SUPERVISING_ANSWERED", { supervisingId });
```

A process-local emitter reaches no other replica, and nothing in `app.ts`
subscribes to it.

Incorrect:

```ts
import { event } from "@canmingir/link-express/event/client";

await event.init(config.event);
await event.publish("TASK_CREATED", { taskId });
```

A second `init` from a route re-connects a bus that `server.ts` already
initialised and that the shutdown hook already owns.

Correct:

```ts
import { event } from "@canmingir/link-express/event/client";
```

Correct:

```ts
await event.init(config.event);

const shutdown = async () => {
  await event.disconnect();
  server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
```

Correct:

```ts
import { event } from "@canmingir/link-express/event/client";

async function answer({ supervisingId, answer }) {
  const supervising = await Supervising.findByPk(supervisingId);

  await supervising.update({ answer, status: "ANSWERED" });

  await event.publish("SUPERVISING_ANSWERED", { supervisingId });
}
```

---

### `event/subscriptions-in-app`

**Severity: `warn`**

Subscriptions are registered in `createApp()` in `src/app.ts`, typed with the
payload shape, and delegate immediately to a function.

Rationale: keeping them in one place makes the full set of asynchronous entry
points readable at a glance — there are seven — and the type argument is the only
contract the payload has, since the bus is otherwise untyped.

Incorrect:

```ts
event.subscribe("TASK_CREATED", async (payload: any) => {
  const task = await Task.findByPk(payload.taskId);
  const steps = await Step.findAll({ where: { taskId: task.id } });
});
```

Incorrect:

```ts
router.post("/", async (req, res) => {
  await event.subscribe("AGENT_CREATED", ({ agentId }) =>
    agentFn.warmUp({ agentId })
  );

  res.status(201).json(agent);
});
```

A subscription registered inside a handler is registered again on every request.

Incorrect:

```ts
await event.subscribe<{ stepId: string }>("STEP_ADDED", async ({ stepId }) => {
  const step = await Step.findByPk(stepId);
  const task = await Task.findByPk(step.taskId);

  const parameters = resolveParameterRefs(step.parameters, task.steps);
  const result = await actions.run(step.action, parameters);

  await step.update({ result, status: "COMPLETED" });
});
```

The handler is the implementation. It belongs in `functions/agent.ts`, where the
same logic can be reached from a route or a test.

Correct:

```ts
await event.subscribe<{ taskId: string }>("TASK_CREATED", ({ taskId }) =>
  agentFn.task({ taskId }),
);

await event.subscribe<{
  stepId: string;
  action: string;
  parameters: object;
  comment: string;
  resultScore?: number;
}>("STEP_ADDED", ({ stepId, action, parameters, comment, resultScore }) =>
  agentFn.step({ stepId, action, parameters, comment, resultScore }),
);
```

Correct:

```ts
function createApp() {
  const { express: app } = platform;

  app.use("/agents", agents);

  await event.subscribe<{ supervisingId: string }>(
    "SUPERVISING_ANSWERED",
    ({ supervisingId }) => supervisingFn.resume({ supervisingId }),
  );

  return app;
}
```

---

### `event/handlers-guard-and-report`

**Severity: `warn`**

A subscription handler catches its own failures, logs them, and publishes a
domain error event where a client is waiting on a result.

Rationale: a rejection inside a subscriber has no request to fail — it surfaces
as the `unhandledRejection` handler in `server.ts` and the user waits forever.
The `SESSION_USER_MESSAGED` handler is the model to copy.

Incorrect:

```ts
await event.subscribe<{ sessionId: string; content: string }>(
  "SESSION_USER_MESSAGED",
  async ({ agentId, sessionId, content }) => {
    await agentFn.chat({ agentId, sessionId, content });
  },
);
```

Incorrect:

```ts
await event.subscribe<{ taskId: string }>("TASK_CREATED", async ({ taskId }) => {
  try {
    await agentFn.task({ taskId });
  } catch (error) {
    platform.logger.error(error);
  }
});
```

Logged but not reported — the dashboard is polling this task's steps and will
poll forever.

Incorrect:

```ts
await event.subscribe<{ sessionId: string }>(
  "SESSION_USER_MESSAGED",
  async ({ agentId, sessionId, content }) => {
    try {
      await agentFn.chat({ agentId, sessionId, content });
    } catch {
      await event.publish("ERROR_OCCURRED", { sessionId, message: "error" });
    }
  },
);
```

Swallowing the error with a bare `catch` discards the domain code that
`functions/` threw, so the operator log has nothing and the user sees "error".

Correct:

```ts
await event.subscribe<{
  agentId: string;
  sessionId: string;
  content: string;
  blueprintId?: string;
}>("SESSION_USER_MESSAGED", async ({ agentId, sessionId, content, blueprintId }) => {
  try {
    if (!blueprintId) {
      await agentFn.chat({ agentId, sessionId, content });
    }
  } catch (error) {
    platform.logger.error(error);

    const errorMessage =
      error instanceof Error && error.message
        ? error.message
        : "An error occurred while processing your message.";

    await event.publish("ERROR_OCCURRED", { sessionId, message: errorMessage });
  }
});
```

Correct:

```ts
await event.subscribe<{ taskId: string }>("TASK_CREATED", async ({ taskId }) => {
  try {
    await agentFn.task({ taskId });
  } catch (error) {
    platform.logger.error({
      message: "Task planning failed",
      taskId,
      error_message: error instanceof Error ? error.message : String(error),
    });

    await event.publish("TASK_FAILED", {
      taskId,
      message: error instanceof Error ? error.message : "TASK_FAILED",
    });
  }
});
```

The failure is logged for operators and published for the waiting client.

---

## 8. Dataset and seeds

### `dataset/json-objects-only`

**Severity: `error`**

`src/dataset/**` and `src/seeds/**` contain `.json` files whose root value is an
object — no markdown, no prose, no non-object roots, no comments.

Rationale: these files are imported as modules and fed to models as structured
context. Prose in the directory is not machine-consumable, cannot be validated,
and cannot be diffed meaningfully. This rule is already stated in
`.github/copilot-api-reviewer-instructions.md`, which uses
`api/src/dataset/prompts.md` as its worked example of a violation — and that file
is still there.

Incorrect:

```
src/dataset/prompts.md
src/dataset/train/blueprint.md
src/dataset/train/chat.md
src/dataset/train/task-diamond.md
```

Incorrect:

```json
[{ "instruction": "do X" }]
```

Incorrect:

```json
"You are a planning assistant."
```

A string root is valid JSON and still wrong — nothing can add a field to it
without breaking every consumer.

Incorrect:

```json
{
  "items": []
}
```

with a trailing comment:

```json
{
  "items": []
}
```

Comments are not JSON. `build.prod.js` inlines these files verbatim, so a `//`
line fails at parse time in the production container only.

Correct:

```json
{
  "items": [
    {
      "id": "task-diamond",
      "input": { "type": "task" },
      "expected": { "priority": "high" }
    }
  ]
}
```

Correct:

```json
{
  "role": "system",
  "content": "You are a planning assistant that decomposes a goal into steps."
}
```

Correct:

```json
{
  "sequence": 2,
  "seed": [
    {
      "id": "00db1bd4-4829-40f2-8b99-d2e42342157e",
      "name": "subscription_agent"
    }
  ]
}
```

Documentation about a dataset belongs outside `dataset/` — next to the code that
consumes it, or in a README at the package root.

---

### `dataset/register-in-index`

**Severity: `warn`**

A dataset file is imported and named in `src/dataset/index.ts`, which
default-exports the assembled map that consumers read from.

Rationale: `index.ts` is where a JSON file becomes a named, typed piece of
context — including the `role: "system"` wrapper the model layer expects. A file
in `train/` that nothing imports is invisible, and four of them are in exactly
that state.

Incorrect:

```ts
import blueprintChat from "../dataset/train/blueprint-chat.json";
```

Reaching past the barrel from a function.

Incorrect:

```
src/dataset/train/blueprint.json
src/dataset/train/chat.json
src/dataset/train/task-diamond.json
```

present on disk, imported by nothing, and absent from `dataset/index.ts`.

Incorrect:

```ts
import blueprintChat from "./train/blueprint-chat.json";

export default {
  policy: { role: "system" as const, content: policy.content },
};
```

Imported at the top of the barrel and then never placed in the exported map — the
build inlines it and nothing reads it.

Correct:

```ts
import blueprintChat from "./train/blueprint-chat.json";
import knowledgeScore from "./train/knowledge-score.json";
import policy from "./policy.json";

export default {
  policy: {
    role: "system" as const,
    content: policy.content,
  },
  blueprintChat: {
    role: "system" as const,
    content: JSON.stringify(blueprintChat),
  },
  knowledgeScore: {
    role: "system" as const,
    content: JSON.stringify(knowledgeScore),
  },
};
```

Correct:

```ts
import dataset from "../dataset";

const response = await generate({
  policy: dataset.policy,
  dataset: dataset.blueprintChat,
  content,
  meta,
});
```

---

## 9. Dependencies and modules

### `module/no-duplicate-imports`

**Severity: `error`**

A module is imported once per file, and a binding name is declared once.

Rationale: two `import X from "..."` declarations for the same `X` is a lexical
redeclaration — invalid ESM. Node refuses to load the module with
`SyntaxError: Identifier 'X' has already been declared`. It survives here only
because esbuild and Bun are lenient and because `@typescript-eslint` disables the
base `no-redeclare` without replacing it, so `npm run lint` reports nothing.
`routes/agents.ts` has this today.

Incorrect:

```ts
import Blueprint from "../schemas/Blueprint";
import BlueprintModel from "../models/Blueprint";
import Agent from "../models/Agent";
import BlueprintModel from "../models/Blueprint";
import Joi from "joi";
```

Incorrect:

```ts
import { NotFoundError } from "@canmingir/link-express/error";
import { UnauthorizedError } from "@canmingir/link-express/error";
```

Two declarations, one module — legal ESM, but `sort-imports` scatters them and
the file's real dependency on the error module is no longer visible at a glance.

Incorrect:

```ts
import Agent from "../models/Agent";

const Agent = Joi.object({ name: Joi.string().required() });
```

A binding redeclared by a `const` is the same `SyntaxError` as a duplicated
import.

Correct:

```ts
import Agent from "../models/Agent";
import Blueprint from "../schemas/Blueprint";
import BlueprintModel from "../models/Blueprint";
import Joi from "joi";
```

Correct:

```ts
import {
  NotFoundError,
  UnauthorizedError,
} from "@canmingir/link-express/error";
```

Correct:

```ts
import Agent from "../models/Agent";
import AgentSchema from "../schemas/Agent";
```

Enabling `no-duplicate-imports`, or the typescript-eslint `no-redeclare`, in
`.eslintrc.json` would make this a build failure rather than a reading exercise.

---

### `deps/declare-what-you-import`

**Severity: `error`**

Every package imported from `src` or `server.ts` appears in
`api/package.json`.

Rationale: `joi` is imported by 23 files and `zod` by 2, and neither is declared.
They resolve today only because a transitive dependency hoists them. A dependency
bump that nests or drops either takes the whole API down — including every route,
since `joi` is the validation layer.

Incorrect:

```ts
import Joi from "joi";
```

with no `joi` entry in `package.json`.

Incorrect:

```ts
import { z } from "zod";
```

with no `zod` entry either — `schemas/Blueprint.ts` and `schemas/Node.ts` both
depend on a package nothing declares.

Incorrect:

```json
"devDependencies": {
  "joi": "^17.13.3"
}
```

`joi` is imported by 23 files under `src` and by `server.ts`. A runtime import
declared as a dev dependency is missing from the production install.

Correct:

```json
"dependencies": {
  "express": "^4.21.2",
  "joi": "^17.13.3",
  "sequelize": "^6.37.7",
  "uuid": "^11.1.0"
}
```

Correct:

```json
"dependencies": {
  "@aws-sdk/client-ec2": "^3.658.1",
  "puppeteer": "^23.5.0"
},
"devDependencies": {
  "@types/supertest": "^6.0.2",
  "jest": "^29.7.0",
  "supertest": "^6.2.3",
  "ts-jest": "^29.2.5"
}
```

Runtime imports in `dependencies`, spec-only imports in `devDependencies`.

The dashboard declares `joi` explicitly and does not even use it for validation;
the API uses it everywhere and does not declare it.

---

### `deps/no-test-packages-in-production`

**Severity: `error`**

Packages whose purpose is testing or experimentation do not belong in
`dependencies`, and must not be imported by `src`.

Rationale: `node-event-test-package` is a production dependency and is imported
by `routes/agents.ts`. Whatever it is, it ships to production, and it exposes an
`event` client that shadows the real one — see
[`event/single-client`](#eventsingle-client).

Incorrect:

```json
"dependencies": {
  "node-event-test-package": "^1.1.66"
}
```

Incorrect:

```ts
import { event } from "node-event-test-package/client";
```

Incorrect:

```json
"dependencies": {
  "supertest": "^6.2.3",
  "jest": "^29.7.0"
}
```

The test runner and its HTTP client ship in the production image for no reason,
and nothing stops `src` from importing them.

Correct:

```json
"devDependencies": {
  "supertest": "^6.2.3",
  "@types/supertest": "^6.0.2",
  "jest": "^29.7.0",
  "ts-jest": "^29.2.5"
}
```

Correct:

```ts
import request from "supertest";
import test from "@canmingir/link-express/test";
```

imported only from `src/routes/test/*.spec.ts` and `src/lib/test/*.spec.ts`.

Correct:

```ts
import { generate } from "../lib/llm";
```

with `PLATFORM_LLM=mock` selecting the in-repo `lib/mock.ts` adapter — test
behaviour without a test package.

---

## 10. Testing

### `test/cover-authorization-paths`

**Severity: `error`**

Every route that checks the session tenant has a spec asserting the rejection —
not only the happy path.

Rationale: the bypass documented in
[`http/authorize-before-mutating`](#httpauthorize-before-mutating) is invisible
to a happy-path test, because the happy path returns the same status either way.
A single "deletes another team's agent" case asserting `401` and then asserting
the agent still exists would have caught it. Ten spec files exist and none of
them exercises a cross-tenant path.

Incorrect:

```ts
describe("Agent service", () => {
  beforeEach(async () => test.reset());

  it("deletes an agent", async () => {
    test.project("e6d4744d-a11b-4c75-acad-e24a02903729");

    await request(app)
      .delete("/agents/72ef5b08-b4a9-42b7-bb0a-22d40e56798b")
      .expect(204);
  });
});
```

Only the happy path. The bypass in `routes/agents.ts` passes this spec.

Incorrect:

```ts
it("refuses to delete an agent from another team", async () => {
  test.project("cb16e069-6214-47f1-9922-1f7fe7629525");

  await request(app)
    .delete("/agents/72ef5b08-b4a9-42b7-bb0a-22d40e56798b")
    .expect(401);
});
```

Asserting the status alone passes today while the row is already gone.

Correct:

```ts
it("refuses to delete an agent from another team", async () => {
  test.project("cb16e069-6214-47f1-9922-1f7fe7629525");

  await request(app)
    .delete("/agents/72ef5b08-b4a9-42b7-bb0a-22d40e56798b")
    .expect(401);

  test.project("e6d4744d-a11b-4c75-acad-e24a02903729");

  const { body } = await request(app).get("/agents").expect(200);

  deepEqual(
    body.some((agent) => agent.id === "72ef5b08-b4a9-42b7-bb0a-22d40e56798b"),
    true
  );
});
```

Correct:

```ts
it("refuses to update an agent from another team", async () => {
  test.project("cb16e069-6214-47f1-9922-1f7fe7629525");

  await request(app)
    .put("/agents/72ef5b08-b4a9-42b7-bb0a-22d40e56798b")
    .send({
      name: "Hijacked",
      icon: ":5:",
      teamId: "cb16e069-6214-47f1-9922-1f7fe7629525",
      aiEngineId: "289a3c9a-f23b-421a-ac6e-f14052a2d57c",
      description: "Test description",
    })
    .expect(401);

  test.project("e6d4744d-a11b-4c75-acad-e24a02903729");

  const { body } = await request(app)
    .get("/agents/72ef5b08-b4a9-42b7-bb0a-22d40e56798b")
    .expect(200);

  deepEqual(body.name, "subscription_agent");
});
```

Correct:

```ts
it("does not list another team's communications", async () => {
  test.project("cb16e069-6214-47f1-9922-1f7fe7629525");

  const { body } = await request(app).get("/communications").expect(200);

  deepEqual(body.length, 0);
});
```

Assert both the status and that the resource survived. The status alone passes
today while the row is gone.

---

### `test/reset-between-cases`

**Severity: `error`**

Every spec calls `test.reset()` in `beforeEach`, and sets its tenant explicitly
with `test.project(id)` when the case depends on one.

Rationale: `config.postgres.uri` is `sqlite::memory:` with `sync: true`, so the
whole suite shares one database for the process. Without a reset, a create in one
case changes the row count another case asserts on, and the failure lands in an
unrelated file.

Incorrect:

```ts
describe("Agent service", () => {
  it("creates an agent", async () => {
    await request(app).post("/agents").send({ name: "Test Agent" }).expect(201);
  });

  it("lists agents", async () => {
    const { body } = await request(app).get("/agents").expect(200);
    deepEqual(body.length, 2);
  });
});
```

Incorrect:

```ts
describe("Agent service", () => {
  before(async () => test.reset());

  it("creates an agent", async () => {
    await request(app).post("/agents").send(agent).expect(201);
  });

  it("lists agents", async () => {
    const { body } = await request(app).get("/agents").expect(200);
    deepEqual(body.length, 2);
  });
});
```

`before` runs once for the whole describe, so the create in the first case is
still in the database when the second asserts a count.

Incorrect:

```ts
describe("Agent service", () => {
  beforeEach(async () => test.reset());

  it("lists agents", async () => {
    const { body } = await request(app).get("/agents").expect(200);

    deepEqual(body.length, 2);
  });
});
```

No `test.project(...)`, so the case asserts a count against whichever tenant the
previous file happened to leave selected.

Correct:

```ts
describe("Agent service", () => {
  beforeEach(async () => test.reset());

  it("lists agents", async () => {
    test.project("e6d4744d-a11b-4c75-acad-e24a02903729");

    const { body } = await request(app).get("/agents").expect(200);

    deepEqual(body.length, 2);
  });
});
```

Correct:

```ts
describe("Knowledge service", () => {
  beforeEach(async () => test.reset());

  it("creates QA knowledge", async () => {
    test.project("cb16e069-6214-47f1-9922-1f7fe7629525");

    const { body } = await request(app)
      .post("/knowledge")
      .send({ type: "QA", question: "Q", answer: "A", agentId })
      .expect(201);

    deepEqual(body.type, "QA");
  });

  it("lists knowledge", async () => {
    test.project("cb16e069-6214-47f1-9922-1f7fe7629525");

    const { body } = await request(app).get("/knowledge").expect(200);

    deepEqual(body.length, 1);
  });
});
```

The second case sees only the seeded row, because `test.reset()` undid the first.
`test.project(...)` sets `req.session.projectId` for the request, which is how a
spec chooses a tenant.

---

### `test/route-specs-with-supertest`

**Severity: `warn`**

Route behaviour is tested end-to-end through `supertest` against the real `app`,
asserting status with `.expect(n)` and body with `deepEqual`, while pure helpers
in `lib/` get unit specs beside them in `lib/test/`.

Rationale: routes are thin by rule, so the interesting behaviour is the
composition — validation, authorization, status mapping — which only a request
exercises. Pure logic is cheaper to test directly, which is why
`jsonParse.spec.ts`, `llm.spec.ts` and `parameterRefs.spec.ts` sit apart.

Incorrect:

```ts
it("creates an agent", async () => {
  const agent = await Agent.create({ name: "Test Agent" });

  deepEqual(agent.name, "Test Agent");
});
```

This tests Sequelize, not the route.

Incorrect:

```ts
it("rejects an agent without a name", async () => {
  const result = agentsRouter.stack[0].handle(
    { body: {}, session: { projectId: teamId } },
    fakeRes
  );

  deepEqual(fakeRes.statusCode, 400);
});
```

Calling the handler with a hand-built `req`/`res` skips the validation, auth and
error middleware that make the route's behaviour what it is.

Incorrect:

```ts
it("strips markdown fences", async () => {
  const { body } = await request(app)
    .post("/agents/blueprints")
    .send({ content: "```json\n{}\n```" })
    .expect(200);

  deepEqual(body.flow, {});
});
```

`jsonParse` is a pure helper. Testing it through an HTTP request makes the case
slow and makes a failure ambiguous between the parser and the route.

Correct:

```ts
import app from "../../app";
import { deepEqual } from "assert";
import request from "supertest";
import test from "@canmingir/link-express/test";

describe("Agent service", () => {
  beforeEach(async () => test.reset());

  it("creates an agent", async () => {
    const { body } = await request(app)
      .post("/agents")
      .send({
        name: "Test Agent",
        icon: ":5:",
        teamId: "cb16e069-6214-47f1-9922-1f7fe7629525",
        aiEngineId: "289a3c9a-f23b-421a-ac6e-f14052a2d57c",
        description: "Test description",
      })
      .expect(201);

    deepEqual(body.name, "Test Agent");
  });
});
```

Correct:

```ts
import { deepEqual } from "assert";
import { parseJsonContent } from "../jsonParse";

describe("jsonParse", () => {
  it("strips a markdown fence before parsing", () => {
    deepEqual(parseJsonContent('```json\n{"a":1}\n```', "OpenAI"), { a: 1 });
  });

  it("repairs an unbalanced closing brace", () => {
    deepEqual(parseJsonContent('{"a":{"b":1}', "OpenAI"), { a: { b: 1 } });
  });
});
```

Send only fields the schema defines — see
[`layer/schemas-and-models-are-the-contract`](#layerschemas-and-models-are-the-contract).

---

### `test/wire-the-runner`

**Severity: `error`**

A configured test runner is invoked by a script, because specs that nothing
executes are not tests.

Rationale: `jest.config.json` is correct — `ts-jest` preset, node environment,
`testMatch: ["**/*.spec.ts"]` — and 13 spec files exist across
`routes/test/` and `lib/test/`. No script runs jest. `npm test` runs `test.ts`,
which is a scratch script:

Incorrect:

```json
"scripts": {
  "test": "bun test.ts"
}
```

Incorrect:

```ts
import mcp from "./src/lib/mcp";

mcp.connect().then((mcp) => {
  console.log(mcp);
});
```

A scratch script standing in for the suite. Ten route specs and three lib specs
have never been executed by any automated run.

Incorrect:

```json
"scripts": {
  "test": "jest"
}
```

with `.github/workflows/test.yml` running only:

```yaml
- name: Check lint
  run: bun run lint
```

A script nothing invokes in CI is the same as no script.

Correct:

```json
"scripts": {
  "test": "jest",
  "lint": "eslint . --ext .ts",
  "typecheck": "tsc --noEmit"
}
```

Correct:

```yaml
- name: Check lint
  run: bun run lint

- name: Typecheck
  run: bun run typecheck

- name: Test
  run: bun run test
```

Correct:

```json
"scripts": {
  "test": "jest",
  "mcp:probe": "bun scripts/mcp-probe.ts"
}
```

The scratch script keeps its use, under a name of its own, out of the way of
`npm test`. Add the command to the `Test` workflow so it runs on every PR, as the
dashboard's lint and typecheck already do.

Expect existing specs to fail once they run. That is the point of turning them
on, and the failures are the backlog.

---

## 11. Secrets and configuration

### `secrets/no-hardcoded-credentials`

**Severity: `error`**

Credentials never appear as literals in source, and cloud SDK clients take them
from the environment or the provider's default credential chain.

Rationale: `src/actions/create_vm.ts` and `src/actions/terminate_vm.ts` each
construct an `EC2Client` with a literal `accessKeyId` and `secretAccessKey` — a
long-lived IAM user key pair, committed in TypeScript. No `.gitignore` rule can
ever catch a secret in a `.ts` file, it is in every clone and every build
artifact, and the obfuscated production bundle contains it too. The key grants
`RunInstances` and `TerminateInstances`, so an attacker gets both direct spend
and compute.

Incorrect:

```ts
function getClient(region?: string) {
  return new EC2Client({
    region: region || process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: "AKIA...",
      secretAccessKey: "...",
    },
  });
}
```

Incorrect:

```ts
const config = {
  jwt: {
    secret: "s3cr3t-signing-key",
  },
};
```

Incorrect:

```ts
const apiKey = process.env.OPENAI_API_KEY || "sk-proj-...";
```

A literal used as a fallback is still a committed credential, and it is the one
that runs whenever the variable is unset.

Correct:

```ts
function getClient(region?: string) {
  return new EC2Client({
    region: region || process.env.AWS_REGION || "us-east-1",
  });
}
```

Omitting `credentials` lets the AWS SDK use its default provider chain —
environment variables in development, and the task or instance role in
production, which is credential-free and rotates on its own.

Correct:

```ts
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

if (!accessKeyId || !secretAccessKey) {
  throw new Error("AWS_CREDENTIALS_MISSING");
}
```

Correct:

```ts
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error("OPENAI_API_KEY_MISSING");
}

const client = new OpenAI({ apiKey });
```

Remediation is the same order as the `.env` case and more urgent: **deactivate
the key pair in IAM first**, then remove the literals, then review CloudTrail for
use you did not authorise. The key is already public to everyone who has cloned
this repository.

---

### `secrets/no-env-files-in-git`

**Severity: `error`**

`.env` files are never committed — only a `.env.example` with empty or
placeholder values belongs in the repository.

Rationale: `api/.env` is tracked and contains six non-empty assignments,
including `OPENAI_API_KEY`, `OPENROUTER_API_KEY`, `JWT_SECRET` and
`OAUTH_CLIENT_SECRET`. `.gitignore` lists `.env`, but ignore rules do not apply
to files already tracked, so the entry has no effect and the file keeps
updating. `api/.env.test` is tracked too and is not matched by any ignore rule —
`.gitignore` lists only `.env.test.local`.

Anyone with repository access, and anyone who ever cloned it, has these values.
Deleting the file does not help on its own: the values remain in history.

Incorrect:

```
api/.env          tracked, 6 non-empty assignments
api/.env.test     tracked
```

Incorrect:

```
.env
.env.local
.env.test.local
```

An ignore list that misses `.env.test`, and that has no effect on `.env` because
that file is already tracked.

Incorrect:

```
OPENAI_API_KEY=sk-proj-live-value
JWT_SECRET=s3cr3t-signing-key
```

committed as `api/.env.example`. An example file with real values is a secret
file with a misleading name.

Correct:

```
ASR_ENDPOINT_URL=
OPENROUTER_API_KEY=
JWT_SECRET=
PLATFORM_LLM=local
OAUTH_CLIENT_SECRET=
OPENAI_API_KEY=
```

committed as `api/.env.example` — every key present, every value empty.

Correct:

```
.env
.env.*
!.env.example
```

Correct:

```
git rm --cached api/.env api/.env.test
```

run after the credentials have been rotated, not before.

Remediation order matters: **rotate every credential first**, because they are
already exposed; then `git rm --cached api/.env api/.env.test`; then fix the
ignore rules. Purging history is optional once the values are dead, and is a
separate decision because it rewrites shared refs.

`JWT_SECRET` deserves particular attention — it signs the sessions that
`app.ts` authorizes every request against, so an exposed value undermines
`authorization.verify` entirely.

---

### `secrets/never-log-or-return-credentials`

**Severity: `error`**

Credentials, tokens and authorization codes never reach a log line, an error
message, or a response body.

Rationale: `platform.logger` output is shipped to the metrics and logging
backends, and error messages travel to clients through `platform.error.handle`.
A token in either is a token in a system that was never scoped to hold one. The
MCP flow handles OAuth codes and refresh tokens, so this is live surface, and
`models/MCP.ts` stores a `refreshToken` column.

Incorrect:

```ts
platform.logger.info({ message: "MCP authorized", payload });

throw new Error(`Token exchange failed for ${JSON.stringify(payload)}`);
```

where `payload` carries `authorizationCode`.

Incorrect:

```ts
const mcp = await MCP.findByPk(id);

res.json(mcp);
```

returning the row including `refreshToken`.

Incorrect:

```ts
platform.logger.error({
  message: "MCP request failed",
  headers: req.headers,
});
```

`req.headers` carries the bearer token on every authenticated request.

Correct:

```ts
platform.logger.info({ message: "MCP authorized", mcpId: mcp.id, agentId });

throw new Error("MCP_TOKEN_EXCHANGE_FAILED");
```

Correct:

```ts
const mcp = await MCP.findByPk(id, {
  attributes: { exclude: ["refreshToken"] },
});

res.json(mcp);
```

Correct:

```ts
platform.logger.error({
  message: "MCP request failed",
  mcpId: mcp.id,
  status: response.status,
});
```

`routes/agents.ts` already demonstrates the exclusion idiom for a different
reason — `attributes: { exclude: ["aiEngineId"] }` — so the mechanism is
established.

---

### `config/env-for-secrets-config-for-shape`

**Severity: `warn`**

`config.ts` holds non-secret shape — hostnames, feature toggles, provider
endpoints, public client ids — while anything secret is read from `process.env`.

Rationale: the `config.*.ts` variants are committed and swapped per deployment,
so they are readable by everyone with repository access. Public identifiers
belong there; signing keys and API keys do not.

Incorrect:

```ts
const config = {
  project: {
    oauth: {
      providers: {
        github: {
          clientId: "Ov23lihgDzlqJ1gnZxX3",
          clientSecret: "ghs_liveSecretValueHere",
        },
      },
    },
  },
};
```

Incorrect:

```ts
const config = {
  postgres: {
    uri: "postgres://api:hunter2@db.internal:5432/greycollar",
  },
};
```

Incorrect:

```ts
const config = {
  metrics: {
    url: process.env.METRICS_URL,
    enabled: process.env.METRICS_ENABLED === "true",
  },
};
```

Non-secret shape read from the environment is the mirror mistake — the file that
should document the deployment's shape now documents nothing, and a missing
variable disables metrics silently.

Correct:

```ts
const config = {
  project: {
    name: "greycollar-api",
    oauth: {
      providers: {
        github: {
          tokenUrl: "https://github.com/login/oauth/access_token",
          userUrl: "https://api.github.com/user",
          clientId: "Ov23lihgDzlqJ1gnZxX3",
          userIdentifier: "id",
        },
      },
    },
  },
  postgres: {
    uri: "sqlite::memory:",
    sync: true,
  },
};
```

Correct:

```ts
const { provider, model: configuredModel } = parseProviderModel(
  process.env.PLATFORM_LLM || "local",
);
```

Correct:

```ts
const config = {
  metrics: {
    url: "http://pushgateway.internal:9091",
    enabled: true,
  },
};

const clientSecret = process.env.OAUTH_CLIENT_SECRET;

if (!clientSecret) {
  throw new Error("OAUTH_CLIENT_SECRET_MISSING");
}
```

An OAuth `clientId` is public by design and is correctly in `config.ts`. The
matching secret is not, and must not be.

---

## 12. Verification and repository hygiene

### `ci/verify-the-api`

**Severity: `error`**

Lint, type check and tests run against `api/` on every pull request.

Rationale: none of them do today. Root `lint` is `bun run lint:dashboard`, root
`typecheck` is `typecheck:dashboard`, and no `lint:api` or `typecheck:api`
script exists — so the `Test` workflow, which runs those two root scripts, never
touches this package. The only API step anywhere in CI is `build:api`, and that
is esbuild, which does not type check.

The absence is not abstract. It is why every known violation survived: an
invalid duplicate import, an authorization bypass, specs asserting fields the
schema dropped, and two sets of committed credentials.

Incorrect:

```json
"lint:dashboard": "cd ./dashboard && bun run lint",
"lint": "bun run lint:dashboard",
"typecheck:dashboard": "cd ./dashboard && bun run typecheck",
"typecheck": "bun run typecheck:dashboard"
```

Incorrect:

```yaml
- name: Build API
  run: bun run build:api
```

The only API step in CI. esbuild strips types without checking them, so this
passes on code `tsc` would reject.

Incorrect:

```json
"lint": "bun run lint:dashboard || bun run lint:api"
```

`||` runs the API lint only when the dashboard's fails, and reports success when
either passes.

Correct:

```json
"lint:api": "cd ./api && bun run lint",
"lint:dashboard": "cd ./dashboard && bun run lint",
"lint": "bun run lint:api && bun run lint:dashboard",
"typecheck:api": "cd ./api && bun run typecheck",
"typecheck:dashboard": "cd ./dashboard && bun run typecheck",
"typecheck": "bun run typecheck:api && bun run typecheck:dashboard",
"test:api": "cd ./api && bun run test",
"test": "bun run test:api"
```

Correct:

```yaml
- name: Check lint
  run: bun run lint

- name: Typecheck
  run: bun run typecheck

- name: Test
  run: bun run test
```

Turn these on one at a time and expect each to fail on first run. The failures
are the existing debt, not a reason to leave the gate off.

---

### `ts/run-the-type-checker`

**Severity: `error`**

`tsc --noEmit` runs in CI, because a `strict` compiler setting that nothing
executes is documentation, not enforcement.

Rationale: `api/tsconfig.json` sets `strict: true` — stricter than the
dashboard, which sets `strict: false` — along with `noEmit: true`. There is no
`typecheck` script and nothing invokes `tsc`. The production build goes through
esbuild, which strips types without checking them. Every strictness guarantee in
that config is currently unenforced.

Incorrect:

```json
"scripts": {
  "dev": "bun --watch server.ts",
  "build": "node build.prod.js",
  "lint": "eslint . --ext .ts"
}
```

with `tsconfig.json` claiming:

```json
{
  "strict": true,
  "noEmit": true
}
```

Incorrect:

```json
"scripts": {
  "typecheck": "tsc --noEmit --skipLibCheck --noImplicitAny false"
}
```

A script that turns off the settings the config declares is enforcement in name
only.

Incorrect:

```json
"scripts": {
  "build": "node build.prod.js"
}
```

as the only pre-deploy gate. esbuild transpiles; it does not type check.

Correct:

```json
"scripts": {
  "typecheck": "tsc --noEmit",
  "lint": "eslint . --ext .ts",
  "test": "jest"
}
```

Correct:

```json
{
  "compilerOptions": {
    "strict": true,
    "noEmit": true,
    "noImplicitAny": false,
    "strictPropertyInitialization": false,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

with `bun run typecheck` in the `Test` workflow.

Note the two escape hatches already set — `noImplicitAny: false` and
`strictPropertyInitialization: false`. The second is legitimate: Sequelize
models declare columns through decorators, so the compiler cannot see them
initialised. The first is not, and should be the next setting turned on once the
checker actually runs.

---

### `repo/no-generated-artifacts-in-git`

**Severity: `warn`**

Logs, build output and runtime artifacts are ignored, not committed.

Rationale: `api/logs/email-service.log` is tracked. Log files change on every
run, so they produce noise in every diff, they can capture request data or
credentials as the application evolves, and they grow without bound in history.

Incorrect:

```
api/logs/email-service.log     tracked
```

Incorrect:

```
/node_modules
/coverage
/build
```

`build.prod.js` writes to `dist`, which nothing ignores, so a local production
build leaves the whole output staged.

Incorrect:

```
api/dist/server.js             tracked
api/coverage/lcov.info         tracked
```

Correct:

```
/node_modules
/coverage
/build
/dist
/logs
.env
.env.*
!.env.example
```

Correct:

```
git rm -r --cached api/logs
```

followed by the ignore rule, so the file stops updating in every diff.

---

### `build/no-dead-tsconfig`

**Severity: `warn`**

Configuration files are referenced by something, or removed.

Rationale: `api/tsconfig.build.json` extends the base config, sets
`outDir: "./dist"`, `noEmit: false` and `removeComments: true`, and is referenced
by nothing — not `package.json`, not `build.prod.js`, not the `Dockerfile`, not
any workflow. The real build is esbuild-based and reads its compiler options
inline. Anyone editing `tsconfig.build.json` to change build behaviour would
change nothing.

Incorrect:

```js
await esbuild.build({
  tsconfigRaw: {
    compilerOptions: {
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
    },
  },
});
```

with `tsconfig.build.json` sitting beside it, referenced by nothing.

Incorrect:

```ts
import config from "./config";
```

with `config.kafka.ts` and `config.txq.ts` reachable only through commented-out
import lines.

Correct:

```js
await esbuild.build({
  entryPoints: tsFiles,
  tsconfig: path.join(ROOT, "tsconfig.build.json"),
  outdir: OUT,
});
```

Correct:

```
git rm api/tsconfig.build.json
```

when the esbuild inline options are the real contract and the file adds nothing.

Correct:

```ts
const config =
  process.env.PLATFORM_EVENT === "kafka"
    ? await import("./config.kafka")
    : await import("./config");
```

A variant config that a real branch selects is live, not dead. The same test
applies to `config.kafka.ts` and `config.txq.ts`.

---

## 13. Build and release

### `build/json-imports-must-be-inlinable`

**Severity: `error`**

JSON is imported with a single-line default import —
`import name from "./path.json";` — and nothing else: no named imports from
JSON, no multi-line import statements, no dynamic JSON requires.

Rationale: `build.prod.js` inlines JSON at build time with a line-anchored
regex, and separately **refuses to copy JSON files into `dist` unless they are
under `seeds/`**:

```js
const isJson = entry.name.endsWith(".json");
const isInSeeds = srcFull.includes(path.sep + "seeds" + path.sep);
if (isJson && !isInSeeds) continue;
```

So an import the regex does not match survives as a real import against a file
that was never copied. It works in development under Bun and fails only in the
production container, at require time.

Incorrect:

```ts
import {
  items,
} from "./train/blueprint.json";
```

Incorrect:

```ts
import { actions } from "./actions.json";
```

Incorrect:

```ts
const dataset = require(`./train/${name}.json`);
```

Incorrect:

```ts
import policy from "./policy.json" with { type: "json" };
```

None of these match the plugin's line-anchored pattern, and none of the files
reach `dist`.

Correct:

```ts
import Blueprint from "./train/blueprint.json";
import blueprintChat from "./train/blueprint-chat.json";
import policy from "./policy.json";
```

Correct:

```ts
import actions from "./actions.json";
```

Correct:

```ts
import blueprint from "./train/blueprint.json";

const items = blueprint.items;
```

Destructure after the import rather than inside it. All 21 dataset imports and
the actions import are in this form today. Keep them that way, or make the build
copy JSON unconditionally and drop the plugin.

---

### `build/accurate-build-output`

**Severity: `warn`**

Build logs name the directory the build actually writes.

Rationale: `build.prod.js` sets `OUT = path.join(ROOT, "dist")` and the
`Dockerfile` copies `./api/dist/`, which agree. The console output does not — it
announces `dist-obfuscated` three times and its step counter runs `[1/3]`,
`[2/3]`, `[3/4]`, `[4/4]`. Anyone debugging a deploy follows the messages, not
the source.

Incorrect:

```js
const OUT = path.join(ROOT, "dist");

console.log("\n[1/3] Cleaning dist-obfuscated...");
console.log("\n[3/4] Copying non-TS assets...");
console.log("\nBuild complete! Output in ./dist-obfuscated/");
console.log("Docker will copy dist-obfuscated/ → /app/api/");
```

Incorrect:

```js
console.log("\n[1/3] Cleaning...");
console.log("\n[2/3] Compiling...");
console.log("\n[3/4] Copying non-TS assets...");
console.log("\n[4/4] Obfuscating...");
```

A step counter that changes its own denominator mid-run.

Incorrect:

```js
const OUT = process.env.BUILD_OUT || path.join(ROOT, "dist");

console.log("Build complete! Output in ./dist/");
```

Correct:

```js
const OUT = path.join(ROOT, "dist");

console.log(`\n[1/4] Cleaning ${path.relative(ROOT, OUT)}...`);
console.log("\n[2/4] Compiling TypeScript...");
console.log("\n[3/4] Copying non-TS assets...");
console.log("\n[4/4] Obfuscating...");
console.log(`\nBuild complete! Output in ./${path.relative(ROOT, OUT)}/`);
```

Correct:

```js
const OUT = process.env.BUILD_OUT || path.join(ROOT, "dist");

console.log(`Build complete! Output in ./${path.relative(ROOT, OUT)}/`);
```

Derive the message from the constant so the two cannot drift again.

---

### `build/obfuscation-costs-diagnostics`

**Severity: `warn`**

Know what the obfuscator takes away, and keep source maps or a symbol map for
anything you intend to debug.

Rationale: `build.prod.js` runs every emitted file through
`javascript-obfuscator` with `controlFlowFlattening`, `deadCodeInjection` at
0.4, hexadecimal identifiers and RC4 string arrays. That is a deliberate choice
for shipped server code, and it directly degrades two things this codebase
relies on: the `error_stack` field that `server.ts` logs on every uncaught
exception, and the `inferSource()` helper in `lib/llm.ts`, which walks
`Error.captureStackTrace` to label LLM log rows with their calling module.

Incorrect:

```js
const OBFUSCATOR_OPTIONS = {
  controlFlowFlattening: true,
  deadCodeInjection: true,
  identifierNamesGenerator: "hexadecimal",
};
```

with `server.ts` still logging `err.stack` as if it were readable.

Incorrect:

```ts
function inferSource(): string {
  const stack = {} as { stack?: string };
  Error.captureStackTrace(stack, inferSource);

  return path.basename(stack.stack.split("\n")[2]);
}
```

After hexadecimal renaming and control-flow flattening this returns an obfuscated
filename, so every `LLMLog.source` value is noise.

Correct:

```js
await esbuild.build({
  entryPoints: tsFiles,
  sourcemap: "external",
  outdir: OUT,
});
```

with the `.map` files retained by the build job and excluded from the image.

Correct:

```ts
const response = await generate({
  content,
  json_format,
  meta: { teamId, source: "functions/agent.blueprint" },
});
```

An explicit source label instead of an inferred one.

Correct:

```js
const OBFUSCATOR_OPTIONS = {
  controlFlowFlattening: false,
  deadCodeInjection: false,
  identifierNamesGenerator: "mangled",
  stringArray: true,
};
```

Whichever way, decide it deliberately — the current setup pays for stack traces
that the build then makes unreadable.

---

## 14. Actions subsystem

### `action/registry-entry-per-action`

**Severity: `error`**

An agent-invocable capability is two things that must stay in step: an entry in
`src/actions/actions.json` and a module in `src/actions/` default-exporting
`{ run }`, whose filename is the entry's `lib` field.

Rationale: `actions/index.ts` resolves by looking the name up in the JSON, and
the model chooses actions from the same JSON. A module without an entry is
unreachable; an entry without a module resolves to a name that fails at call
time, after the model has already committed to the step.

Incorrect:

```
src/actions/summarize_thread.ts     module, no registry entry
```

`actions.find(...)` returns `undefined` and the action never appears in the
model's option list.

Incorrect:

```json
{
  "action": "PLATFORM:summarize_thread",
  "lib": "summarize_thread",
  "description": "Summarize a conversation thread."
}
```

with no `src/actions/summarize_thread.ts`. The name resolves, the model commits
the step, and the import fails at call time.

Incorrect:

```json
{
  "action": "PLATFORM:translate",
  "lib": "translator",
  "description": "Translate text."
}
```

with the module at `src/actions/translate.ts`. `lib` must be the filename.

Correct:

```json
{
  "action": "PLATFORM:translate",
  "lib": "translate",
  "description": "Translate text into Turkish, English, and Spanish, returned as separate fields so each language can be individually bound to downstream steps.",
  "icon": "mdi:translate",
  "inputSchema": {
    "type": "object",
    "properties": {
      "text": { "type": "string", "description": "The text to translate." }
    },
    "required": ["text"]
  }
}
```

Correct:

```ts
async function run({
  parameters: { text },
  meta,
}: {
  parameters: { text: string };
  meta?: LLMMeta;
}) {
  return result;
}

export default { run };
```

Correct:

```ts
function find(action: string) {
  return actions.find((a) => a.action === action);
}
```

Correct:

```json
{
  "action": "PLATFORM:ask_supervisor",
  "lib": "ask_supervisor",
  "description": "Escalate a question to a human supervisor and wait for the answer.",
  "blocking": true
}
```

Names are namespaced `PLATFORM:<lib>`. An action that must never be offered for a
non-blocking step is excluded in `listNonBlockings`, as `PLATFORM:ask_supervisor`
is.

---

### `action/return-errors-do-not-throw`

**Severity: `warn`**

An action returns an object with an `error` string for expected failures rather
than throwing, and its `outputSchema` declares that `error` field.

Rationale: actions run inside a model-driven step loop, not inside a request. A
thrown error aborts the whole task; a returned `{ error }` becomes the step
result, which the agent can read and act on. This is the opposite of the
convention in `functions/`, and deliberately so — see
[`error/throw-domain-codes`](#errorthrow-domain-codes).

Incorrect:

```ts
async function run({ parameters: { text } }) {
  if (!text) {
    throw new Error("TEXT_REQUIRED");
  }
}
```

Incorrect:

```ts
async function run({ parameters: { instanceId } }) {
  const instance = await describeInstance(instanceId);

  if (!instance) {
    throw new NotFoundError("INSTANCE_NOT_FOUND");
  }
}
```

`NotFoundError` is the right convention in `functions/` and the wrong one here —
it aborts the task instead of becoming a step result the agent can react to.

Incorrect:

```ts
async function run({ parameters: { text } }) {
  if (!text) {
    return null;
  }
}
```

`null` gives the agent nothing to read and nothing an `outputSchema` can
describe.

Correct:

```ts
async function run({ parameters: { text }, meta }) {
  if (!text) {
    return { error: "text is required" };
  }

  const result = await generate({ content: text, json_format, meta });

  return result as { tr: string; en: string; es: string };
}
```

Correct:

```json
"outputSchema": {
  "type": "object",
  "properties": {
    "tr": { "type": "string", "description": "Turkish translation." },
    "error": { "type": "string" }
  }
}
```

Correct:

```ts
async function run({ parameters: { instanceId }, meta }) {
  if (!meta?.teamId) {
    return { error: "teamId is required to terminate infrastructure" };
  }

  const instance = await describeInstance(instanceId);

  if (!instance) {
    return { error: `no instance found with id ${instanceId}` };
  }

  return { instanceId, state: "shutting-down" };
}
```

Unexpected failures — a provider outage, a malformed response — may still throw
and be handled upstream. The rule is about failures the action anticipates.

---

### `action/schemas-describe-io`

**Severity: `warn`**

Every registry entry carries an `inputSchema` and an `outputSchema` in JSON
Schema form, with a `description` on each property, and `required` listing the
mandatory inputs.

Rationale: these schemas are the only thing the model sees. A parameter without
a description is a parameter the model guesses at, and an `outputSchema` is what
lets a later step bind to a specific field of an earlier result — which is what
`lib/parameterRefs.ts` resolves.

Incorrect:

```json
{
  "action": "PLATFORM:translate",
  "lib": "translate",
  "description": "Translates text"
}
```

No schemas, so nothing downstream can reference a field of the result.

Incorrect:

```json
{
  "action": "PLATFORM:create_vm",
  "lib": "create_vm",
  "description": "Creates a VM",
  "inputSchema": {
    "type": "object",
    "properties": {
      "name": { "type": "string" },
      "instanceType": { "type": "string" },
      "region": { "type": "string" }
    }
  }
}
```

No property descriptions and no `required`, so the model guesses what
`instanceType` accepts and whether `name` may be omitted.

Incorrect:

```json
{
  "action": "PLATFORM:scrapper",
  "lib": "scrapper",
  "inputSchema": { "type": "object" },
  "outputSchema": { "type": "string" }
}
```

A non-object `outputSchema` has no fields, so no later step can bind to part of
the result.

Correct:

```json
{
  "action": "PLATFORM:translate",
  "lib": "translate",
  "description": "Translate text into Turkish, English, and Spanish, returned as separate fields so each language can be individually bound to downstream steps.",
  "icon": "mdi:translate",
  "inputSchema": {
    "type": "object",
    "properties": {
      "text": { "type": "string", "description": "The text to translate." }
    },
    "required": ["text"]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "tr": { "type": "string", "description": "Turkish translation." },
      "en": { "type": "string", "description": "English translation." },
      "es": { "type": "string", "description": "Spanish translation." },
      "error": { "type": "string" }
    }
  }
}
```

Correct:

```json
{
  "action": "PLATFORM:create_vm",
  "lib": "create_vm",
  "description": "Launch an EC2 instance tagged to the calling team, returning its id and public address so a later step can connect to it.",
  "icon": "mdi:server-plus",
  "inputSchema": {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "description": "Name tag applied to the instance."
      },
      "instanceType": {
        "type": "string",
        "description": "EC2 instance type, such as t3.micro. Defaults to t3.micro."
      }
    },
    "required": ["name"]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "instanceId": {
        "type": "string",
        "description": "Id of the launched instance."
      },
      "publicDnsName": {
        "type": "string",
        "description": "Public DNS name, empty until the instance is running."
      },
      "error": { "type": "string" }
    }
  }
}
```

The `description` explains the shape *and why it is shaped that way* — "returned
as separate fields so each language can be individually bound to downstream
steps". Write descriptions for the model, not for a human skimming a list.

---

### `action/scope-cloud-actions-to-tenant`

**Severity: `error`**

An action that provisions or destroys billable infrastructure receives `meta`,
tags the resource with the owning team, and is authorized against that team
before it runs.

Rationale: `create_vm.ts` takes `{ parameters }` and no `meta` at all, so a
launched EC2 instance carries no link back to the team whose agent asked for it.
Nothing can attribute the cost, nothing can clean up a team's instances when the
team is deleted, and nothing prevents one tenant's agent from launching compute
charged to everyone. Compare the LLM path, where `meta` carries `teamId` into
every log row precisely so spend is attributable.

Incorrect:

```ts
async function run({
  parameters: { name, instanceType = "t3.micro", region },
}: {
  parameters: { name: string; instanceType?: string; region?: string };
}) {
  const client = getClient(region);

  const { Instances } = await client.send(
    new RunInstancesCommand({ InstanceType: instanceType, MinCount: 1, MaxCount: 1 }),
  );
}
```

Incorrect:

```ts
async function run({ parameters: { instanceId }, meta }) {
  const client = getClient();

  await client.send(new TerminateInstancesCommand({ InstanceIds: [instanceId] }));

  return { instanceId, state: "shutting-down" };
}
```

`meta` is accepted and never checked, so an instance id from one tenant's agent
destroys another tenant's machine.

Incorrect:

```ts
async function run({ parameters: { name }, meta }) {
  const { Instances } = await client.send(
    new RunInstancesCommand({
      MinCount: 1,
      MaxCount: 1,
      TagSpecifications: [
        {
          ResourceType: "instance",
          Tags: [{ Key: "Name", Value: name }],
        },
      ],
    }),
  );
}
```

Tagged, but not with the owner — nothing can attribute the cost or reap the
instance when the team is deleted.

Correct:

```ts
async function run({
  parameters: { name, instanceType = "t3.micro", region },
  meta,
}: {
  parameters: { name: string; instanceType?: string; region?: string };
  meta?: LLMMeta;
}) {
  if (!meta?.teamId) {
    return { error: "teamId is required to provision infrastructure" };
  }

  const { Instances } = await client.send(
    new RunInstancesCommand({
      InstanceType: instanceType,
      MinCount: 1,
      MaxCount: 1,
      TagSpecifications: [
        {
          ResourceType: "instance",
          Tags: [
            { Key: "Name", Value: name },
            { Key: "greycollar:teamId", Value: meta.teamId },
          ],
        },
      ],
    }),
  );
}
```

Correct:

```ts
async function run({ parameters: { instanceId }, meta }) {
  if (!meta?.teamId) {
    return { error: "teamId is required to terminate infrastructure" };
  }

  const { Reservations } = await client.send(
    new DescribeInstancesCommand({
      InstanceIds: [instanceId],
      Filters: [
        { Name: "tag:greycollar:teamId", Values: [meta.teamId] },
      ],
    }),
  );

  if (!Reservations?.length) {
    return { error: `no instance found with id ${instanceId}` };
  }

  await client.send(new TerminateInstancesCommand({ InstanceIds: [instanceId] }));

  return { instanceId, state: "shutting-down" };
}
```

`terminate_vm.ts` needs the mirror check — refuse to terminate an instance whose
`greycollar:teamId` tag does not match the caller's team. Without it, an
instance id is enough to destroy another tenant's machine, which is the same
class of hole as
[`http/authorize-before-mutating`](#httpauthorize-before-mutating) but with a
larger blast radius.

---

### `action/release-external-resources`

**Severity: `error`**

An action that opens a browser, a connection or a handle releases it in a
`finally`, on every path including thrown errors.

Rationale: actions run inside a long-lived server process, so a leak accumulates
until the process dies. A Puppeteer browser is the expensive case — each one is
a Chromium process with its own memory.

Incorrect:

```ts
const browser = await puppeteer.launch();
const page = await browser.newPage();

const content = await page.evaluate(() => document.body.innerText);

await browser.close();

return { content };
```

Any throw between `launch` and `close` leaks a Chromium process.

Incorrect:

```ts
const browser = await puppeteer.launch();

try {
  for (const url of urls) {
    const page = await browser.newPage();

    await page.goto(url);
    results.push(await page.evaluate(() => document.body.innerText));
  }
} finally {
  await browser.close();
}
```

The browser is released; the pages are not. One tab per URL stays open for the
whole loop.

Incorrect:

```ts
const client = await mcp.connect(server);

const tools = await client.listTools();

await client.close();

return { tools };
```

Correct:

```ts
const browser = await puppeteer.launch({ headless: true });

try {
  const page = await browser.newPage();

  return await scrape(page);
} finally {
  await browser.close();
}
```

Correct:

```ts
const browser = await puppeteer.launch({ headless: true });

try {
  for (const url of urls) {
    const page = await browser.newPage();

    try {
      await page.goto(url);
      results.push(await page.evaluate(() => document.body.innerText));
    } finally {
      await page.close();
    }
  }

  return { results };
} finally {
  await browser.close();
}
```

Correct:

```ts
const client = await mcp.connect(server);

try {
  return { tools: await client.listTools() };
} finally {
  await client.close();
}
```

`scrapper.ts` already does exactly this, closing individual pages inside the loop
and the browser in the outer `finally`. It is the pattern to copy.

Provisioned infrastructure is the other half of this rule and cannot be handled
with `finally` — a VM outlives the request. Pair every `create_vm` with a
recorded owner and a reaping path, per the rule above.

---

### `action/no-hardcoded-infrastructure-ids`

**Severity: `warn`**

Account-specific resource identifiers — launch templates, subnets, security
groups, AMIs, buckets — come from configuration or parameters, not from
literals.

Rationale: a hardcoded id ties the code to one AWS account and one region. It
cannot be deployed to staging, and it fails opaquely when the resource is
replaced.

Incorrect:

```ts
new RunInstancesCommand({
  LaunchTemplate: {
    LaunchTemplateId: "lt-0bb60b7532394e758",
    Version: "$Latest",
  },
  ImageId: imageId,
});
```

Incorrect:

```ts
new RunInstancesCommand({
  SubnetId: "subnet-0f3a1c9d2e7b4a610",
  SecurityGroupIds: ["sg-04c8e1b2f9a37d5e2"],
});
```

Incorrect:

```ts
const client = new S3Client({ region: "us-east-1" });

await client.send(
  new PutObjectCommand({ Bucket: "greycollar-prod-artifacts", Key: key })
);
```

Correct:

```ts
const launchTemplateId = process.env.AWS_LAUNCH_TEMPLATE_ID;

if (!launchTemplateId) {
  return { error: "AWS_LAUNCH_TEMPLATE_ID is not configured" };
}

new RunInstancesCommand({
  LaunchTemplate: { LaunchTemplateId: launchTemplateId, Version: "$Latest" },
  ImageId: imageId,
});
```

Correct:

```ts
async function resolveLatestAmazonLinuxAmi(client: EC2Client) {
  const { Images } = await client.send(
    new DescribeImagesCommand({
      Owners: ["amazon"],
      Filters: [{ Name: "name", Values: ["al2023-ami-*-x86_64"] }],
    }),
  );

  return Images.sort((a, b) => b.CreationDate.localeCompare(a.CreationDate))[0]
    .ImageId;
}
```

Correct:

```ts
async function run({ parameters: { bucket }, meta }) {
  const target = bucket || process.env.AWS_ARTIFACT_BUCKET;

  if (!target) {
    return { error: "AWS_ARTIFACT_BUCKET is not configured" };
  }

  await client.send(new PutObjectCommand({ Bucket: target, Key: key }));
}
```

The AMI in `create_vm.ts` is already handled this way —
`resolveLatestAmazonLinuxAmi` queries for the newest matching image rather than
pinning an id, and the caller may override it through a parameter. Apply that
thinking to the rest.

---

### `seed/sequence-and-seed-shape`

**Severity: `warn`**

A seed file is `{ "sequence": <number>, "seed": [ ... ] }`, named after the model
it populates, with rows whose fields match that model exactly.

Rationale: `sequence` orders loading so foreign keys resolve — an `Agent` row
referencing a `teamId` must load after `Project`. All twenty seed files follow
this shape today, which is why
[`dataset/json-objects-only`](#datasetjson-objects-only) has no violations under
`seeds/`.

Incorrect:

```json
[
  { "id": "00db1bd4-4829-40f2-8b99-d2e42342157e", "name": "subscription_agent" }
]
```

An array root, no sequence, and no way to order it against other seeds.

Incorrect:

```json
{
  "sequence": 1,
  "seed": [
    {
      "id": "00db1bd4-4829-40f2-8b99-d2e42342157e",
      "name": "subscription_agent",
      "teamId": "add6dfa4-45ba-4da2-bc5c-5a529610b52f"
    }
  ]
}
```

`Agent` at sequence 1 loads before `Project`, so the `teamId` foreign key has
nothing to point at.

Incorrect:

```json
{
  "sequence": 2,
  "seed": [
    {
      "id": "00db1bd4-4829-40f2-8b99-d2e42342157e",
      "name": "subscription_agent",
      "role": "support",
      "avatar": ":5:"
    }
  ]
}
```

`role` and `avatar` are in neither `models/Agent.ts` nor `schemas/Agent.ts`;
Sequelize drops them without comment.

Correct:

```json
{
  "sequence": 2,
  "seed": [
    {
      "id": "00db1bd4-4829-40f2-8b99-d2e42342157e",
      "name": "subscription_agent",
      "icon": "iconoir:internet",
      "teamId": "add6dfa4-45ba-4da2-bc5c-5a529610b52f",
      "aiEngineId": "289a3c9a-f23b-421a-ac6e-f14052a2d57c",
      "description": "A agent optimized for subscription tasks, workflow assistance, and context-aware support within the system."
    }
  ]
}
```

Correct:

```json
{
  "sequence": 1,
  "seed": [
    {
      "id": "add6dfa4-45ba-4da2-bc5c-5a529610b52f",
      "name": "Core Systems",
      "icon": "solar:widget-bold"
    }
  ]
}
```

`Project.json` at sequence 1, `Agent.json` at sequence 2 — the foreign key
resolves because the order says it must.

Ids are fixed UUIDs, not generated, because the route specs assert on them —
`agents.spec.ts` looks up `72ef5b08-b4a9-42b7-bb0a-22d40e56798b` directly.
Changing a seed id breaks specs; add rows rather than renumbering.

Seeds are also the one JSON location `build.prod.js` copies into `dist`, so they
are read from disk at runtime rather than inlined. Keep them valid JSON with no
trailing commas.

---

### `param/resolve-refs-through-helper`

**Severity: `warn`**

A step parameter that points at an earlier step's output is a `$ref` node
resolved by `lib/parameterRefs.ts`, never reached into by hand.

Rationale: `resolveParameterRefs` handles the cases that make this fiddly — dot
and bracket path segments, and values that arrive as JSON strings rather than
objects, which it parses opportunistically as it walks. It has a spec at
`lib/test/parameterRefs.spec.ts`. Hand-written traversal misses the
string-encoded case, which is common because model output often arrives as text.

Incorrect:

```ts
const previous = steps.find((s) => s.id === step.dependsOn);
const value = previous.result.translations[0].tr;
```

Incorrect:

```ts
const previous = steps.find((s) => s.id === step.dependsOn);
const result =
  typeof previous.result === "string"
    ? JSON.parse(previous.result)
    : previous.result;

const value = result.tr;
```

The string case is handled once, at the top level. `resolveParameterRefs` parses
opportunistically at every segment, which is what a nested `$ref` needs.

Incorrect:

```ts
const parameters = {
  text: steps["translate"].result["tr"],
};
```

Correct:

```ts
import { resolveParameterRefs } from "../lib/parameterRefs";

const parameters = resolveParameterRefs(step.parameters, { steps });
```

Correct:

```json
{
  "text": { "$ref": "steps.translate.result.tr" }
}
```

Correct:

```json
{
  "url": { "$ref": "steps.search.result.items[0].link" }
}
```

Correct:

```ts
function getByPath(source: unknown, path: string): unknown {
  const parts = path
    .split(".")
    .flatMap((segment) => segment.split(/\[(\d+)\]/).filter((s) => s !== ""));

  let current: unknown = source;
  for (const part of parts) {
    if (current == null) return undefined;
    if (typeof current === "string") {
      current = tryParseJson(current) ?? current;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}
```

This is why [`action/schemas-describe-io`](#actionschemas-describe-io) insists on
an `outputSchema` — a `$ref` can only target a field the schema declares.

---

## 15. LLM call shape and instrumentation

### `llm/two-level-generate`

**Severity: `warn`**

There are two `generate` shapes and they are not interchangeable: application
code calls the domain-shaped `generate` exported from `lib/llm.ts`, while
provider modules implement the message-shaped `LLMAdapter.generate` from
`lib/types.ts`.

Rationale: `lib/llm.ts` is the translation layer. It takes `policy`, `dataset`,
`context`, `content` and `json_format` — the vocabulary this application thinks
in — and assembles the `messages` array and `responseFormat` that every provider
expects. Confusing the two produces a call that type-checks against the wrong
contract and silently drops the policy or the dataset.

Incorrect:

```ts
import { generate } from "../lib/llm";

const result = await generate({
  messages: [
    { role: "system", content: "You are a professional translator." },
    { role: "user", content: text },
  ],
  responseFormat: "json",
});
```

That is the adapter's shape handed to the application's function — `policy`,
`dataset` and `json_format` are all silently absent.

Incorrect:

```ts
import openai from "../lib/openai";

const result = await openai.generate({
  policy: { role: "system", content: "You are a translator." },
  content: text,
  json_format: '{ tr: "<Turkish>" }',
});
```

The application's shape handed to an adapter, which reads `messages` and finds
nothing.

Incorrect:

```ts
const result = await generate({
  policy: { role: "system", content: "You are a translator." },
  content: text,
  messages: [{ role: "user", content: text }],
});
```

Correct:

```ts
const result = await generate({
  policy: {
    role: "system",
    content:
      "You are a professional translator. Translate the given text into Turkish, English, and Spanish. Preserve meaning, tone, and formatting.",
  },
  content: text,
  json_format: '{ tr: "<Turkish translation>", en: "<English translation>", es: "<Spanish translation>" }',
  max_tokens: 4096,
  meta,
});
```

Correct:

```ts
type GenerateParams = {
  model?: string;
  messages: { role: "user" | "assistant" | "system"; content: string }[];
  responseFormat?: string;
  temperature?: number;
  max_tokens?: number;
  meta?: LLMMeta;
};
```

What providers implement, and what nothing outside `lib/` should construct.

Correct:

```ts
const response = await generate({
  policy: dataset.policy,
  dataset: dataset.blueprintChat,
  context: history,
  content,
  json_format: '{ response: "<reply>", flow: [<nodes>] }',
  meta: { teamId, agentId },
});
```

`json_format` carries a shape sketch rather than a JSON Schema; keep to that
convention so the assembled prompt stays consistent across call sites.

---

### `llm/repair-and-parse-model-json`

**Severity: `warn`**

Model output that is expected to be JSON goes through `lib/jsonParse.ts` rather
than a direct `JSON.parse` on a completion.

Rationale: models wrap JSON in markdown fences and, on some
model-and-provider combinations, truncate trailing braces. `jsonParse.ts`
handles both — it strips the fence, attempts a parse, and repairs unbalanced
brackets tracked outside string literals before retrying. It has its own spec at
`lib/test/jsonParse.spec.ts`. A bare `JSON.parse` turns a recoverable response
into a failed task.

Incorrect:

```ts
const completion = await generate({ content, json_format });

const parsed = JSON.parse(completion as string);
```

Incorrect:

```ts
const cleaned = completion.replace(/```json/g, "").replace(/```/g, "");

const parsed = JSON.parse(cleaned);
```

A second, weaker copy of the fence stripper — it removes fences from inside
string literals too, and repairs nothing when the model truncates.

Incorrect:

```ts
let parsed;

try {
  parsed = JSON.parse(completion);
} catch {
  parsed = {};
}
```

Swallowing the parse failure turns a recoverable response into an empty result
with no signal that anything went wrong.

Correct:

```ts
function stripMarkdownFence(content: string): string {
  return content
    .trim()
    .replace(/^```(?:json|JSON)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();
}

function parseJsonContent(content: string, providerLabel: string): unknown {
  const cleaned = stripMarkdownFence(content);

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error(
      `Failed to parse ${providerLabel} response as JSON: ` +
        (err instanceof Error ? err.message : String(err)) +
        "\nResponse content:\n" +
        cleaned,
    );
  }
}
```

Correct:

```ts
import { parseJsonContent } from "./jsonParse";

const completion = await client.chat.completions.create(payload);

return parseJsonContent(completion.choices[0].message.content, "OpenAI");
```

Correct:

```ts
const completion = await client.messages.create(payload);

return parseJsonContent(completion.content[0].text, "Anthropic");
```

The `providerLabel` argument is what makes a parse failure attributable to a
vendor. Pass it. Note also that this is the one place a raw response body
legitimately appears in an error message — it is model output, not credentials.

---

### `llm/log-shape`

**Severity: `warn`**

Every generation is recorded through `logLLM` with the full field set —
provider, model, messages, response, token counts, cost, duration, error, and
`meta` — never as a partial row.

Rationale: `LLMLog` backs the dashboard's cost screen, and the columns are only
useful if they are populated together. `totalTokens` is derived when absent, but
`cost` and `durationMs` are not — a row missing them makes the spend total quietly
low, and a row missing `meta.teamId` cannot be attributed to anyone at all. A
failed call must be logged too, with `error` set, otherwise failures are free in
the reporting.

Incorrect:

```ts
const response = await client.chat.completions.create(payload);

logLLM({ provider: "OPENAI", messages, response });
```

No tokens, no cost, no duration, no meta — and nothing logged if the call throws.

Incorrect:

```ts
try {
  const response = await client.chat.completions.create(payload);

  logLLM({ provider, model, messages, response, cost, durationMs, meta });

  return response;
} catch (error) {
  throw error;
}
```

A failed call is free in the reporting — the row that would carry `error` is
never written.

Incorrect:

```ts
LLMLog.create({
  provider,
  model,
  messages,
  response,
  cost,
  durationMs,
});
```

Omitting the optional columns rather than setting them to `null` leaves the
column absent instead of explicitly empty, so `meta.teamId` cannot be
distinguished from "not applicable".

Correct:

```ts
interface LLMMeta {
  source?: string | null;
  agentId?: string | null;
  sessionId?: string | null;
  taskId?: string | null;
  teamId?: string | null;
}

LLMLog.create({
  provider,
  model,
  messages,
  response,
  inputTokens,
  outputTokens,
  totalTokens:
    totalTokens ??
    (inputTokens != null && outputTokens != null
      ? inputTokens + outputTokens
      : null),
  cost,
  durationMs,
  error,
  source: meta.source ?? null,
  agentId: meta.agentId ?? null,
  sessionId: meta.sessionId ?? null,
  taskId: meta.taskId ?? null,
  teamId: meta.teamId ?? null,
});
```

Correct:

```ts
const startedAt = Date.now();

try {
  const response = await client.chat.completions.create(payload);

  logLLM({
    provider,
    model,
    messages,
    response,
    inputTokens: response.usage?.prompt_tokens,
    outputTokens: response.usage?.completion_tokens,
    cost: priceOf(model, response.usage),
    durationMs: Date.now() - startedAt,
    error: null,
    meta,
  });

  return response;
} catch (error) {
  logLLM({
    provider,
    model,
    messages,
    response: null,
    durationMs: Date.now() - startedAt,
    error: error instanceof Error ? error.message : String(error),
    meta,
  });

  throw error;
}
```

Every optional field defaults to `null` rather than being omitted, so the column
is explicitly empty rather than absent. A new provider adapter must populate the
same set — see [`llm/adapter-interface`](#llmadapter-interface).

---

### `obs/fire-and-forget-needs-catch`

**Severity: `warn`**

A promise deliberately not awaited carries its own `.catch`, and no floating
promise is left unhandled.

Rationale: an unhandled rejection in this process reaches the
`unhandledRejection` handler in `server.ts`, which logs it with no context about
what started it. Logging and metrics writes are the legitimate fire-and-forget
cases — they must not block or fail a request — but that makes their own error
handling mandatory rather than optional.

Incorrect:

```ts
function logLLM(params): void {
  LLMLog.create(params);
}
```

Incorrect:

```ts
event.publish("SUPERVISING_ANSWERED", { supervisingId });

res.status(204).end();
```

The publish is floating. If the bus rejects, the rejection surfaces in
`unhandledRejection` with no indication of which route started it.

Incorrect:

```ts
void metricsExporter.push(payload);
```

`void` marks the promise as deliberately unawaited and still leaves the rejection
unhandled.

Correct:

```ts
function logLLM(params): void {
  LLMLog.create({
    provider,
    model,
    error,
    teamId: meta.teamId ?? null,
  }).catch((err) => {
    platform.logger.error({
      message: "Failed to write LLMLog",
      error_message: err.message,
    });
  });
}
```

Correct:

```ts
event
  .publish("SUPERVISING_ANSWERED", { supervisingId })
  .catch((err) =>
    platform.logger.error({
      message: "Failed to publish SUPERVISING_ANSWERED",
      supervisingId,
      error_message: err.message,
    }),
  );
```

Correct:

```ts
await event.publish("SUPERVISING_ANSWERED", { supervisingId });

res.status(204).end();
```

Awaiting is the other valid answer — the rejection then reaches
`platform.error.handle` with the request still attached.

`logLLM` returns `void` by design — a generation must not fail because its audit
row could not be written. The `.catch` is what makes that safe.

The handler here should be `platform.logger.error`, per
[`obs/platform-logger-not-console`](#obsplatform-logger-not-console). The
structure is right; the sink is not.

---

### `obs/metrics-through-instrumentation`

**Severity: `warn`**

HTTP and runtime metrics come from `src/instrumentation.ts` and its
`telemetryMiddleware`, not from hand-rolled counters or gateway pushes in a
route or a function.

Rationale: `instrumentation.ts` owns the `MeterProvider`, the
`PushgatewayExporter`, host metrics and the Node runtime instrumentation, and
`app.ts` mounts the middleware before the auth layer so every request is
counted. A metric emitted elsewhere misses the shared resource attributes and
the configured export interval.

Incorrect:

```ts
router.post("/", async (req, res) => {
  await axios.post(`${config.metrics.url}/metrics/job/agents`, "created 1", {
    headers: { "Content-Type": "text/plain" },
  });
});
```

Incorrect:

```ts
import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("agents");
const counter = meter.createCounter("agents_created_total");

router.post("/", async (req, res) => {
  counter.add(1);
});
```

A meter created outside `instrumentation.ts` misses the shared resource
attributes and is not covered by the `config.metrics.enabled` gate.

Incorrect:

```ts
let requestCount = 0;

app.use((_req, _res, next) => {
  requestCount += 1;
  next();
});
```

Correct:

```ts
function createApp() {
  const { express: app, authorization } = platform;

  app.use(telemetryMiddleware());

  app.use(authorization.verify);
  app.use(authorization.authorize("ADMIN"));
}
```

Correct:

```ts
interface HttpMetrics {
  requestsCounter: Counter;
  requestDurationHistogram: Histogram;
  errorsCounter: Counter;
  activeRequestsGauge: UpDownCounter;
}
```

Correct:

```ts
if (config.metrics.enabled) {
  startPushgateway(config.metrics);
}
```

Export is gated on `config.metrics.enabled`, checked in `server.ts` before the
pushgateway is started — new metrics must respect the same flag rather than
pushing unconditionally.
