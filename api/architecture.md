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

Examples of **incorrect** code for this rule:

`src/routes/agents.ts`

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

The "five most recent sessions with conversations" rule is business logic living
in a URL handler.

Examples of **correct** code for this rule:

`src/routes/agents.ts`

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

Validate, delegate, respond. The session tenant is passed down as `meta`, not
re-read inside the function.

---

### `layer/functions-are-transport-agnostic`

**Severity: `error`**

A function in `functions/` takes a single destructured object of domain
arguments, returns a domain value, throws on failure, and never receives `req`
or `res` or references status codes.

Rationale: the same functions serve HTTP routes, the internal `/internal/knowledge`
endpoint in `server.ts`, and seven event subscriptions in `app.ts`. A function
that writes to `res` works in exactly one of those three callers.

Examples of **incorrect** code for this rule:

```ts
async function create({ teamId, knowledge }, res) {
  if (!teamId) {
    return res.status(400).json({ error: "INVALID_TEAM" });
  }
}
```

Examples of **correct** code for this rule:

`src/functions/knowledge.ts`

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

Examples of **incorrect** code for this rule:

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

Examples of **correct** code for this rule:

`src/lib/types.ts`

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

Every adapter implements exactly that, and nothing more. Tier and policy checks
belong in `functions/`, before `generate` is called.

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

Examples of **incorrect** code for this rule:

`src/routes/test/agents.spec.ts` posts and asserts on `avatar`, `character`,
`title` and `role`:

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

None of those four exist in `schemas/Agent.ts` or `models/Agent.ts`.

Examples of **correct** code for this rule:

`src/schemas/Agent.ts`

```ts
const Agent = Joi.object({
  name: Joi.string().required(),
  icon: Joi.string().required(),
  teamId: Joi.string().guid().required(),
  aiEngineId: Joi.string().guid().required(),
  description: Joi.string().required(),
});
```

`src/models/Agent.ts`

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

The two agree field for field. Change them together, and update the specs and
`seeds/` in the same commit.

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

Examples of **incorrect** code for this rule:

`src/routes/agents.ts`

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

An agent belonging to another team is **deleted**, and the caller receives `204`.
The `401` is discarded by the final `status(204)`.

Examples of **correct** code for this rule:

`src/routes/agents.ts`

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

The same file contains both shapes. The `return` is the whole difference.

---

### `http/authorize-before-mutating`

**Severity: `error`**

The tenant check runs, and returns, before any create, update or destroy — never
authorize and mutate in sequence without a `return` between them.

Rationale: this is [`http/terminate-every-response`](#httpterminate-every-response)
at its most expensive, and it is worth stating separately because the failure is
a cross-tenant authorization bypass rather than a wrong status code. Both
mutating agent routes have it today.

Examples of **incorrect** code for this rule:

`src/routes/agents.ts`

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

A caller from team B can update team A's agent. The response carries `401` and
the write has already happened.

Examples of **correct** code for this rule:

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

Examples of **incorrect** code for this rule:

`src/routes/supervisings.ts`

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

Two dereferences of values just proven possibly-null.

Examples of **correct** code for this rule:

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

---

### `http/no-duplicate-route-registration`

**Severity: `error`**

One method-and-path pair is registered once per router.

Rationale: Express matches the first registration and never reaches the second,
so the duplicate is dead code that reads as live. `routes/agents.ts` registers
`GET /:agentId/blueprints` twice; the second version — the one that validates
`agentId` as a GUID and returns bare status codes — never runs.

Examples of **incorrect** code for this rule:

`src/routes/agents.ts`

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

Examples of **correct** code for this rule:

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

Distinct paths that merely look similar are fine — `POST /blueprints` and
`POST /:agentId/blueprints` are different routes.

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

Examples of **incorrect** code for this rule:

```ts
const agent = await Agent.findByPk(validatedId);

if (agent.teamId !== teamId) {
  return res.status(401).end();
}
```

Correct, but one missing `return` away from a bypass.

Examples of **correct** code for this rule:

`src/routes/agents.ts`

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

Applied to a single record:

```ts
const agent = await Agent.findOne({ where: { id: validatedId, teamId } });

if (!agent) {
  return res.status(404).end();
}
```

A foreign id and a missing id both become 404, which also avoids leaking whether
another team's agent exists.

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

Examples of **incorrect** code for this rule:

`src/routes/communications.ts`

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

`GET /communications` returns every tenant's communication channels. `DELETE
/communications/:id` deletes any of them by id. There is no check to forget here
— unlike the agents routes, nothing was ever written.

Examples of **correct** code for this rule:

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

For a genuinely global route, say so where a reviewer will see it:

```ts
router.get("/", async (_req, res) => {
  const engines = await AIEngine.findAll();

  res.json(engines);
});
```

`engines` is a shared catalogue with no tenant column — that fact belongs in the
route's own file, not in a reviewer's memory.

---

### `function/list-takes-a-scope`

**Severity: `error`**

A function that lists rows takes the scope as an argument and applies it in the
query, because a bare `Model.findAll()` with no `where` is a cross-tenant read.

Rationale: routes are thin by rule, so the tenant filter lives in the function.
`communication.list()` takes no arguments at all and returns every row in the
table, which is what makes the unscoped route above a data exposure rather than
just an oversight.

Examples of **incorrect** code for this rule:

`src/functions/communication.ts`

```ts
async function list() {
  const communications = await Communication.findAll();

  return communications.map((communication) => communication.toJSON());
}
```

Examples of **correct** code for this rule:

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

Where the model does carry the column, scope directly:

```ts
async function list({ agentId }: { agentId: string }) {
  return Knowledge.findAll({ where: { agentId } });
}
```

---

### `http/status-codes`

**Severity: `warn`**

`201` for a create that returns the resource, `204` with `.end()` for a delete,
`200` via `res.json(...)` for reads and updates, `400` for validation, `401` for
a tenant mismatch, `404` for a missing resource.

Rationale: the dashboard branches on these, and the route specs assert them
directly with `.expect(201)`.

Examples of **incorrect** code for this rule:

```ts
const agent = await Agent.create(validatedBody);
res.json(agent);
```

Examples of **correct** code for this rule:

`src/routes/agents.ts`

```ts
router.post("/", async (req, res) => {
  const { projectId: teamId } = req.session;

  const validatedBody = Joi.attempt(body, schemas.Agent);
  validatedBody.teamId = teamId;

  const agent = await Agent.create(validatedBody);

  res.status(201).json(agent);
});
```

```ts
await agentFn.remove({ agentId: agent.id });

res.status(204).end();
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

Examples of **incorrect** code for this rule:

`src/routes/agents.ts` — both styles in one file:

```ts
const validatedBody = Joi.attempt(body, schemas.Agent);

const { history, content } = Blueprint.create.parse(body);
```

Examples of **correct** code for this rule:

`src/schemas/Agent.ts`

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

Examples of **incorrect** code for this rule:

`src/routes/agents.ts`

```ts
router.post("/:agentId/blueprints", async (req, res) => {
  const { agentId } = req.params;
  const { history, content } = Blueprint.createBlueprintName.parse(body);

  const response = await agentFn.blueprintName({ history, content, agentId });

  res.json(response);
});
```

`agentId` is neither validated nor checked against the session tenant before it
is handed to a function.

Examples of **correct** code for this rule:

`src/routes/agents.ts`

```ts
const { agentId } = Joi.attempt(
  req.params,
  Joi.object({ agentId: Joi.string().guid().required() })
);
```

```ts
const { status } = Joi.attempt(
  req.query,
  Joi.object({
    status: Joi.string().valid("ANSWERED", "IN_PROGRESS").optional(),
  })
);
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

Examples of **incorrect** code for this rule:

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

Examples of **correct** code for this rule:

`src/schemas/index.ts`

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

Examples of **incorrect** code for this rule:

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

Examples of **correct** code for this rule:

`src/functions/knowledge.ts`

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

Examples of **incorrect** code for this rule:

`src/app.ts`

```ts
const steps = await taskFn.listSteps({ taskId });

console.log("steps", steps);

const supervisedIndex = sortedSteps.findIndex(
  (step) => step.status === "SUPERVISED_NEEDED",
);

console.log("supervisedIndex", supervisedIndex);
```

Examples of **correct** code for this rule:

`server.ts`

```ts
platform.logger.error({
  message: "Uncaught Exception",
  error_message: err.message,
  error_stack: err.stack,
});
```

```ts
const logger = platform.logger;

logger.info("Platform Logger Initialized");
```

Log an object with named fields rather than positional arguments — that is what
makes the record queryable.

---

### `error/let-platform-map-to-http`

**Severity: `warn`**

Routes let thrown errors reach `platform.error.handle` instead of wrapping every
handler in `try/catch`.

Rationale: `app.ts` mounts the handler after all routers, inside `setImmediate`,
together with the 404 fallback. Per-route `try/catch` duplicates that mapping and
tends to flatten distinct failures into one generic 500.

Examples of **incorrect** code for this rule:

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

Examples of **correct** code for this rule:

`src/app.ts`

```ts
setImmediate(() => {
  app.use((_req, res) => res.status(404).end());
  app.use(platform.error.handle);
});
```

and routes that simply do not catch:

```ts
router.post("/", async (req, res) => {
  const validatedBody = Joi.attempt(body, schemas.Agent);
  validatedBody.teamId = teamId;

  const agent = await Agent.create(validatedBody);

  res.status(201).json(agent);
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

Examples of **incorrect** code for this rule:

```ts
import { DataTypes } from "sequelize";

const Agent = sequelize.define("Agent", {
  id: { type: DataTypes.UUID, primaryKey: true },
  name: DataTypes.STRING,
});
```

Examples of **correct** code for this rule:

`src/models/Agent.ts`

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

New models are registered through `models/models.ts`, which `models/index.ts`
re-exports and `server.ts` initialises with `await models.init()`.

---

### `model/export-attributes-interface`

**Severity: `warn`**

Each model exports a named `XAttributes` interface and parameterises
`Model<XAttributes>`.

Rationale: it is the only place the row shape exists as a type. Functions that
return `.toJSON()` have nothing else to be typed against.

Examples of **incorrect** code for this rule:

```ts
class Agent extends Model {
  declare id: string;
  declare name: string;
}
```

`Model` without a type argument makes every attribute `any`.

Examples of **correct** code for this rule:

`src/models/Agent.ts`

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

Examples of **incorrect** code for this rule:

`src/models/models.ts`

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

Examples of **correct** code for this rule:

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

Examples of **incorrect** code for this rule:

```ts
import Project from "./Project";

@Table({ tableName: "Agent" })
class Agent extends Model<AgentAttributes> {
  @BelongsTo(() => Project)
  declare team: Project;
}
```

Examples of **correct** code for this rule:

`src/models/models.ts`

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

`server.ts`

```ts
await models.init();
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

Examples of **incorrect** code for this rule:

`src/models/Agent.ts`

```ts
@Table({
  tableName: "Agent",
  timestamps: false,
  underscored: true,
})
```

against `dashboard/src/components/AgentCard/AgentCard.tsx`:

```tsx
<Typography variant="caption" color="text.secondary">
  {agent.createdAt}
</Typography>
```

Examples of **correct** code for this rule:

```ts
@Table({
  tableName: "Agent",
  timestamps: true,
  underscored: true,
})
```

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

Examples of **incorrect** code for this rule:

```ts
import openai from "../lib/openai";

const result = await openai.generate({ messages });
```

Examples of **correct** code for this rule:

`src/functions/agent.ts`

```ts
import { generate } from "../lib/llm";
```

`src/lib/types.ts`

```ts
type LLMAdapter = {
  generate(params: GenerateParams): Promise<Record<string, unknown>>;
};
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

Examples of **incorrect** code for this rule:

```ts
const result = await generate({
  model: "gpt-4o-mini",
  messages,
});
```

Examples of **correct** code for this rule:

`src/lib/llm.ts`

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

Examples of **incorrect** code for this rule:

```ts
import anthropic from "./anthropic";
import bedrock from "./bedrock";
import openai from "./openai";

const adapters = { OPENAI: openai, ANTHROPIC: anthropic, BEDROCK: bedrock };
```

Examples of **correct** code for this rule:

`src/lib/llm.ts`

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

---

### `llm/log-every-generation`

**Severity: `warn`**

Calls to `generate` pass `meta` so the generation is recorded through
`lib/llmLog.ts`.

Rationale: `LLMLog` and `ModelPricing` back the dashboard's cost screen. A
generation without `meta` still runs, still costs money, and never appears in
`GET /llm-logs` — so the reported spend is quietly low.

Examples of **incorrect** code for this rule:

```ts
const response = await generate({ messages, responseFormat: "json" });
```

Examples of **correct** code for this rule:

`src/routes/agents.ts`

```ts
const response = await agentFn.Blueprint({
  history,
  content,
  meta: { teamId: req.session.projectId },
});
```

`meta` is typed as `LLMMeta` in `lib/llmLog.ts` and threaded down from the
route, so the log row carries the tenant. `lib/llm.ts` infers the calling module
for the `source` field on its own; do not pass that by hand.

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

Examples of **incorrect** code for this rule:

`src/routes/agents.ts`

```ts
import { event } from "node-event-test-package/client";
```

Examples of **correct** code for this rule:

`src/app.ts`

```ts
import { event } from "@canmingir/link-express/event/client";
```

`server.ts`

```ts
await event.init(config.event);

const shutdown = async () => {
  await event.disconnect();
  server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
```

---

### `event/subscriptions-in-app`

**Severity: `warn`**

Subscriptions are registered in `createApp()` in `src/app.ts`, typed with the
payload shape, and delegate immediately to a function.

Rationale: keeping them in one place makes the full set of asynchronous entry
points readable at a glance — there are seven — and the type argument is the only
contract the payload has, since the bus is otherwise untyped.

Examples of **incorrect** code for this rule:

```ts
event.subscribe("TASK_CREATED", async (payload: any) => {
  const task = await Task.findByPk(payload.taskId);
  const steps = await Step.findAll({ where: { taskId: task.id } });
});
```

Examples of **correct** code for this rule:

`src/app.ts`

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

---

### `event/handlers-guard-and-report`

**Severity: `warn`**

A subscription handler catches its own failures, logs them, and publishes a
domain error event where a client is waiting on a result.

Rationale: a rejection inside a subscriber has no request to fail — it surfaces
as the `unhandledRejection` handler in `server.ts` and the user waits forever.
The `SESSION_USER_MESSAGED` handler is the model to copy.

Examples of **incorrect** code for this rule:

```ts
await event.subscribe<{ sessionId: string; content: string }>(
  "SESSION_USER_MESSAGED",
  async ({ agentId, sessionId, content }) => {
    await agentFn.chat({ agentId, sessionId, content });
  },
);
```

Examples of **correct** code for this rule:

`src/app.ts`

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

Examples of **incorrect** code for this rule:

`src/dataset/prompts.md`, `src/dataset/train/blueprint.md`,
`src/dataset/train/chat.md`, `src/dataset/train/task-diamond.md`.

A non-object root is equally wrong:

```json
[{ "instruction": "do X" }]
```

Examples of **correct** code for this rule:

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

Examples of **incorrect** code for this rule:

```ts
import blueprintChat from "../dataset/train/blueprint-chat.json";
```

reaching past the barrel from a function.

Examples of **correct** code for this rule:

`src/dataset/index.ts`

```ts
import blueprintChat from "./train/blueprint-chat.json";
import knowledgeScore from "./train/knowledge-score.json";
import policy from "./policy.json";

export default {
  policy: {
    role: "system" as const,
  },
};
```

`src/functions/agent.ts`

```ts
import dataset from "../dataset";
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

Examples of **incorrect** code for this rule:

`src/routes/agents.ts`

```ts
import Blueprint from "../schemas/Blueprint";
import BlueprintModel from "../models/Blueprint";
import Agent from "../models/Agent";
import BlueprintModel from "../models/Blueprint";
import Joi from "joi";
```

Examples of **correct** code for this rule:

```ts
import Agent from "../models/Agent";
import Blueprint from "../schemas/Blueprint";
import BlueprintModel from "../models/Blueprint";
import Joi from "joi";
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

Examples of **incorrect** code for this rule:

`src/schemas/Agent.ts`

```ts
import Joi from "joi";
```

with no `joi` entry in `package.json`.

Examples of **correct** code for this rule:

```json
"dependencies": {
  "express": "^4.21.2",
  "joi": "^17.13.3",
  "sequelize": "^6.37.7",
  "uuid": "^11.1.0"
}
```

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

Examples of **incorrect** code for this rule:

```json
"dependencies": {
  "node-event-test-package": "^1.1.66"
}
```

```ts
import { event } from "node-event-test-package/client";
```

Examples of **correct** code for this rule:

Test-only tooling sits in `devDependencies` and is imported only from spec files:

```json
"devDependencies": {
  "supertest": "^6.2.3",
  "@types/supertest": "^6.0.2",
  "jest": "^29.7.0",
  "ts-jest": "^29.2.5"
}
```

```ts
import request from "supertest";
import test from "@canmingir/link-express/test";
```

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

Examples of **incorrect** code for this rule:

`src/routes/test/agents.spec.ts` — creates, lists, and asserts bodies, with no
negative authorization case.

Examples of **correct** code for this rule:

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

Examples of **incorrect** code for this rule:

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

Examples of **correct** code for this rule:

`src/routes/test/agents.spec.ts`

```ts
describe("Agent service", () => {
  beforeEach(async () => test.reset());

  it("lists agents", async () => {
    test.project("e6d4744d-a11b-4c75-acad-e24a02903729");

    const { body } = await request(app).get("/agents").expect(200);
  });
});
```

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

Examples of **incorrect** code for this rule:

```ts
it("creates an agent", async () => {
  const agent = await Agent.create({ name: "Test Agent" });
  deepEqual(agent.name, "Test Agent");
});
```

This tests Sequelize, not the route.

Examples of **correct** code for this rule:

`src/routes/test/agents.spec.ts`

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

Examples of **incorrect** code for this rule:

`package.json`

```json
"scripts": {
  "test": "bun test.ts"
}
```

`test.ts`

```ts
import mcp from "./src/lib/mcp";

mcp.connect().then((mcp) => {
  console.log(mcp);
});
```

Ten route specs and three lib specs have never been executed by any automated
run. This is why the authorization bypass in `routes/agents.ts` is undetected, and why
`routes/test/agents.spec.ts` still posts fields — `avatar`, `character`,
`title`, `role` — that the schema stopped accepting.

Examples of **correct** code for this rule:

```json
"scripts": {
  "test": "jest",
  "lint": "eslint . --ext .ts",
  "typecheck": "tsc --noEmit"
}
```

with the scratch script deleted or moved to `scripts/` and out of the way of
`npm test`. Add the command to the `Test` workflow so it runs on every PR, as
the dashboard's lint and typecheck already do.

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

Examples of **incorrect** code for this rule:

`src/actions/create_vm.ts`

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

Examples of **correct** code for this rule:

```ts
function getClient(region?: string) {
  return new EC2Client({
    region: region || process.env.AWS_REGION || "us-east-1",
  });
}
```

Omitting `credentials` lets the AWS SDK use its default provider chain —
environment variables in development, and the task or instance role in
production, which is credential-free and rotates on its own. If explicit
variables are needed, read them and fail loudly when absent:

```ts
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

if (!accessKeyId || !secretAccessKey) {
  throw new Error("AWS_CREDENTIALS_MISSING");
}
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

Examples of **incorrect** code for this rule:

```
api/.env          tracked, 6 non-empty assignments
api/.env.test     tracked
```

with `.gitignore` implying otherwise:

```
.env
.env.local
.env.test.local
```

Examples of **correct** code for this rule:

`api/.env.example`, committed:

```
ASR_ENDPOINT_URL=
OPENROUTER_API_KEY=
JWT_SECRET=
PLATFORM_LLM=local
OAUTH_CLIENT_SECRET=
OPENAI_API_KEY=
```

`.gitignore`:

```
.env
.env.*
!.env.example
```

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

Examples of **incorrect** code for this rule:

```ts
platform.logger.info({ message: "MCP authorized", payload });

throw new Error(`Token exchange failed for ${JSON.stringify(payload)}`);
```

where `payload` carries `authorizationCode`.

```ts
const mcp = await MCP.findByPk(id);

res.json(mcp);
```

returning the row including `refreshToken`.

Examples of **correct** code for this rule:

```ts
platform.logger.info({ message: "MCP authorized", mcpId: mcp.id, agentId });

throw new Error("MCP_TOKEN_EXCHANGE_FAILED");
```

```ts
const mcp = await MCP.findByPk(id, {
  attributes: { exclude: ["refreshToken"] },
});

res.json(mcp);
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

Examples of **incorrect** code for this rule:

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

Examples of **correct** code for this rule:

`config.ts`

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

`src/lib/llm.ts`

```ts
const { provider, model: configuredModel } = parseProviderModel(
  process.env.PLATFORM_LLM || "local",
);
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

Examples of **incorrect** code for this rule:

Root `package.json`

```json
"lint:dashboard": "cd ./dashboard && bun run lint",
"lint": "bun run lint:dashboard",
"typecheck:dashboard": "cd ./dashboard && bun run typecheck",
"typecheck": "bun run typecheck:dashboard"
```

Examples of **correct** code for this rule:

```json
"lint:api": "cd ./api && bun run lint",
"lint:dashboard": "cd ./dashboard && bun run lint",
"lint": "bun run lint:api && bun run lint:dashboard",
"typecheck:api": "cd ./api && bun run typecheck",
"typecheck:dashboard": "cd ./dashboard && bun run typecheck",
"typecheck": "bun run typecheck:api && bun run typecheck:dashboard"
```

with `.github/workflows/test.yml` also running the suites:

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

Examples of **incorrect** code for this rule:

`api/package.json`

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

Examples of **correct** code for this rule:

```json
"scripts": {
  "typecheck": "tsc --noEmit",
  "lint": "eslint . --ext .ts",
  "test": "jest"
}
```

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

Examples of **incorrect** code for this rule:

```
api/logs/email-service.log     tracked
```

Examples of **correct** code for this rule:

`api/.gitignore`

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

`.gitignore` here already covers `/build` but not `/dist`, which is what
`build.prod.js` actually writes — add it while fixing this.

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

Examples of **incorrect** code for this rule:

`tsconfig.build.json`, unreferenced, while the actual build declares its own
options:

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

Examples of **correct** code for this rule:

Either delete `tsconfig.build.json`, or point the build at it:

```js
await esbuild.build({
  tsconfig: path.join(ROOT, "tsconfig.build.json"),
});
```

The same test applies to `config.kafka.ts` and `config.txq.ts`, which
`server.ts` imports only in commented-out lines.

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

Examples of **incorrect** code for this rule:

```ts
import {
  items,
} from "./train/blueprint.json";
```

```ts
import { actions } from "./actions.json";
```

```ts
const dataset = require(`./train/${name}.json`);
```

None of these match the plugin's pattern, and none of the files reach `dist`.

Examples of **correct** code for this rule:

`src/dataset/index.ts`

```ts
import Blueprint from "./train/blueprint.json";
import blueprintChat from "./train/blueprint-chat.json";
import policy from "./policy.json";
```

`src/actions/index.ts`

```ts
import actions from "./actions.json";
```

All 21 dataset imports and the actions import are in this form today. Keep them
that way, or make the build copy JSON unconditionally and drop the plugin.

---

### `build/accurate-build-output`

**Severity: `warn`**

Build logs name the directory the build actually writes.

Rationale: `build.prod.js` sets `OUT = path.join(ROOT, "dist")` and the
`Dockerfile` copies `./api/dist/`, which agree. The console output does not — it
announces `dist-obfuscated` three times and its step counter runs `[1/3]`,
`[2/3]`, `[3/4]`, `[4/4]`. Anyone debugging a deploy follows the messages, not
the source.

Examples of **incorrect** code for this rule:

```js
const OUT = path.join(ROOT, "dist");

console.log("\n[1/3] Cleaning dist-obfuscated...");
console.log("\n[3/4] Copying non-TS assets...");
console.log("\nBuild complete! Output in ./dist-obfuscated/");
console.log("Docker will copy dist-obfuscated/ → /app/api/");
```

Examples of **correct** code for this rule:

```js
const OUT = path.join(ROOT, "dist");

console.log(`\n[1/4] Cleaning ${path.relative(ROOT, OUT)}...`);
console.log("\n[3/4] Copying non-TS assets...");
console.log(`\nBuild complete! Output in ./${path.relative(ROOT, OUT)}/`);
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

Examples of **incorrect** code for this rule:

```js
const OBFUSCATOR_OPTIONS = {
  controlFlowFlattening: true,
  deadCodeInjection: true,
  identifierNamesGenerator: "hexadecimal",
};
```

with `server.ts` still logging `err.stack` as if it were readable, and
`lib/llm.ts` still deriving `source` from `basename` of a call site.

Examples of **correct** code for this rule:

Emit and retain a source map, keeping it out of the image:

```js
await esbuild.build({
  entryPoints: tsFiles,
  sourcemap: "external",
  outdir: OUT,
});
```

or pass an explicit source label instead of inferring it:

```ts
const response = await generate({
  content,
  json_format,
  meta: { teamId, source: "functions/agent.blueprint" },
});
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

Examples of **incorrect** code for this rule:

Adding `src/actions/summarize_thread.ts` and nothing else. `actions.find(...)`
returns `undefined` and the action never appears in the model's option list.

Examples of **correct** code for this rule:

`src/actions/actions.json`

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

`src/actions/translate.ts`

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

`src/actions/index.ts`

```ts
function find(action: string) {
  return actions.find((a) => a.action === action);
}
```

Names are namespaced `PLATFORM:<lib>`. An action that must never be offered for
a non-blocking step is excluded in `listNonBlockings`, as
`PLATFORM:ask_supervisor` is.

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

Examples of **incorrect** code for this rule:

```ts
async function run({ parameters: { text } }) {
  if (!text) {
    throw new Error("TEXT_REQUIRED");
  }
}
```

Examples of **correct** code for this rule:

`src/actions/translate.ts`

```ts
async function run({ parameters: { text }, meta }) {
  if (!text) {
    return { error: "text is required" };
  }

  const result = await generate({ content: text, json_format, meta });

  return result as { tr: string; en: string; es: string };
}
```

with the field declared in the registry:

```json
"outputSchema": {
  "type": "object",
  "properties": {
    "tr": { "type": "string", "description": "Turkish translation." },
    "error": { "type": "string" }
  }
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

Examples of **incorrect** code for this rule:

```json
{
  "action": "PLATFORM:translate",
  "lib": "translate",
  "description": "Translates text"
}
```

No schemas, so nothing downstream can reference a field of the result.

Examples of **correct** code for this rule:

`src/actions/actions.json`

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

Examples of **incorrect** code for this rule:

`src/actions/create_vm.ts`

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

Examples of **correct** code for this rule:

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

Examples of **incorrect** code for this rule:

```ts
const browser = await puppeteer.launch();
const page = await browser.newPage();

const content = await page.evaluate(() => document.body.innerText);

await browser.close();

return { content };
```

Any throw between `launch` and `close` leaks a Chromium process.

Examples of **correct** code for this rule:

`src/actions/scrapper.ts`

```ts
const browser = await puppeteer.launch({ headless: true });

try {
  const page = await browser.newPage();

  return await scrape(page);
} finally {
  await browser.close();
}
```

`scrapper.ts` already does exactly this, closing individual pages inside the
loop and the browser in the outer `finally`. It is the pattern to copy.

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

Examples of **incorrect** code for this rule:

`src/actions/create_vm.ts`

```ts
new RunInstancesCommand({
  LaunchTemplate: {
    LaunchTemplateId: "lt-0bb60b7532394e758",
    Version: "$Latest",
  },
  ImageId: imageId,
});
```

Examples of **correct** code for this rule:

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

The AMI in the same file is already handled correctly — `resolveLatestAmazonLinuxAmi`
queries for the newest matching image rather than pinning an id, and the caller
may override it through a parameter. Apply that thinking to the rest.

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

Examples of **incorrect** code for this rule:

```json
[
  { "id": "00db1bd4-4829-40f2-8b99-d2e42342157e", "name": "subscription_agent" }
]
```

An array root, no sequence, and no way to order it against other seeds.

Examples of **correct** code for this rule:

`src/seeds/Agent.json`

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

Examples of **incorrect** code for this rule:

```ts
const previous = steps.find((s) => s.id === step.dependsOn);
const value = previous.result.translations[0].tr;
```

Examples of **correct** code for this rule:

`src/functions/agent.ts`

```ts
import { resolveParameterRefs } from "../lib/parameterRefs";
```

with the reference expressed as data in the step's parameters:

```json
{
  "text": { "$ref": "steps.translate.result.tr" }
}
```

`src/lib/parameterRefs.ts`

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

Examples of **incorrect** code for this rule:

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

That is the adapter's shape handed to the application's function.

Examples of **correct** code for this rule:

`src/actions/translate.ts`

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

`src/lib/types.ts` — what providers implement, and what nothing outside `lib/`
should construct:

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

Examples of **incorrect** code for this rule:

```ts
const completion = await generate({ content, json_format });

const parsed = JSON.parse(completion as string);
```

Examples of **correct** code for this rule:

`src/lib/jsonParse.ts`

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

Examples of **incorrect** code for this rule:

```ts
const response = await client.chat.completions.create(payload);

logLLM({ provider: "OPENAI", messages, response });
```

No tokens, no cost, no duration, no meta — and nothing logged if the call throws.

Examples of **correct** code for this rule:

`src/lib/llmLog.ts`

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

Examples of **incorrect** code for this rule:

```ts
function logLLM(params): void {
  LLMLog.create(params);
}
```

Examples of **correct** code for this rule:

`src/lib/llmLog.ts`

```ts
function logLLM(params): void {
  LLMLog.create({
    provider,
    model,
    error,
    teamId: meta.teamId ?? null,
  }).catch((err) => {
    console.error("Failed to write LLMLog:", err);
  });
}
```

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

Examples of **incorrect** code for this rule:

```ts
router.post("/", async (req, res) => {
  await axios.post(`${config.metrics.url}/metrics/job/agents`, "created 1", {
    headers: { "Content-Type": "text/plain" },
  });
});
```

Examples of **correct** code for this rule:

`src/app.ts`

```ts
function createApp() {
  const { express: app, authorization } = platform;

  app.use(telemetryMiddleware());

  app.use(authorization.verify);
  app.use(authorization.authorize("ADMIN"));
}
```

`src/instrumentation.ts`

```ts
interface HttpMetrics {
  requestsCounter: Counter;
  requestDurationHistogram: Histogram;
  errorsCounter: Counter;
  activeRequestsGauge: UpDownCounter;
}
```

Export is gated on `config.metrics.enabled`, checked in `server.ts` before the
pushgateway is started — new metrics must respect the same flag rather than
pushing unconditionally.
