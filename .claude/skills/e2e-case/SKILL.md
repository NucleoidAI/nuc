---
name: e2e-case
description: Add a new end-to-end scenario to the api/test/e2e suite (blueprint → task → step → supervising flows driven by real events, a real LLM and stubbed MCP tools). Use when the user asks for a new e2e case/scenario, wants to cover a new blueprint path, handoff, supervising type, or MCP action, or says "yeni e2e case ekle".
---

# Adding an e2e case

The e2e suite in `api/test/e2e` boots the real API in-process (express app +
`link-express` modules + sqlite-in-memory models seeded from `api/src/seeds`),
replaces the event transport with an in-memory bus and the MCP client with a
stub, then drives the platform through events and asserts on what the platform
actually did: events published, MCP tools called with which arguments, rows
read back through the API.

There is no mocked LLM. `PLATFORM_LLM` must point at a real provider (creds
come from the root `.env.local`, loaded by `stack.ts`), so every case is
non-deterministic in its wording and deterministic only in its effects. Assert
on effects, never on model prose.

Run with `bun run test:e2e` from the repo root
(`jest --config jest.e2e.config.js --runInBand`).

## Where things live

| Path | What it is |
| --- | --- |
| `api/test/e2e/*.e2e.spec.ts` | the scenarios |
| `api/test/e2e/harness/stack.ts` | `stack.init()` — boots the app in `beforeAll`, stops it in `afterAll`; `app()` for supertest |
| `api/test/e2e/harness/mcp.ts` | `mcp.init()` + `mcp.tool(action)` — jest-mocks `src/lib/mcp`, stubs tool replies, verifies calls in `afterEach` |
| `api/test/e2e/harness/events/index.ts` | `events.init()`, `events.publish`, `events.waitFor`, `events.on`, `events.session`, `events.supervising` |
| `api/test/e2e/harness/events/scenario.ts` | the `WATCHED` alias list behind `events.init()` |
| `api/test/e2e/harness/events/types.ts` | payload types of the bus events |
| `api/test/e2e/harness/events/client.ts` | in-memory replacement for `@canmingir/link-express/event/client` (wired in `jest.e2e.config.js` via `moduleNameMapper`) |
| `api/test/e2e/fixtures/ids.ts` | team / agent / blueprint / session / node ids |
| `api/test/e2e/fixtures/supervisedBlueprint.ts` | reshaped blueprint nodes for the handoff case |
| `api/src/seeds/*.json` | platform seed rows (Agent, Blueprint, MCP, …) |

## Never touch application code

Adding an e2e case is a test-only change. Everything you write stays under
`api/test/e2e/` (spec, `harness/`, `fixtures/`) plus a seed json a case needs.
**Do not edit application source** — `api/src/**`, `mcp/**` servers, frontend,
shared packages — not to add a hook for the test, not to log something, not to
"fix" a bug the new case exposes.

If the case cannot pass without an application change, **stop and ask the
user**: say which file and what change, why the test cannot cover the flow
without it, and wait for approval. A failing case that reveals a real product
bug is a finding to report, not a licence to patch `api/src` in the same pass.

## Three channels: events in, MCP stubs, API out

- **Drive the platform with events.** Anything a user or an external system
  would do is an event: `events.session.userMessaged({ agentId, sessionId,
  content })` (content may be an object, it is stringified for you) and
  `events.supervising.answered({ … })`. For a bus event without a helper, use
  `events.publish("EVENT_NAME", payload)` inline.
- **Stub every MCP tool the flow will call.** No MCP server runs. `mcp.init()`
  replaces `src/lib/mcp`, so any `ORDER:*` / `GREY:*` action the blueprint
  reaches must have a stub, otherwise the tool returns an `isError` payload
  telling you which stub is missing. There is no ORDER json db and no SMTP
  sink any more — a sent mail is `mcp.tool("GREY:send_email")` having been
  called with the right `to`.
- **Read and write rows with raw supertest against `stack.app()`.** Inline in
  the case: `supertest(stack.app()).post("/knowledge").set("authorization",
  authorization()).send(body).expect(201)`. `authorization()` at the top of the
  spec mints an admin JWT for `TEAM_ID` from `process.env.JWT_SECRET` (set by
  `stack.init()`). Do **not** import Sequelize models and do **not** add an HTTP
  client or per-resource wrapper module.

## Shape of a spec file — copy `orderCompliance.e2e.spec.ts`

`api/test/e2e/orderCompliance.e2e.spec.ts` is the reference structure. A new
spec file looks exactly like it and nothing else:

```ts
mcp.init();
stack.init();

const scenario = events.init();

describe("…", () => {
  it("…", async () => { … }, 600_000);
});
```

- The three `init()` calls sit at module level, before `describe`. They
  register the jest hooks themselves: `stack.init()` owns `beforeAll`/
  `afterAll`, `mcp.init()` owns the mock plus `beforeEach` reset and
  `afterEach` verify, `events.init()` arms the watched subscriptions in
  `beforeEach` and releases them in `afterEach`.
- **Write no `beforeAll` / `beforeEach` / `afterEach` of your own.** If a case
  needs setup, it goes inline at the top of the `it`.
- All scenario logic lives inside the case, inline. No per-case setup
  functions, no shared "run the flow" wrappers, no `describe.each`, no config
  object. Repetition between cases is the intended shape — an inlined case is
  readable on its own and does not couple to its neighbours.
- Timeout is the third arg of `it`, written inline as `600_000`. Real LLM
  turns take minutes; the jest default is 900s.

## The `scenario` object

`events.init()` returns a proxy over the watched events, re-armed before every
test. Available aliases (from `scenario.ts`): `aiAssistantMessaged`,
`stepAdded`, `stepWaitingForUser`, `stepCompleted`, `stepSupervisedNeeded`,
`supervisingRaised`, `supervisingAnswered`, `taskCreated`, `taskCompleted`.

Each is a promise resolving at the **first** event of that type in the test, so
just `await scenario.taskCreated`. Reading it outside a test throws. Do not
build your own subscription object in a `beforeEach` — that was the old shape.

For anything the aliases cannot express — a second event of the same type, or
a concurrent task — use `events.waitFor(type, match)` **before** the trigger
that forks it:

```ts
const elsewhere = (payload: { taskId?: string }) =>
  payload.taskId !== taskCreated.taskId;

const handoffTaskCreated = events.waitFor(
  "TASK_CREATED",
  (payload) =>
    payload.agentId === COMPLIANCE_AGENT_ID &&
    payload.sessionId === SESSION.supervisedBlueprint,
);
```

A `waitFor` registered after the publish deadlocks until the timeout.

## Stubbing MCP tools

Declare every stub at the top of the case, before the first publish:

```ts
mcp.tool("ORDER:find_product").returns({
  product: { id: "prd-1", name: "product-1", vendor_id: "vnd-1" },
});

mcp
  .tool("ORDER:create_po")
  .expects({ product_id: "prd-1" })
  .returns({ purchase_order: { order_id: "po-2001", product_id: "prd-1" } });

mcp.tool("ORDER:assign_certificate").expectsNoCalls();
```

- `.returns(value)` — standing reply for every call; also accepts a function
  of the args.
- `.expects(args)` — asserts, in `afterEach`, that the n-th call matched
  (`toMatchObject`, so partial; `expect.stringContaining(…)` works inside).
  Chaining `.returns()` right after binds the reply to that scripted call.
- `.returnsOnce(value)` — one scripted reply, in call order.
- `.fails(value)` — reply flagged `isError` so the agent sees a tool failure.
- `.expectsNoCalls()` — asserts the branch was never taken.
- `.calls` / `.lastCall` — read the recorded args for inline assertions.

Stubs are cleared before each test and verified after it; there is nothing to
reset by hand.

## No new helpers without asking

**Never add a new helper — file, exported function, or wrapper — on your own
initiative.** Use what `harness/` and `fixtures/` already export. If the case
genuinely cannot be written with the existing helpers, stop and ask the user
whether to add one, naming the helper and why the existing API is not enough.
Wait for the answer; do not add it speculatively and offer to remove it later.

Things that are **not** a reason to add a helper:

- two cases publish a similar sequence of events → inline it twice
- the assertion block is long → leave it long, inline in the case
- a payload is built repeatedly → build it inline
- "it will be reusable later" → later is when it gets written

Legitimate additions — still ask first, except the first one:

- a payload type for a bus event not yet in `harness/events/types.ts`, plus
  its entry in `EventMap` (required by `ts/no-any`; this one you may add
  without asking)
- a new alias in `WATCHED` (`harness/events/scenario.ts`) — only if the event
  is one every case would watch; otherwise use `events.waitFor` in the case
- a new id in `fixtures/ids.ts`

## Procedure

1. **Name the effect first.** Write down the observable end state before any
   code: which task completes, which MCP tool is called with which arguments,
   which row changes. If the scenario has no assertable effect, it is not an
   e2e case — push it down to a unit test.
2. **Add a session id** in `fixtures/ids.ts` under `SESSION`. One case = one
   session id, never shared; cases run in band against one live stack and a
   reused session leaks step state into the next case.
3. **Walk the blueprint** in `api/src/seeds/Blueprint.json` and list every
   action the path hits. Each one needs a stub.
4. **Stub the MCP tools** at the top of the case, with `.expects(…)` on the
   arguments that prove the flow did the right thing and `.expectsNoCalls()`
   on the branch that must not run.
5. **Trigger** with `events.session.userMessaged({ agentId, sessionId, content:
   { intent: "create_order" } })`, then answer the `STEP_WAITING_FOR_USER`
   step with a second `userMessaged` carrying the payload the step asked for.
6. **Register `events.waitFor` predicates before the fork** if the case forks a
   second task (handoff).
7. **Assert on effects only**: event ids and shapes (`taskCompleted.taskId`,
   `stepAdded.action === "PLATFORM:user_interaction"`), MCP call args
   (`mcp.tool(…).lastCall`, or the `.expects` verified in `afterEach`), and
   rows read back over HTTP. Never assert on LLM wording; `toContain` on
   an id inside a result string is the loosest form allowed.
8. **Restore anything global you mutate.** Blueprint edits go inside
   `try { … } finally { await supertest(stack.app()).put(`/blueprints/${id}`)
   … .send(before) }`, with `before` read via a `GET` on the same path first.
   The database is in-memory but shared by every case in the file; a case that
   leaves a reshaped blueprint behind silently changes every case after it.
   Knowledge a case creates is visible to later cases too — prefer an agent or
   product no other case asserts on.

## New file instead of new `it`

Add a separate `*.e2e.spec.ts` only when the scenario needs a different booted
world (other seed state, other module set). Each file pays a full stack boot;
jest runs `--runInBand`, so files are serial and a second file roughly doubles
CI time. Reuse `orderCompliance.e2e.spec.ts` when the world is the same.

## Checklist before handing back

- [ ] No application source touched (`api/src`, `mcp/**`, frontend); if it was needed, the user approved it first
- [ ] New `SESSION.*` id, used nowhere else
- [ ] File follows `orderCompliance.e2e.spec.ts` structure: module-level `mcp.init()` / `stack.init()` / `events.init()`, no hand-written jest hooks
- [ ] No new helper file/function added; if one was truly needed, the user was asked and said yes
- [ ] Every MCP action on the path is stubbed; the branch that must not run has `.expectsNoCalls()`
- [ ] Case body is inline — no per-case setup functions or shared flow wrappers
- [ ] `scenario.*` for the first event of a type, `events.waitFor` registered before the fork for the rest
- [ ] Rows read and written with raw supertest against `stack.app()`, never Sequelize models and never a new client wrapper
- [ ] Every global mutation restored in `finally`
- [ ] Assertions are events / MCP calls / API rows — no LLM prose
- [ ] `600_000` passed as the third arg of `it`
- [ ] `bun run test:e2e` green locally against the real LLM before pushing
