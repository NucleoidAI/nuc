# Coding Guidelines — Rule Catalog

These rules apply to every package in the repository — `api/`, `dashboard/`,
`communication/`, `mcp/`, `server-dashboard/` and the root scripts — and cover
how code is written rather than how it is arranged. Where a rule binds in only
one package, the rule says so.

Structural rules — layer boundaries, data access, events, persistence, build and
release — live in `api/architecture.md` and `dashboard/architecture.md`. This
catalog does not repeat them.

## 1. Language baseline

### `lang/const-over-let`

**Severity: `error`**

Declare bindings with `const`, and reach for `let` only where the binding is
genuinely reassigned; `var` never appears.

`prefer-const` and `no-var` are enabled in `dashboard/.eslintrc.json` and are not
enabled in `api/`, `communication/` or `mcp/`, which extend only
`eslint:recommended` and `plugin:@typescript-eslint/recommended`. There are zero
`var` declarations in the project today, so the convention already holds
everywhere — the rule is here to keep it holding in the three packages where
nothing enforces it.

Incorrect:

```ts
var provider = process.env.PLATFORM_LLM || "local";
```

Incorrect:

```ts
let steps = await taskFn.listSteps({ taskId });
let sorted = steps.sort((a, b) => a.order - b.order);

return sorted;
```

Neither binding is reassigned.

Incorrect:

```ts
let result = {};

result.tr = translations.tr;
result.en = translations.en;

return result;
```

Mutating a `let` object in place where an object literal says the same thing in
one expression.

Correct:

```ts
const steps = await taskFn.listSteps({ taskId });
const sorted = [...steps].sort((a, b) => a.order - b.order);

return sorted;
```

Correct:

```ts
const result = {
  tr: translations.tr,
  en: translations.en,
};
```

Correct:

```ts
let repaired = content;

for (let i = stack.length - 1; i >= 0; i--) {
  repaired += stack[i] === "{" ? "}" : "]";
}
```

`let` earns its place when the binding really is reassigned, as it is in
`lib/jsonParse.ts`.

---

### `lang/strict-equality`

**Severity: `error`**

Compare with `===` and `!==`. The single exception is `== null` / `!= null` as a
deliberate "null or undefined" test, and even that is unavailable in `dashboard/`.

`eqeqeq` is set to `["error", "always"]` in `dashboard/.eslintrc.json` and is
unset everywhere else. Ten loose comparisons exist today and every one of them is
an intentional `== null` in `api/` — `parameterRefs.ts`, `llmLog.ts`,
`functions/agent.ts`, `actions/evaluate_metrics.ts`. That idiom is fine there and
would be rejected by the dashboard's `always` setting, so dashboard code writes
the check out.

Incorrect:

```ts
if (step.status == "COMPLETED") {
  return;
}
```

Incorrect:

```ts
if (agent.teamId != teamId) {
  return res.status(401).end();
}
```

A loose comparison on a tenant check, where `undefined != null` is `false` and a
missing `teamId` therefore passes.

Correct:

```ts
if (step.status === "COMPLETED") {
  return;
}
```

Correct:

```ts
if (current == null) {
  return undefined;
}
```

One test covering both `null` and `undefined`, as `lib/parameterRefs.ts` writes
it.

Correct:

```tsx
if (agent === null || agent === undefined) {
  return <AgentsSkeleton />;
}
```

The same test spelled out, for `dashboard/` where `eqeqeq: always` applies.

---

### `lang/nullish-over-logical-or`

**Severity: `warn`**

Use `??` to supply a default for a missing value, and keep `||` for genuinely
boolean logic.

`||` treats `0`, `""` and `false` as absent. That is wrong for every numeric and
string field in this domain — a `resultScore` of `0`, an empty `description`, a
`durationMs` of `0` are all real values that `||` silently replaces. `lib/llmLog.ts`
already uses `??` for exactly this reason.

Incorrect:

```ts
const score = resultScore || 1;
```

A score of `0` becomes `1`.

Incorrect:

```ts
const description = agent.description || "No description";
```

An intentionally blank description is overwritten.

Incorrect:

```ts
return {
  agents: data || [],
};
```

Harmless for an array, and the same habit that produces the two above.

Correct:

```ts
const score = resultScore ?? 1;
```

Correct:

```ts
return {
  agents: (data as Agent[]) ?? [],
};
```

Correct:

```ts
const provider = process.env.PLATFORM_LLM || "local";
```

`||` is right where an empty string genuinely means "not configured", as it does
for an environment variable.

---

### `lang/template-literals`

**Severity: `warn`**

Build strings with template literals rather than `+` concatenation.

Concatenation hides where the interpolation points are and forces explicit
`String(...)` calls around non-strings. The one place the codebase still
concatenates is the error assembly in `lib/jsonParse.ts`, which is also the place
it is hardest to read.

Incorrect:

```ts
throw new Error(
  "Failed to parse " +
    providerLabel +
    " response as JSON: " +
    (err instanceof Error ? err.message : String(err))
);
```

Incorrect:

```ts
const url = config.api + "/agents/" + agentId + "/knowledge";
```

Correct:

```ts
throw new Error(
  `Failed to parse ${providerLabel} response as JSON: ${
    err instanceof Error ? err.message : String(err)
  }`
);
```

Correct:

```ts
const { data } = await http.get(`/agents/${agentId}/knowledge`);
```

Correct:

```ts
const label = `${config.name} - ${name}`;
```

---

## 2. Naming

### `naming/case-by-kind`

**Severity: `error`**

Case carries meaning: `PascalCase` for classes, React components and types,
`camelCase` for functions, variables and object properties, `UPPER_SNAKE_CASE`
for module-scope constants and for event and domain-code strings.

The case is the fastest signal of what an identifier is, and this project already
holds to it — 67 `UPPER_SNAKE_CASE` module constants, `PROVIDER_LOADERS` and
`SESSIONS_STORAGE_KEY` among them, against `PascalCase` models and components and
`camelCase` functions throughout. Domain error codes and event names are
`UPPER_SNAKE_CASE` for the same reason: they are constants that happen to travel
as strings.

Incorrect:

```ts
const provider_loaders = {
  OPENAI: () => import("./openai"),
};

class agent extends Model<AgentAttributes> {}

function AddConversation({ sessionId }) {}
```

Incorrect:

```ts
throw new Error("invalidTeamOrAgent");

await event.publish("sessionUserMessaged", { sessionId });
```

Correct:

```ts
const PROVIDER_LOADERS: Record<ProviderKey, () => Promise<{ default: LLMAdapter }>> = {
  OPENAI: () => import("./openai"),
};

class Agent extends Model<AgentAttributes> {}

async function addConversation({ sessionId }: { sessionId: string }) {}
```

Correct:

```ts
throw new Error("INVALID_TEAM_OR_AGENT");

await event.publish("SESSION_USER_MESSAGED", { sessionId });
```

Correct:

```ts
export type ProviderKey = "OPENAI" | "ANTHROPIC" | "BEDROCK" | "LOCAL" | "MOCK";

const SESSIONS_STORAGE_KEY = "chat-sessions";
```

---

### `naming/boolean-predicate-prefix`

**Severity: `warn`**

A boolean is named as a predicate — `is`, `has`, `should`, `can`, `enabled` — so
that a reader can tell a flag from a value at the call site.

`if (loading)` and `if (agent)` read the same and mean different things. The
prefix is what makes a condition legible without looking up the declaration, and
the codebase already uses it where it matters: `isLoading`, `isValid`,
`isSubmitting`, `isJson`, `hasLoadedOnce`.

Incorrect:

```ts
const submitting = false;
const valid = formState.isValid;
const supervision = step.status === "SUPERVISED_NEEDED";
```

Incorrect:

```ts
function knowledge(type: string) {
  return type === "QA" || type === "URL";
}
```

A predicate named as though it returned a knowledge record.

Correct:

```ts
const isSubmitting = false;
const isValid = formState.isValid;
const needsSupervision = step.status === "SUPERVISED_NEEDED";
```

Correct:

```ts
function isSupportedKnowledgeType(type: string) {
  return type === "QA" || type === "URL";
}
```

Correct:

```ts
const { isJson, parsedResult } = parseJsonResult(step.result);
```

---

### `naming/no-cryptic-abbreviations`

**Severity: `warn`**

Spell names out. Established domain acronyms — `LLM`, `MCP`, `API`, `AI`, `VM`,
`ASR`, `QA` — are names in their own right and stay; invented shortenings do not.

An abbreviation saves the writer a few characters once and costs every later
reader a lookup. The acronyms above appear in the product vocabulary, the
directory names and the API surface, so expanding them would be the confusing
change.

Incorrect:

```ts
const cfg = await platform.getModules();
const kn = await Knowledge.findByPk(id);

function calcRes(s: Step[]) {}
```

Incorrect:

```ts
const tmp = conversations.filter((c) => c.role === "USER");
const arr2 = tmp.map((c) => c.content);
```

`tmp` and `arr2` name the container, not the contents.

Correct:

```ts
const config = await platform.getModules();
const knowledge = await Knowledge.findByPk(id);

function calculateResultScore(steps: Step[]) {}
```

Correct:

```ts
const userConversations = conversations.filter((c) => c.role === "USER");
const userMessages = userConversations.map((c) => c.content);
```

Correct:

```ts
const llmLog = await LLMLog.findByPk(id);
const mcpClient = await mcp.connect(server);
const asrEndpoint = process.env.ASR_ENDPOINT_URL;
```

---

### `naming/match-the-domain-noun`

**Severity: `warn`**

Within a package, one concept has one name, and that name matches the noun the
surrounding layer uses.

A concept with two names is a concept you cannot grep for. The known live case is
the team/project split: the API noun is `project` and the UI noun is `team`, so
`useTeams` deliberately calls `/projects` and publishes `PROJECT_CREATED`. That
is a boundary translation and is correct. What is not correct is the same
translation leaking into a component's props, where neither convention holds.

Incorrect:

```tsx
function AgentCard({ colleague }: { colleague: { name: string } }) {
  return <Card>{colleague.name}</Card>;
}
```

A prop still carrying a pre-rename noun.

Incorrect:

```ts
async function listProjectAgents({ projectId }: { projectId: string }) {
  return Agent.findAll({ where: { teamId: projectId } });
}
```

Three names — `project`, `projectId`, `teamId` — for one thing, inside a single
function.

Correct:

```tsx
function AgentCard({ agent }: { agent: { name: string } }) {
  return <Card>{agent.name}</Card>;
}
```

Correct:

```ts
async function listTeamAgents({ teamId }: { teamId: string }) {
  return Agent.findAll({ where: { teamId } });
}
```

Correct:

```ts
const response = await http.post("/projects", team);

publish("PROJECT_CREATED", { projectId: response.data.id });

return { teams: data };
```

The API noun on the wire, the UI noun in the interface, and the translation
confined to the hook that spans them.

---

## 3. Functions

### `fn/named-function-declarations`

**Severity: `warn`**

Declare a module's exported functions with the `function` keyword, and keep arrow
functions for callbacks, inline handlers and short expressions.

A named declaration is hoisted, shows its name in stack traces and profiler
output, and reads as a definition rather than an assignment. The project is split
today — 383 `function` declarations against 481 arrow consts — and the
declaration form is what `functions/`, `lib/` and `actions/` in the API already
use.

Incorrect:

```ts
export const createSession = async ({ agentId }: { agentId: string }) => {
  return Session.create({ agentId });
};
```

Incorrect:

```ts
const run = async ({ parameters: { text }, meta }) => {
  return generate({ content: text, meta });
};

export default { run };
```

Correct:

```ts
async function create({ agentId }: { agentId: string }) {
  return Session.create({ agentId });
}

export default { create };
```

Correct:

```ts
async function run({ parameters: { text }, meta }) {
  return generate({ content: text, meta });
}

export default { run };
```

Correct:

```ts
const sorted = [...steps].sort((a, b) => a.order - b.order);
const userMessages = conversations.filter((c) => c.role === "USER");
```

Arrows are the right form for callbacks.

---

### `fn/single-object-parameter`

**Severity: `error`**

A function taking more than one argument takes a single destructured object with
an inline type, so every value is named at the call site.

Positional arguments are unreadable at three and dangerous at four —
`create(id, type, agentId, blueprintId)` has two adjacent optional strings that
swap silently. The object form also lets a parameter be added without touching
existing callers. Every function in `api/src/functions/` is written this way, and
there are no functions with four or more positional parameters in the project.

Incorrect:

```ts
async function addConversation(sessionId, role, agentId, content, blueprintId) {
  return Conversation.create({ sessionId, role, content });
}
```

Incorrect:

```ts
await addConversation(sessionId, "USER", agentId, content, blueprintId);
```

Four strings in a row at the call site, and nothing naming which is which.

Correct:

```ts
async function addConversation({
  sessionId,
  role,
  agentId,
  content,
  blueprintId,
}: {
  sessionId: string;
  agentId: string;
  role: string;
  content: string;
  blueprintId?: string;
}) {
  return Conversation.create({ sessionId, role, content });
}
```

Correct:

```ts
await addConversation({
  sessionId,
  role: "USER",
  agentId,
  content,
  blueprintId,
});
```

Correct:

```ts
function cleanIconName(icon?: string) {
  if (!icon) return "";

  return icon.replace(/^:+|:+$/g, "");
}
```

A single argument stays positional.

---

### `fn/guard-clauses-over-nesting`

**Severity: `warn`**

Handle the failing and empty cases first with an early return, and keep the
function's real work at one level of indentation.

Nesting the happy path inside `if` blocks pushes the important code to the right
and puts the condition it depends on several lines above it. Guard clauses put
each precondition next to the reason it exists, and the codebase already reads
this way in `functions/knowledge.ts` and in every route that checks a tenant.

Incorrect:

```ts
async function answer({ supervisingId, answer }) {
  const supervising = await Supervising.findByPk(supervisingId);

  if (supervising) {
    if (supervising.status !== "ANSWERED") {
      if (answer) {
        await supervising.update({ answer, status: "ANSWERED" });

        return supervising.toJSON();
      } else {
        throw new Error("INVALID_ANSWER");
      }
    } else {
      throw new Error("ALREADY_ANSWERED");
    }
  } else {
    throw new NotFoundError("SUPERVISING_NOT_FOUND");
  }
}
```

Incorrect:

```tsx
function AgentsWidget({ agents, loading, error }) {
  return (
    <>
      {loading ? (
        <AgentsSkeleton />
      ) : error ? (
        <Typography color="error.main">{error}</Typography>
      ) : agents.length ? (
        agents.map((agent) => <AgentCard key={agent.id} agent={agent} />)
      ) : (
        <AddNewButton addNew={"Agent"} />
      )}
    </>
  );
}
```

Correct:

```ts
async function answer({ supervisingId, answer }) {
  const supervising = await Supervising.findByPk(supervisingId);

  if (!supervising) {
    throw new NotFoundError("SUPERVISING_NOT_FOUND");
  }

  if (supervising.status === "ANSWERED") {
    throw new Error("ALREADY_ANSWERED");
  }

  if (!answer) {
    throw new Error("INVALID_ANSWER");
  }

  await supervising.update({ answer, status: "ANSWERED" });

  return supervising.toJSON();
}
```

Correct:

```tsx
function AgentsWidget({ agents, loading, error }) {
  if (loading) {
    return <AgentsSkeleton />;
  }

  if (error) {
    return <Typography color="error.main">{error}</Typography>;
  }

  if (!agents.length) {
    return <AddNewButton addNew={"Agent"} />;
  }

  return agents.map((agent) => <AgentCard key={agent.id} agent={agent} />);
}
```

---

### `fn/keep-functions-small`

**Severity: `warn`**

A function does one thing at one level of abstraction. When it grows past roughly
a screen, or its name needs an "and", split it.

Length is a symptom rather than the defect, but it tracks the defect closely
here. The five largest source files in the project are
`api/src/mcps/mcps.ts` at 8397 lines, `BlueprintFlowWidget.tsx` at 1541,
`api/src/functions/agent.ts` at 1260, `BlueprintFlowPlugin.tsx` at 1177 and
`SupervisingChat.tsx` at 1065 — and `SupervisingChat.tsx` is also one of the two
files carrying a blanket `eslint-disable`, because a file that large accumulates
violations faster than anyone fixes them.

Incorrect:

```ts
async function step({ stepId, action, parameters, comment, resultScore }) {
  const step = await Step.findByPk(stepId);
  const task = await Task.findByPk(step.taskId);
  const agent = await Agent.findByPk(task.agentId);

  const resolved = resolveParameterRefs(parameters, { steps: task.steps });
  const registryEntry = actions.find(action);
  const module = await import(`../actions/${registryEntry.lib}`);
  const result = await module.default.run({ parameters: resolved, meta });

  await step.update({ result, status: result.error ? "FAILED" : "COMPLETED" });

  const siblings = await Step.findAll({ where: { taskId: task.id } });
  const remaining = siblings.filter((s) => s.status !== "COMPLETED");

  if (remaining.length === 0) {
    await task.update({ status: "COMPLETED" });
    await event.publish("TASK_COMPLETED", { taskId: task.id });
  }

  const score = await scoreStep({ stepId, resultScore, comment });

  await StepScore.create({ stepId, score, agentId: agent.id });
}
```

Resolve, dispatch, persist, advance the task and score it — five jobs, and no
name for any of them.

Incorrect:

```ts
async function createAgentAndSeedKnowledge({ teamId, agent, knowledge }) {
  const created = await Agent.create({ ...agent, teamId });

  for (const item of knowledge) {
    await knowledgeFn.create({ agentId: created.id, knowledge: item });
  }

  return created;
}
```

The "and" in the name is the tell. Two callers want two different halves of this,
and neither can have one.

Correct:

```ts
async function step({ stepId, action, parameters, comment, resultScore }) {
  const step = await Step.findByPk(stepId);

  if (!step) {
    throw new NotFoundError("STEP_NOT_FOUND");
  }

  const result = await runAction({ step, action, parameters });

  await step.update({ result, status: result.error ? "FAILED" : "COMPLETED" });

  await completeTaskIfFinished({ taskId: step.taskId });
  await recordStepScore({ stepId, resultScore, comment });

  return step.toJSON();
}
```

Correct:

```ts
async function completeTaskIfFinished({ taskId }: { taskId: string }) {
  const steps = await Step.findAll({ where: { taskId } });

  if (steps.some((step) => step.status !== "COMPLETED")) {
    return false;
  }

  await Task.update({ status: "COMPLETED" }, { where: { id: taskId } });
  await event.publish("TASK_COMPLETED", { taskId });

  return true;
}
```

Each extracted function is named for the decision it owns, which is what makes
the caller readable without opening any of them.

---

## 4. Types

### `ts/no-any`

**Severity: `error`**

`any` does not appear in code you write. Reach for the real type, a narrow
interface, or `unknown` with a check.

`any` disables checking for every expression it touches and spreads through
assignments silently. There are 115 `any` annotations across the project today,
concentrated in `mcp/servers` (24 files) and `api/src` (19), and they are the
reason a typo like `agent.nmae` compiles. The cost is highest exactly where the
compiler is weakest: `api/tsconfig.json` sets `strict: true` but
`noImplicitAny: false`, and `dashboard/tsconfig.json` sets `strict: false`, so an
untyped parameter is already `any` without anyone writing it.

Incorrect:

```ts
function resolveParameterRefs(parameters: any, context: any): any {
  return parameters;
}
```

Incorrect:

```ts
const response = (await client.chat.completions.create(payload)) as any;

return response.choices[0].message.content;
```

Incorrect:

```ts
await event.subscribe("TASK_CREATED", async (payload: any) => {
  await agentFn.task({ taskId: payload.taskId });
});
```

Correct:

```ts
function resolveParameterRefs(
  parameters: Record<string, unknown>,
  context: { steps: Step[] }
): Record<string, unknown> {
  return parameters;
}
```

Correct:

```ts
function getByPath(source: unknown, path: string): unknown {
  let current: unknown = source;

  for (const part of path.split(".")) {
    if (current == null) return undefined;

    current = (current as Record<string, unknown>)[part];
  }

  return current;
}
```

`unknown` at the boundary, narrowed at the point of use — the shape
`lib/parameterRefs.ts` already uses.

Correct:

```ts
await event.subscribe<{ taskId: string }>("TASK_CREATED", ({ taskId }) =>
  agentFn.task({ taskId })
);
```

---

### `ts/share-union-types`

**Severity: `error`**

A domain value with a fixed set of members is declared once as an exported union
type and imported wherever it is used — never re-spelled inline and never left as
a bare `string`.

The status vocabulary is currently written out by hand in at least six places
with three different member sets: `"COMPLETED" | "FAILED" | "SUPERVISED"` in
`functions/stepScore.ts` and `models/StepScore.ts`, `"COMPLETED" | "FAILED"` and
`"IN_PROGRESS" | "COMPLETED" | "FAILED"` in `functions/task.ts`, and
`"IN_PROGRESS" | "COMPLETED"` in `models/Knowledge.ts`. Around them the same
strings appear as bare literals 349 times for `"COMPLETED"` alone, 34 for
`"IN_PROGRESS"`, 26 for `"FAILED"`, 13 for `"ANSWERED"` and 7 for
`"SUPERVISED_NEEDED"`. Adding a member means finding every one of those sites by
hand.

The project uses union types rather than `enum` — there is not a single `enum` in
the codebase — and that is the convention to keep, because a union erases at
compile time and compares as a plain string across the event bus and the wire.

Incorrect:

```ts
async function update({ taskId, status }: { taskId: string; status: string }) {
  return Task.update({ status }, { where: { id: taskId } });
}
```

`string` accepts `"complete"`, `"Completed"` and `"done"` equally.

Incorrect:

```ts
async function updateStep({ status }: { status: "COMPLETED" | "FAILED" }) {}

async function listSteps({
  status,
}: {
  status?: "IN_PROGRESS" | "COMPLETED" | "FAILED";
}) {}
```

Two inline unions for one concept, in one file, already disagreeing.

Correct:

```ts
export type TaskStatus = "IN_PROGRESS" | "COMPLETED" | "FAILED";
export type StepScoreStatus = "COMPLETED" | "FAILED" | "SUPERVISED";
export type KnowledgeStatus = "IN_PROGRESS" | "COMPLETED";
```

Correct:

```ts
import type { TaskStatus } from "../types/status";

async function update({
  taskId,
  status,
}: {
  taskId: string;
  status: TaskStatus;
}) {
  return Task.update({ status }, { where: { id: taskId } });
}
```

Correct:

```ts
import type { KnowledgeStatus } from "../types/status";

@Column(DataType.ENUM("IN_PROGRESS", "COMPLETED"))
declare status: KnowledgeStatus;
```

The model column and the shared type are declared together, so a new member is
one edit in each.

---

### `ts/unknown-in-catch`

**Severity: `error`**

A caught error is `unknown` and is narrowed before its properties are read.

TypeScript types a caught value as `unknown` under `useUnknownInCatchVariables`,
and annotating it `any` throws that away — `error.message` on a thrown string is
`undefined`, and on a thrown object is whatever happened to be there. Five
`catch (err: any)` clauses exist today. The narrowing idiom is already established
in `server.ts`, `lib/jsonParse.ts` and `app.ts`.

Incorrect:

```ts
try {
  await agentFn.chat({ agentId, sessionId, content });
} catch (error: any) {
  await event.publish("ERROR_OCCURRED", { sessionId, message: error.message });
}
```

Incorrect:

```ts
} catch (err) {
  platform.logger.error({ message: "Failed", error_message: err.message });
}
```

`err` is `unknown`, so this does not compile under `strict` and reads as though
it does.

Correct:

```ts
try {
  await agentFn.chat({ agentId, sessionId, content });
} catch (error) {
  const message =
    error instanceof Error && error.message
      ? error.message
      : "An error occurred while processing your message.";

  await event.publish("ERROR_OCCURRED", { sessionId, message });
}
```

Correct:

```ts
} catch (err) {
  platform.logger.error({
    message: "Failed to write LLMLog",
    error_message: err instanceof Error ? err.message : String(err),
  });
}
```

---

### `ts/no-suppression-comments`

**Severity: `error`**

`@ts-ignore` and `@ts-nocheck` do not appear. Fix the type, narrow the value, or
declare the shape the compiler is missing.

A suppression silences every error on the line, including ones introduced later,
and it is invisible to `tsc --noEmit` by design. There is one `@ts-ignore` in the
project, at `api/src/functions/agent.ts:552`, and it sits in the largest function
in the largest file in that package — which is the usual pairing.

Where a suppression is genuinely unavoidable, `@ts-expect-error` with a reason is
the form to use: it fails the build once the underlying error is fixed, so it
cannot outlive its cause.

Incorrect:

```ts
// @ts-ignore
const result = await module.default.run({ parameters, meta });
```

Incorrect:

```ts
// @ts-nocheck
import platform from "@canmingir/link-express";
```

Correct:

```ts
type ActionModule = {
  default: {
    run(input: {
      parameters: Record<string, unknown>;
      meta?: LLMMeta;
    }): Promise<Record<string, unknown>>;
  };
};

const module = (await import(`../actions/${lib}`)) as ActionModule;

const result = await module.default.run({ parameters, meta });
```

Correct:

```ts
// @ts-expect-error upstream type ships `icon` as required; fixed in link-express 1.8
<Iconify icon={undefined} />
```

---

### `ts/no-non-null-assertion`

**Severity: `warn`**

Do not assert a value away with `!`. Check it, or type it as optional and use
optional chaining.

`agent!.teamId` tells the compiler to stop asking and does nothing at run time, so
the `TypeError` still happens — it just happens without a warning first. Five
non-null assertions exist today. Optional chaining and a guard cover every case
they do, and produce a real branch.

Incorrect:

```ts
const agent = await Agent.findByPk(agentId);

if (agent!.teamId !== teamId) {
  return res.status(401).end();
}
```

Incorrect:

```tsx
<Typography>{team!.name}</Typography>
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
```

Correct:

```tsx
<Typography>{team?.name}</Typography>
```

Correct:

```ts
const knowledge = await Knowledge.findByPk(knowledgeId);

if (!knowledge) {
  throw new NotFoundError("KNOWLEDGE_NOT_FOUND");
}

return knowledge.toJSON();
```

---

## 5. Control flow

### `flow/no-nested-ternary`

**Severity: `warn`**

One ternary per expression. A second condition becomes an `if`, an early return,
or a lookup.

Nested ternaries have no visual structure — the reader has to count `?` and `:`
to find which branch belongs to which test — and they resist adding a fourth case
without a rewrite. A single ternary chosen between two values is fine and is used
throughout.

Incorrect:

```tsx
{isLoading ? (
  <AgentsSkeleton />
) : error ? (
  <Typography color="error.main">{error}</Typography>
) : (
  agents.map((agent) => <AgentCard key={agent.id} agent={agent} />)
)}
```

Incorrect:

```ts
const status = result.error
  ? "FAILED"
  : result.needsSupervision
    ? "SUPERVISED_NEEDED"
    : "COMPLETED";
```

Correct:

```ts
function resolveStepStatus(result: ActionResult): StepStatus {
  if (result.error) {
    return "FAILED";
  }

  if (result.needsSupervision) {
    return "SUPERVISED_NEEDED";
  }

  return "COMPLETED";
}
```

Correct:

```tsx
const height = isSmall ? 240 : 360;
const source = agentId ? knowledges : teamKnowledges;
```

Correct:

```tsx
if (isLoading) {
  return <AgentsSkeleton />;
}

if (error) {
  return <Typography color="error.main">{error}</Typography>;
}

return agents.map((agent) => <AgentCard key={agent.id} agent={agent} />);
```

---

### `flow/exhaustive-switch`

**Severity: `error`**

A `switch` over a union type handles every member, and its `default` branch
either returns a real fallback or fails loudly — never falls through silently.

`noFallthroughCasesInSwitch` is on in `dashboard/tsconfig.json` and off in
`api/tsconfig.json`, so only half the project catches a missing `break`. Neither
catches a missing *case*: a `switch` on a union with no `default` returns
`undefined` for a member added later, and the caller renders blank. The `never`
assignment below makes the compiler fail instead, at the moment the union grows.

Incorrect:

```tsx
function getTableHead(selectedType) {
  switch (selectedType) {
    case "URL":
      return [
        { id: "url", label: "URL" },
        { id: "status", label: "Status" },
      ];
    case "QA":
      return [
        { id: "question", label: "Question" },
        { id: "answer", label: "Answer" },
      ];
  }
}
```

A `TEXT` knowledge type returns `undefined`, and the table renders no header at
all.

Incorrect:

```ts
switch (step.status) {
  case "COMPLETED":
    count.completed += 1;
  case "FAILED":
    count.failed += 1;
    break;
}
```

A missing `break` that `api/tsconfig.json` does not catch.

Correct:

```tsx
function getTableHead(selectedType: KnowledgeType) {
  switch (selectedType) {
    case "URL":
      return [
        { id: "url", label: "URL" },
        { id: "status", label: "Status" },
        { id: "", label: "" },
      ];
    case "QA":
      return [
        { id: "question", label: "Question" },
        { id: "answer", label: "Answer" },
        { id: "", label: "" },
      ];
    case "TEXT":
      return [
        { id: "text", label: "Text" },
        { id: "", label: "" },
      ];
    default:
      return [{ id: "", label: "" }];
  }
}
```

Correct:

```ts
function describeStatus(status: TaskStatus): string {
  switch (status) {
    case "IN_PROGRESS":
      return "Running";
    case "COMPLETED":
      return "Done";
    case "FAILED":
      return "Failed";
    default: {
      const exhaustive: never = status;

      throw new Error(`UNHANDLED_TASK_STATUS_${String(exhaustive)}`);
    }
  }
}
```

Adding a member to `TaskStatus` now fails `tsc` at this line rather than
returning `undefined` at run time.

---

### `flow/array-methods-over-index-loops`

**Severity: `warn`**

Transform collections with `map`, `filter`, `find`, `some` and `reduce`. Keep
`for` loops for genuine iteration with early exit or index arithmetic.

The method name states the intent — `filter` returns a subset, `map` returns the
same length, `some` returns a boolean — where a `for` loop with a manual
accumulator makes the reader reconstruct it. `for` remains the right tool where
the loop breaks early or walks indices, as it does in
`lib/jsonParse.ts`.

Incorrect:

```ts
const contents = [];

for (let i = 0; i < conversations.length; i++) {
  if (conversations[i].role === "USER") {
    contents.push(conversations[i].content);
  }
}
```

Incorrect:

```ts
let hasIncomplete = false;

steps.forEach((step) => {
  if (step.status !== "COMPLETED") {
    hasIncomplete = true;
  }
});
```

`forEach` plus an external flag is `some` written the long way, and it cannot
stop early.

Correct:

```ts
const contents = conversations
  .filter((conversation) => conversation.role === "USER")
  .map((conversation) => conversation.content);
```

Correct:

```ts
const hasIncomplete = steps.some((step) => step.status !== "COMPLETED");
```

Correct:

```ts
for (const ch of content) {
  if (escaped) {
    escaped = false;
    continue;
  }

  if (ch === "{" || ch === "[") stack.push(ch);
}
```

A character walk with mutable state and early `continue` — a real loop.

---

## 6. Asynchrony

### `async/await-over-then`

**Severity: `warn`**

Sequence asynchronous work with `async`/`await`. `.then` is for the narrow cases
where a promise is deliberately not awaited or is being adapted to a callback
API.

Mixing the two styles in one function makes the order of operations hard to read
and makes errors land in two different places — a `try/catch` does not catch a
rejection inside a `.then` callback that follows it. There are 19 `.then` chains
in the project; the legitimate ones are the fire-and-forget writes and the
memoized provider load in `lib/llm.ts`.

Incorrect:

```ts
function loadSteps(taskId: string) {
  return taskFn.listSteps({ taskId }).then((steps) => {
    return steps.filter((step) => step.status !== "COMPLETED");
  });
}
```

Incorrect:

```tsx
useEffect(() => {
  http.get(`/tasks/${taskId}/steps`).then((res) => {
    setSteps(res.data);
  });
}, [taskId]);
```

Correct:

```ts
async function loadSteps(taskId: string) {
  const steps = await taskFn.listSteps({ taskId });

  return steps.filter((step) => step.status !== "COMPLETED");
}
```

Correct:

```ts
function getLLM(): Promise<LLMAdapter> {
  if (!llmPromise) {
    llmPromise = PROVIDER_LOADERS[provider]().then((mod) => mod.default);
  }

  return llmPromise;
}
```

`.then` used to store a promise rather than to sequence work.

Correct:

```ts
LLMLog.create(row).catch((err) =>
  platform.logger.error({
    message: "Failed to write LLMLog",
    error_message: err instanceof Error ? err.message : String(err),
  })
);
```

---

### `async/no-floating-promises`

**Severity: `error`**

Every promise is awaited, returned, or given its own `.catch`. None is left
dangling.

An unawaited promise means the caller continues before the work finishes and its
rejection reaches `process.on("unhandledRejection")` in `server.ts` with no
context about what started it. In the dashboard it surfaces as an unhandled
rejection in the console and nothing else. Logging and metrics writes are the
legitimate fire-and-forget cases, which is exactly why they must carry their own
handler.

Incorrect:

```ts
async function answer({ supervisingId, answer }) {
  await supervising.update({ answer, status: "ANSWERED" });

  event.publish("SUPERVISING_ANSWERED", { supervisingId });
}
```

Incorrect:

```ts
function logLLM(params): void {
  LLMLog.create(params);
}
```

Incorrect:

```ts
void metricsExporter.push(payload);
```

`void` marks the promise as deliberately unawaited and still leaves the rejection
unhandled.

Correct:

```ts
async function answer({ supervisingId, answer }) {
  await supervising.update({ answer, status: "ANSWERED" });

  await event.publish("SUPERVISING_ANSWERED", { supervisingId });
}
```

Correct:

```ts
function logLLM(params): void {
  LLMLog.create(params).catch((err) =>
    platform.logger.error({
      message: "Failed to write LLMLog",
      error_message: err instanceof Error ? err.message : String(err),
    })
  );
}
```

---

### `async/parallelise-independent-work`

**Severity: `warn`**

Awaits that do not depend on each other run together through `Promise.all`. Await
in sequence only where a later call needs an earlier result.

Sequential awaits over independent calls cost the sum of their latencies instead
of the maximum, and this code is latency-bound — every action step is a network
call, and several are LLM completions. `Promise.all` appears in 10 places already;
the pattern is established, not novel.

Incorrect:

```ts
const agent = await Agent.findByPk(agentId);
const engines = await AIEngine.findAll();
const pricings = await ModelPricing.findAll();
```

Incorrect:

```ts
const results = [];

for (const url of urls) {
  results.push(await scrape(url));
}
```

Each scrape waits for the previous one although none of them depends on it.

Correct:

```ts
const [agent, engines, pricings] = await Promise.all([
  Agent.findByPk(agentId),
  AIEngine.findAll(),
  ModelPricing.findAll(),
]);
```

Correct:

```ts
const results = await Promise.all(urls.map((url) => scrape(url)));
```

Correct:

```ts
const step = await Step.findByPk(stepId);
const task = await Task.findByPk(step.taskId);
```

Sequential because the second lookup needs the first result.

---

## 7. Errors

### `error/no-empty-catch`

**Severity: `error`**

A `catch` block does something — handles, logs, converts, or returns a documented
fallback. It is never empty.

An empty `catch` deletes the only evidence that something failed. There is one in
the project, at `mcp/servers/grey/tools/knowledge_lookup.ts:38`, where a failed
`JSON.parse` of an error body leaves the caller with a generic message and no
record of why. Note that the deliberate `return null` in the dashboard's mutation
hooks is not an empty catch — it is a documented contract that callers branch on,
covered by `data/mutations-swallow-and-return-null` in
`dashboard/architecture.md`.

Incorrect:

```ts
try {
  const parsed = body ? JSON.parse(body) : null;

  if (parsed && parsed.error) errorMessage = parsed.error;
} catch (_) {}
```

Incorrect:

```ts
try {
  await event.publish("TASK_COMPLETED", { taskId });
} catch (error) {
  // ignore
}
```

A comment is not handling.

Correct:

```ts
try {
  const parsed = body ? JSON.parse(body) : null;

  if (parsed && parsed.error) errorMessage = parsed.error;
} catch (error) {
  platform.logger.warn({
    message: "Knowledge lookup returned a non-JSON error body",
    body,
  });
}
```

Correct:

```ts
try {
  return { isJson: true, parsedResult: JSON.parse(String(result)) };
} catch (error) {
  return { isJson: false, parsedResult: result };
}
```

A fallback that is the function's documented return shape, as
`utils/formatters.ts` writes it.

---

### `error/preserve-the-cause`

**Severity: `error`**

When you catch an error and throw a different one, attach the original as
`cause`.

Replacing an error with a domain code is right — `platform.error.handle` maps
codes to responses, and a code is what tests and logs compare on. Discarding the
original is what makes the resulting log line useless: `MCP_TOKEN_EXCHANGE_FAILED`
with no indication of whether the provider returned 401, timed out, or sent
malformed JSON.

Incorrect:

```ts
try {
  return await exchangeToken(code);
} catch (error) {
  throw new Error("MCP_TOKEN_EXCHANGE_FAILED");
}
```

Incorrect:

```ts
try {
  return await client.chat.completions.create(payload);
} catch (error) {
  throw new Error(`Provider call failed: ${JSON.stringify(payload)}`);
}
```

The cause is dropped and the payload — which carries the prompt and may carry
credentials — is put in the message instead.

Correct:

```ts
try {
  return await exchangeToken(code);
} catch (error) {
  throw new Error("MCP_TOKEN_EXCHANGE_FAILED", { cause: error });
}
```

Correct:

```ts
try {
  return await client.chat.completions.create(payload);
} catch (error) {
  platform.logger.error({
    message: "Provider call failed",
    provider,
    model,
    error_message: error instanceof Error ? error.message : String(error),
  });

  throw new Error("LLM_GENERATION_FAILED", { cause: error });
}
```

The code goes to the client, the detail goes to the log, and the original error
stays reachable.

---

### `error/fail-fast-on-missing-configuration`

**Severity: `error`**

Required configuration is read once and validated at the point of use, and a
missing value throws with a message naming the variable.

Configuration that is absent produces `undefined` in a request path, a URL
containing the string `undefined`, or a client constructed with no credentials —
all of which fail later, somewhere unrelated, with a message that does not name
the cause. `lib/llm.ts` sets the shape to copy: its `parseProviderModel` names
the variable, the received value and the valid set.

Incorrect:

```ts
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
```

Incorrect:

```ts
const launchTemplateId = process.env.AWS_LAUNCH_TEMPLATE_ID;

new RunInstancesCommand({
  LaunchTemplate: { LaunchTemplateId: launchTemplateId, Version: "$Latest" },
});
```

Incorrect:

```ts
const provider = (process.env.PLATFORM_LLM || "local")
  .split("/")[0]
  .toUpperCase() as ProviderKey;

const adapter = await PROVIDER_LOADERS[provider]();
```

An unknown provider makes the lookup `undefined`, and the failure is
`is not a function` at the first generation.

Correct:

```ts
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error("OPENAI_API_KEY_MISSING");
}

const client = new OpenAI({ apiKey });
```

Correct:

```ts
const launchTemplateId = process.env.AWS_LAUNCH_TEMPLATE_ID;

if (!launchTemplateId) {
  return { error: "AWS_LAUNCH_TEMPLATE_ID is not configured" };
}
```

Inside an action, an anticipated failure is returned rather than thrown — see
`action/return-errors-do-not-throw` in `api/architecture.md`.

Correct:

```ts
if (!(provider in PROVIDER_LOADERS)) {
  throw new Error(
    `Unknown LLM provider "${providerPart}" in PLATFORM_LLM="${raw}". ` +
      `Expected "<provider>/<model>" where provider is one of: ` +
      Object.keys(PROVIDER_LOADERS).join(", ")
  );
}
```

---

## 8. Constants and literals

### `const/name-repeated-literals`

**Severity: `error`**

A literal that carries meaning and appears more than once is a named constant or
a member of a shared union type — not a string or number retyped at each site.

`"COMPLETED"` appears 349 times in `api/src` alone, `"IN_PROGRESS"` 34,
`"FAILED"` 26, `"ANSWERED"` 13 and `"SUPERVISED_NEEDED"` 7. Every one is a place
a typo compiles and silently never matches, and every one has to be found by hand
when a status is renamed. Typing the value through a shared union — see
[`ts/share-union-types`](#tsshare-union-types) — catches the typo; naming the
polling intervals and thresholds catches the rest.

Incorrect:

```ts
await step.update({ status: "COMPLETED" });

const remaining = steps.filter((s) => s.status !== "COMPLETD");
```

The typo is a valid string, so the filter quietly matches everything.

Incorrect:

```tsx
useEffect(() => {
  const interval = setInterval(() => getSteps(taskId), 2000);

  return () => clearInterval(interval);
}, [taskId]);
```

`2000` appears in `useChat`, `TasksWidget` and the knowledge-status watcher, with
nothing tying them together or explaining the number.

Incorrect:

```ts
if (steps.length > 50) {
  throw new Error("TOO_MANY_STEPS");
}
```

Correct:

```ts
import type { StepStatus } from "../types/status";

const status: StepStatus = "COMPLETED";

await step.update({ status });
```

Correct:

```tsx
const STEP_POLL_INTERVAL_MS = 2000;

useEffect(() => {
  const interval = setInterval(() => getSteps(taskId), STEP_POLL_INTERVAL_MS);

  return () => clearInterval(interval);
}, [taskId]);
```

Correct:

```ts
const MAX_STEPS_PER_TASK = 50;

if (steps.length > MAX_STEPS_PER_TASK) {
  throw new Error("TOO_MANY_STEPS");
}
```

A literal used once, in the place it means something, needs no name —
`res.status(404)` and `slice(0, 5)` next to the rule that explains the five are
clearer inline.

---

### `const/module-scope-static-data`

**Severity: `warn`**

Static data — option lists, presets, tab definitions, sample records — is
declared once at module scope, above the function that uses it, and is never
reassigned.

Rebuilding a constant array inside a render or a request handler allocates on
every call and, in React, produces a new reference that defeats every
memoization and dependency check downstream. Module scope also makes the data
greppable. This is about immutable data specifically: mutable module-scope state
shared between components is a separate and more serious problem, covered by
`state/no-module-level-mutable-singletons` in `dashboard/architecture.md`.

Incorrect:

```tsx
function AgentLayout({ agent }) {
  const TABS = [
    { value: "profile", label: "Profile" },
    { value: "tasks", label: "Tasks" },
    { value: "api", label: "API" },
  ];

  const visibleTabs = useMemo(
    () => TABS.filter((tab) => !beta || tab.value !== "api"),
    [beta, TABS]
  );
}
```

`TABS` is a new array every render, so the `useMemo` never hits.

Incorrect:

```ts
async function run({ parameters: { text } }) {
  const supportedLanguages = ["tr", "en", "es"];

  return generate({ content: text, languages: supportedLanguages });
}
```

Correct:

```tsx
const TABS = [
  { value: "profile", label: "Profile" },
  { value: "tasks", label: "Tasks" },
  { value: "api", label: "API" },
];

function AgentLayout({ agent }) {
  const visibleTabs = useMemo(
    () => TABS.filter((tab) => !beta || tab.value !== "api"),
    [beta]
  );
}
```

Correct:

```ts
const SUPPORTED_LANGUAGES = ["tr", "en", "es"] as const;

async function run({ parameters: { text } }) {
  return generate({ content: text, languages: SUPPORTED_LANGUAGES });
}
```

`as const` is what stops the array widening to `string[]` and keeps the members
usable as a type.

---

## 9. Comments

### `comment/explain-why`

**Severity: `warn`**

Code carries the *what*. A comment exists only where the *why* cannot be read
from the code — a workaround, a non-obvious constraint, a decision that looks
wrong until explained.

A comment restating the line above it is a second thing to keep in sync, and it
goes stale the first time the code changes without it. The model to copy is the
comment above `repairUnbalancedJSON` in `api/src/lib/jsonParse.ts`: it records
that some models on Bedrock truncate trailing braces, which is a fact about the
outside world that no amount of reading the function would reveal.

Incorrect:

```ts
// get the agent
const agent = await Agent.findByPk(agentId);

// if there is no agent, return 404
if (!agent) {
  return res.status(404).end();
}

// increment the counter
count += 1;
```

Incorrect:

```ts
/**
 * @param agentId the agent id
 * @param teamId the team id
 * @returns the agent
 */
async function get({ agentId, teamId }: { agentId: string; teamId: string }) {}
```

JSDoc that repeats the signature adds nothing the types do not already say, and
`react/prop-types` is off precisely because the types are the documentation.

Correct:

```ts
// Some models (observed on Llama via Bedrock) occasionally drop the final
// closing brace(s) when emitting JSON as plain text. This repairs unbalanced
// braces/brackets (tracked outside of string literals) before re-parsing.
function repairUnbalancedJSON(content: string): string | null {}
```

Correct:

```tsx
<span
  contentEditable={false}
  className={css`
    font-size: 0;
  `}
>
  {String.fromCodePoint(160)}
</span>
```

with the reason recorded once, in the component's name and a single line above
it: the zero-width span works around a Chromium selection bug at inline-void
boundaries in `contentEditable`.

Correct:

```ts
// eslint-disable-next-line react-hooks/exhaustive-deps
}, dependencies);
```

A suppression comment names the rule and, by sitting on the line it applies to,
explains itself.

---

### `comment/no-commented-out-code`

**Severity: `error`**

Dead code is deleted, not commented out. Git has the history.

Commented-out code cannot be linted, type-checked, tested or refactored, and it
gives no indication of whether it is a work in progress, a rollback, or something
forgotten years ago. Four such blocks exist under `src` today, and `server.ts`
reaches `config.kafka.ts` and `config.txq.ts` only through commented-out import
lines — which is why
[`build/no-dead-tsconfig`](api/architecture.md) flags those two files as
unreferenced.

Incorrect:

```ts
import config from "./config";
// import config from "./config.kafka";
// import config from "./config.txq";
```

Incorrect:

```ts
async function chat({ agentId, sessionId, content }) {
  // const history = await listConversations({ sessionId });
  // const summary = await summarize({ history });

  return generate({ content, meta: { agentId, sessionId } });
}
```

Correct:

```ts
import config from "./config";
```

with `config.kafka.ts` and `config.txq.ts` either deleted or selected by a real
branch.

Correct:

```ts
const config =
  process.env.PLATFORM_EVENT === "kafka"
    ? await import("./config.kafka")
    : await import("./config");
```

Correct:

```ts
async function chat({ agentId, sessionId, content }) {
  return generate({ content, meta: { agentId, sessionId } });
}
```

---

## 10. Formatting and enforcement

### `format/prettier-owns-layout`

**Severity: `error`**

Prettier decides line breaks, quotes, semicolons and indentation. Do not hand-format
around it, and do not add per-file style overrides.

`api/.eslintrc.json` and `dashboard/.eslintrc.json` both extend
`plugin:prettier/recommended`, which reports formatting as an ESLint error, so
hand-formatted code fails `bun run lint` rather than merely looking different.
`dashboard/.prettierrc` carries a single override — `printWidth: 1000` for
`*.html` — and everything else is Prettier defaults on purpose: an unshared
formatting preference is a permanent diff against everyone else's editor.

Incorrect:

```ts
const agent = await Agent.findOne( { where : { id : validatedId, teamId } } )
```

Incorrect:

```ts
/* eslint-disable prettier/prettier */
const PROVIDER_LOADERS = { OPENAI: () => import("./openai"),
                           ANTHROPIC: () => import("./anthropic") };
```

Hand-aligned columns held in place by a suppression, which the next rename
breaks.

Correct:

```ts
const agent = await Agent.findOne({ where: { id: validatedId, teamId } });
```

Correct:

```ts
const PROVIDER_LOADERS: Record<ProviderKey, () => Promise<{ default: LLMAdapter }>> = {
  OPENAI: () => import("./openai"),
  ANTHROPIC: () => import("./anthropic"),
};
```

Correct:

```json
{
  "overrides": [
    {
      "files": "*.html",
      "options": {
        "printWidth": 1000
      }
    }
  ]
}
```

A shared, committed override with a reason — long attribute lists in
`index.html` — rather than a personal one.

---

### `lint/scope-every-suppression`

**Severity: `error`**

A lint suppression names the rule it disables and covers the smallest possible
span — one line where one line will do, never a whole file.

A bare `/* eslint-disable */` removes the file from every rule, not the
inconvenient one: `no-eval`, `eqeqeq`, `react-hooks/rules-of-hooks` and the rest
go with it. `dashboard/` runs lint with `--max-warnings 0` and lint is one of only
two checks CI performs there, so a blanket disable is a hole in the gate. Two
files do this today, and `SupervisingChat.tsx` — over a thousand lines, with data
hooks and dialogs in it — is one of them.
[`lint/no-blanket-disable`](dashboard/architecture.md) states the dashboard case;
this rule extends it to every package.

Incorrect:

```ts
/* eslint-disable */
import IconButton from "@mui/material/IconButton";
```

Incorrect:

```ts
/* eslint-disable sort-imports, react-hooks/exhaustive-deps, no-unused-vars */
```

Three rules disabled for a whole file where one line needed one of them.

Incorrect:

```ts
// eslint-disable-next-line
const parsed = JSON.parse(body);
```

A line-scoped suppression with no rule name still disables everything on the
line.

Correct:

```ts
/* eslint-disable @typescript-eslint/no-namespace */
declare namespace Cypress {
  interface Chainable {
    getBySel(selector: string): Chainable<JQuery<HTMLElement>>;
  }
}
```

One rule, named, with the declaration it exists for directly beneath it.

Correct:

```ts
useEffect(() => {
  fetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, dependencies);
```

---

### `ci/lint-and-typecheck-every-package`

**Severity: `error`**

Every package with source code has a `lint` script and a `typecheck` script, and
the root scripts run all of them.

Half the repository is currently unchecked. Root `lint` is
`bun run lint:dashboard` and root `typecheck` is `typecheck:dashboard`, so the
`Test` workflow never touches the other packages. `api/` has a `lint` script that
nothing at the root calls and no `typecheck` script at all, despite
`api/tsconfig.json` setting `strict: true`. `communication/` and `mcp/` each carry
a `.eslintrc.json` with no script to run it. `server-dashboard/` has neither. The
gap is not abstract — it is why an invalid duplicate import, an authorization
bypass and two sets of committed credentials all survived in `api/`.

`api/architecture.md` states the API half of this as
[`ci/verify-the-api`](api/architecture.md) and
[`ts/run-the-type-checker`](api/architecture.md); this rule is the project-wide
form.

Incorrect:

```json
"lint": "bun run lint:dashboard",
"typecheck": "bun run typecheck:dashboard"
```

Incorrect:

```json
"scripts": {
  "dev": "bun --watch server.ts",
  "build": "node build.prod.js"
}
```

`communication/package.json` — a `.eslintrc.json` sits beside it with nothing to
run it.

Incorrect:

```json
"lint": "eslint . --ext .ts"
```

`api/`'s script, without `--max-warnings 0`, so warnings accumulate silently
while the dashboard's identical rules fail the build.

Correct:

```json
"lint:api": "cd ./api && bun run lint",
"lint:dashboard": "cd ./dashboard && bun run lint",
"lint:communication": "cd ./communication && bun run lint",
"lint:mcp": "cd ./mcp && bun run lint",
"lint": "bun run lint:api && bun run lint:dashboard && bun run lint:communication && bun run lint:mcp",
"typecheck:api": "cd ./api && bun run typecheck",
"typecheck:dashboard": "cd ./dashboard && bun run typecheck",
"typecheck": "bun run typecheck:api && bun run typecheck:dashboard"
```

Correct:

```json
"scripts": {
  "lint": "eslint . --ext .ts --max-warnings 0",
  "typecheck": "tsc --noEmit"
}
```

The per-package pair, identical in every package.

Correct:

```yaml
- name: Check lint
  run: bun run lint

- name: Typecheck
  run: bun run typecheck

- name: Test
  run: bun run test
```

Turn these on one package at a time and expect each to fail on its first run. The
failures are the existing debt, not a reason to leave the gate off.

---

## 11. Data and immutability

### `data/no-parameter-mutation`

**Severity: `error`**

A function does not mutate the objects or arrays it was given. Build and return a
new value instead.

The caller has no way to know its argument was changed, so the effect surfaces
somewhere unrelated — a list that reorders itself when a helper is called for its
return value, a payload that grows a field between two `publish` calls. It is
worse in the dashboard, where React compares by reference: mutating an array in
place leaves the reference identical, so the component holding it does not
re-render and the screen shows stale data that the state says is fresh.

Incorrect:

```ts
function markCompleted(step: Step) {
  step.status = "COMPLETED";

  return step;
}
```

Incorrect:

```ts
async function publishStepAdded(payload: StepPayload) {
  payload.publishedAt = new Date().toISOString();

  await event.publish("STEP_ADDED", payload);
}
```

The caller's object silently grows a field it never declared.

Incorrect:

```tsx
function renderMatches({ matches }) {
  matches.sort((a, b) => a.index - b.index);

  return matches.map((match) => <Mention key={match.id} match={match} />);
}
```

`matches.sort` reorders the caller's array in place — the shape at
`BlueprintChatTitle.tsx:91` today.

Correct:

```ts
function markCompleted(step: Step): Step {
  return { ...step, status: "COMPLETED" };
}
```

Correct:

```ts
async function publishStepAdded(payload: StepPayload) {
  await event.publish("STEP_ADDED", {
    ...payload,
    publishedAt: new Date().toISOString(),
  });
}
```

Correct:

```tsx
function renderMatches({ matches }) {
  const ordered = [...matches].sort((a, b) => a.index - b.index);

  return ordered.map((match) => <Mention key={match.id} match={match} />);
}
```

Mutating a value the function created itself is fine — the local `stack` and
`repaired` in `lib/jsonParse.ts` are owned by the function that builds them.

---

### `data/copy-before-sort`

**Severity: `warn`**

`sort` and `reverse` mutate. Spread the array first whenever the input is not
yours.

`Array.prototype.sort` returning the array reads like `map` and behaves like
`push`, which is why the mistake is easy to make and hard to spot in review. Both
places this codebase sorts by timestamp — the sessions route and the
`SUPERVISING_ANSWERED` handler in `app.ts` — sort results they have just fetched,
which is the safe case; the rule is what keeps it safe when one of them is later
handed a list from a caller.

Incorrect:

```ts
function recentFirst(sessions: Session[]) {
  return sessions.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
```

Incorrect:

```tsx
const ordered = conversations.reverse();
```

Correct:

```ts
function recentFirst(sessions: Session[]) {
  return [...sessions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
```

Correct:

```tsx
const ordered = [...conversations].reverse();
```

Correct:

```ts
const sessions = await Session.findAll({
  where: { agentId },
  order: [["createdAt", "DESC"]],
});
```

Better still, sort in the query and never hold an unordered copy.

---

### `data/parse-json-defensively`

**Severity: `error`**

`JSON.parse` is wrapped, and its failure produces a named error or a documented
fallback — never an uncaught throw in a request path or an event handler.

There are 28 `JSON.parse` calls in the project and roughly a third have no guard
around them. The input is never trusted: it is a model completion, a stored step
result, an OAuth error body, or a value out of `localStorage`. An uncaught
`SyntaxError` in an event subscriber has no request to fail, so it reaches
`unhandledRejection` and the user waits forever. Model output specifically goes
through `lib/jsonParse.ts`, which strips markdown fences and repairs truncated
braces before parsing — see
[`llm/repair-and-parse-model-json`](api/architecture.md).

Incorrect:

```ts
const parsed = JSON.parse(step.result);

return parsed.tr;
```

Incorrect:

```ts
const completion = await generate({ content, json_format });

const flow = JSON.parse(completion as string);
```

Model output parsed directly, so a fenced or truncated response fails the whole
task.

Incorrect:

```tsx
const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);

return JSON.parse(raw);
```

`JSON.parse(null)` returns `null` and `JSON.parse("")` throws, so this crashes on
a first visit with a partially written key.

Correct:

```ts
export const parseJsonResult = (result?: string | object) => {
  if (!result) {
    return { isJson: false, parsedResult: "No result available" };
  }

  try {
    return { isJson: true, parsedResult: JSON.parse(String(result)) };
  } catch (e) {
    return { isJson: false, parsedResult: result };
  }
};
```

A discriminated result the caller renders either way, as `utils/formatters.ts`
writes it.

Correct:

```ts
import { parseJsonContent } from "../lib/jsonParse";

const completion = await client.chat.completions.create(payload);

return parseJsonContent(completion.choices[0].message.content, "OpenAI");
```

Correct:

```tsx
export const readSessions = (): StoredSession[] => {
  const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    return [];
  }
};
```

---

## 12. Dates and numbers

### `date/guard-before-date-arithmetic`

**Severity: `error`**

Check that a timestamp exists before constructing a `Date` from it, because
`new Date(undefined).getTime()` is `NaN` and `NaN` fails every comparison
silently.

There are 58 `new Date(...)` sites in the project and the failure mode has no
error attached to it: a comparator returning `NaN` leaves the array in its
original order, a duration renders as `NaN`, and nothing logs. This is live
surface — `models/Agent.ts` sets `timestamps: false`, so `agent.createdAt` is
`undefined`, while `AgentCard` renders it and the sessions route sorts by it.
Fixing the model is
[`model/timestamps-match-consumers`](api/architecture.md); guarding the arithmetic
is this rule, and both are needed.

Incorrect:

```ts
const sorted = sessions.sort(
  (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
);
```

Incorrect:

```tsx
<Typography>{new Date(agent.createdAt).toISOString()}</Typography>
```

`toISOString` on an invalid date throws `RangeError`, so one row without a
timestamp blanks the screen.

Incorrect:

```ts
const durationMs = Date.now() - new Date(task.startedAt).getTime();

logLLM({ durationMs });
```

A `NaN` duration is written to the cost table and quietly excluded from every
average.

Correct:

```ts
const sorted = [...sessions].sort((a, b) => {
  const left = a.createdAt ? new Date(a.createdAt).getTime() : 0;
  const right = b.createdAt ? new Date(b.createdAt).getTime() : 0;

  return right - left;
});
```

Correct:

```tsx
<Typography>{agent.createdAt ? fDate(agent.createdAt) : "—"}</Typography>
```

Display goes through the `utils/formatTime.ts` helpers — see
[`ui/format-dates-with-helpers`](dashboard/architecture.md) — with the missing
case rendered explicitly.

Correct:

```ts
const startedAt = Date.now();

const response = await client.chat.completions.create(payload);

logLLM({ durationMs: Date.now() - startedAt });
```

Measuring from a timestamp you captured yourself removes the question entirely.

---

### `num/no-silent-numeric-coercion`

**Severity: `warn`**

Convert to a number explicitly, and check the result before using it. `parseInt`
always carries a radix.

`Number("")` is `0`, `Number(null)` is `0`, `parseFloat("abc")` is `NaN`, and
`+value` hides which of those you meant. A `NaN` score stored on a `StepScore`
row propagates into every average computed from it and never raises anything. The
project has no `parseInt` without a radix today and two `parseFloat` calls, one
of which — `parseFloat(String(result_score))` in `functions/agent.ts` — already
does the explicit-conversion half and skips the check.

Incorrect:

```ts
const score = +req.body.resultScore;

await StepScore.create({ stepId, score });
```

Incorrect:

```ts
const resultScore = parseFloat(String(result_score));

await step.update({ resultScore });
```

Explicit conversion with no `NaN` check, so a non-numeric body writes `NaN` to
the column.

Incorrect:

```ts
const limit = parseInt(req.query.limit);
```

Correct:

```ts
const { resultScore } = Joi.attempt(
  req.body,
  Joi.object({ resultScore: Joi.number().min(0).max(1).optional() })
);
```

Validating at the boundary is the best version of this — the schema does the
conversion and the rejection together.

Correct:

```ts
const parsed = Number(result_score);

if (Number.isNaN(parsed)) {
  throw new Error("INVALID_RESULT_SCORE");
}

await step.update({ resultScore: parsed });
```

Correct:

```ts
const limit = Number.parseInt(rawLimit, 10);

if (!Number.isInteger(limit) || limit < 1) {
  return res.status(400).end();
}
```

---

## 13. Regular expressions

### `regex/name-and-share-patterns`

**Severity: `warn`**

A regular expression used more than once, or complex enough to need a second
read, lives behind a named function or a named constant.

An inline regex is unnamed, untestable and impossible to grep for as a concept.
The live case is icon-name trimming: `utils/cleanIconName.ts` strips repeated
colons with `/^:+|:+$/g` and returns `""` for a missing icon, while six other
sites inline `replace(/^:|:$/g, "")` — a different pattern that strips only one
colon and throws on `undefined`. Two behaviours, one intention, and the divergence
is invisible until an icon fails to render.

Incorrect:

```tsx
<Iconify icon={teamById?.icon?.replace(/^:|:$/g, "")} />
```

Incorrect:

```tsx
<Iconify icon={node?.icon?.replace(/^:|:$/g, "")} />
```

The same expression again, one character different from the shared one, in
another file.

Incorrect:

```ts
const cleaned = content
  .trim()
  .replace(/^```(?:json|JSON)?\s*\n?/i, "")
  .replace(/\n?```\s*$/i, "")
  .trim();
```

The fence stripper reimplemented at a call site rather than imported from
`lib/jsonParse.ts`.

Correct:

```ts
export const cleanIconName = (icon?: string) => {
  if (!icon) return "";

  return icon.replace(/^:+|:+$/g, "");
};
```

Correct:

```tsx
<Iconify icon={cleanIconName(teamById?.icon)} />
```

Correct:

```ts
const MARKDOWN_FENCE_OPEN = /^```(?:json|JSON)?\s*\n?/i;
const MARKDOWN_FENCE_CLOSE = /\n?```\s*$/i;

function stripMarkdownFence(content: string): string {
  return content
    .trim()
    .replace(MARKDOWN_FENCE_OPEN, "")
    .replace(MARKDOWN_FENCE_CLOSE, "")
    .trim();
}
```

A regex used once, inline, where its meaning is obvious from context needs no
name — `key.split("_")` in `utils/formatters.ts` is clearer as it stands.

---

## 14. Environment and process access

### `env/read-through-config`

**Severity: `error`**

`process.env` is read in `config.ts` and in the small number of modules that own
a specific integration. Feature code reads the resulting config object.

`process.env.*` is referenced at 113 sites across 41 files today, covering
`AWS_*`, `GDRIVE_*`, `ATLASSIAN_*`, `GOOGLE_*`, `ASR_*` and more. Nothing
enumerates what the application needs to boot, so a missing variable is
discovered by whichever request happens to touch it first, and `.env.example`
cannot be kept accurate by reading the code. Concentrating the reads gives one
place to validate, one place to document, and one place a reviewer checks against
[`config/env-for-secrets-config-for-shape`](api/architecture.md).

Incorrect:

```ts
async function run({ parameters: { text } }) {
  const endpoint = process.env.ASR_ENDPOINT_URL;
  const apiKey = process.env.ASR_API_KEY;

  return fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
}
```

Incorrect:

```tsx
const showApiTab = process.env.NODE_ENV !== "production";
```

Environment reads in the dashboard bundle, where the value is frozen at build
time and the branch is invisible to `config.live.js`.

Incorrect:

```ts
const region = process.env.AWS_REGION || "us-east-1";
```

repeated in `create_vm.ts` and `terminate_vm.ts`, with the fallback spelled out
in each.

Correct:

```ts
const config = {
  asr: {
    endpointUrl: process.env.ASR_ENDPOINT_URL,
    apiKey: process.env.ASR_API_KEY,
  },
  aws: {
    region: process.env.AWS_REGION || "us-east-1",
  },
};

export default config;
```

Correct:

```ts
import config from "../../config";

async function run({ parameters: { text } }) {
  const { endpointUrl, apiKey } = config.asr;

  if (!endpointUrl || !apiKey) {
    return { error: "ASR is not configured" };
  }

  return fetch(endpointUrl, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
}
```

Correct:

```tsx
import config from "../../config";

const { beta } = config;
```

The provider-selection read in `lib/llm.ts` is the deliberate exception: it reads
`PLATFORM_LLM` at module scope because the value decides which module is loaded,
and it validates the value against the known provider set on the spot.

---

### `env/no-import-time-side-effects`

**Severity: `error`**

Importing a module defines things. It does not read files, open connections, call
`dotenv.config()`, create directories or start servers — those happen in an
exported `init` or in the entry point.

A side effect at import time runs on every path that transitively imports the
module, including a test that only wanted a type, and it runs in an order set by
the import graph rather than by anything you chose. `communication/` calls
`dotenv.config()` at module scope in five separate files — `account.ts`,
`chatApp.ts`, `http.ts`, `server.ts` and `test_chat/session.ts` — so the load
order decides which one wins, and
`mcp/servers/activedirectory/index.ts` calls `fs.mkdirSync` while being imported.
The pattern to copy is `api/`: `models/models.ts` exports `init()`, and
`server.ts` calls `await platform.init(config)` then `await models.init()` in a
sequence it controls.

Incorrect:

```ts
import dotenv from "dotenv";

dotenv.config();

export async function sendMessage({ to, body }) {}
```

Incorrect:

```ts
const logDir = path.join(process.cwd(), "logs");

fs.mkdirSync(logDir, { recursive: true });
```

Incorrect:

```ts
startServer().catch(console.error);
```

A server started as a side effect of import, with its failure handled by
`console.error`.

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
}

export default { init };
```

Correct:

```ts
import dotenv from "dotenv";

dotenv.config();

await platform.init(config);
await models.init();
await event.init(config.event);

const server = app.listen(config.port);
```

`server.ts` is the entry point, so it is the one place this sequence belongs, and
`dotenv.config()` runs exactly once.

Correct:

```ts
function getLogDirectory() {
  const logDir = path.join(process.cwd(), "logs");

  fs.mkdirSync(logDir, { recursive: true });

  return logDir;
}
```

---

## 15. Testing craft

### `test/descriptive-case-names`

**Severity: `warn`**

A test name states the behaviour and the condition, so a failure report is
readable without opening the file.

The name is the only part of a test that appears in CI output. "works" and
"test 1" describe nothing; a sentence naming the input and the expected outcome
turns a red build into a bug report. `api/src/lib/test/jsonParse.spec.ts` is the
model — "strips a markdown fence", "appends missing closing braces", "does not
count braces inside string literals" — and there are 12 spec files across the
project to keep consistent with it.

Incorrect:

```ts
it("works", async () => {
  const { body } = await request(app).get("/agents").expect(200);

  deepEqual(body.length, 2);
});
```

Incorrect:

```ts
it("agent test", async () => {});
it("agent test 2", async () => {});
```

Incorrect:

```ts
it("should probably handle the case where the agent belongs to a different team and the delete is refused", async () => {});
```

A name long enough to be a paragraph is as unreadable in CI output as one that
is too short.

Correct:

```ts
it("strips a markdown fence before parsing", () => {});
it("does not count braces inside string literals", () => {});
```

Correct:

```ts
it("lists only the agents of the selected team", async () => {});
it("refuses to delete an agent from another team", async () => {});
```

Correct:

```ts
describe("Agent service", () => {
  describe("DELETE /agents/:id", () => {
    it("returns 401 for another team's agent", async () => {});
    it("leaves the agent in place", async () => {});
  });
});
```

Nesting `describe` blocks lets each name stay short while the full path still
reads as a sentence.

---

### `test/no-logic-in-tests`

**Severity: `error`**

A test contains no `if`, no loop and no computed expectation. Assert against
literal values.

A conditional in a test means one of its branches is not running, and nothing
reports which. A computed expectation reimplements the code under test, so both
can be wrong in the same way and the test still passes. There is no conditional
logic in any of the 12 spec files today — this rule keeps it that way.

Incorrect:

```ts
it("lists agents", async () => {
  const { body } = await request(app).get("/agents").expect(200);

  if (body.length > 0) {
    deepEqual(body[0].name, "subscription_agent");
  }
});
```

The assertion is skipped entirely when the list comes back empty, which is
exactly the regression worth catching.

Incorrect:

```ts
it("scores every step", async () => {
  for (const step of steps) {
    const score = await scoreStep(step);

    deepEqual(score, step.resultScore * WEIGHT);
  }
});
```

The expectation recomputes the formula under test, and a loop hides which
iteration failed.

Correct:

```ts
it("lists the two seeded agents of the team", async () => {
  test.project("e6d4744d-a11b-4c75-acad-e24a02903729");

  const { body } = await request(app).get("/agents").expect(200);

  deepEqual(body.length, 2);
  deepEqual(body[0].name, "subscription_agent");
});
```

Correct:

```ts
it("weights a perfect step score to 1", async () => {
  deepEqual(await scoreStep({ resultScore: 1 }), 1);
});

it("weights a failed step score to 0", async () => {
  deepEqual(await scoreStep({ resultScore: 0 }), 0);
});
```

One case per input, each with a literal expectation.

---

### `test/one-behaviour-per-case`

**Severity: `warn`**

Each `it` exercises one behaviour. Related assertions about that one behaviour
belong together; unrelated ones get their own case.

A case asserting four behaviours reports the first failure and hides the other
three, so a single regression looks like a single failure and the rest are found
one build at a time. The counterpart matters as much: a cross-tenant rejection is
one behaviour with two assertions — the status, and that the record survived —
and splitting those weakens the test, because the status alone passes today while
the row is already gone.

Incorrect:

```ts
it("handles agents", async () => {
  const { body: created } = await request(app).post("/agents").send(agent).expect(201);

  deepEqual(created.name, "Test Agent");

  const { body: list } = await request(app).get("/agents").expect(200);

  deepEqual(list.length, 3);

  await request(app).delete(`/agents/${created.id}`).expect(204);
  await request(app).put(`/agents/${created.id}`).send(agent).expect(404);
});
```

Create, list, delete and update in one case, sharing state, reporting one
failure.

Incorrect:

```ts
it("returns 401 for another team's agent", async () => {
  await request(app).delete(`/agents/${otherTeamAgentId}`).expect(401);
});
```

Half the behaviour. The bypass in `routes/agents.ts` returns `401` and deletes
the row, so this passes while the bug is live.

Correct:

```ts
it("creates an agent", async () => {
  const { body } = await request(app).post("/agents").send(agent).expect(201);

  deepEqual(body.name, "Test Agent");
});

it("lists the created agent", async () => {
  const { body } = await request(app).get("/agents").expect(200);

  deepEqual(body.length, 3);
});
```

Correct:

```ts
it("refuses to delete an agent from another team", async () => {
  test.project("cb16e069-6214-47f1-9922-1f7fe7629525");

  await request(app).delete(`/agents/${otherTeamAgentId}`).expect(401);

  test.project("e6d4744d-a11b-4c75-acad-e24a02903729");

  const { body } = await request(app).get("/agents").expect(200);

  deepEqual(
    body.some((agent) => agent.id === otherTeamAgentId),
    true
  );
});
```

Two assertions, one behaviour: the request is refused *and* the resource
survives.

---

## 16. React state and effects

### `react/derive-during-render`

**Severity: `error`**

A value computable from props or existing state is computed during render. It
does not get its own `useState` kept in sync by a `useEffect`.

Mirroring a prop into state creates a second copy that is right only after an
extra render, so the first paint shows the initial value and the screen flickers.
Worse, the effect has to list the prop as a dependency to stay correct, and the
usual response to the lint warning is to empty the array and suppress the rule —
at which point the value never updates at all. `AddNewButton.tsx` is exactly
that: a `useState` holding a style object, a `useEffect` with a `switch` on the
`type` prop, an empty dependency array and an
`eslint-disable-next-line react-hooks/exhaustive-deps` holding it in place. The
component renders once with empty strings and never responds to a changed `type`.

Incorrect:

```tsx
const [size, setSize] = useState({ width: "", height: "", borderRadius: "" });

useEffect(() => {
  switch (type) {
    case "largeButton":
      setSize(styles.largeButton);
      break;
    case "wideButton":
      setSize(styles.wideButton);
      break;
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

Incorrect:

```tsx
const [selectedOption, setSelectedOption] = useState("");
const [selectedOptionId, setSelectedOptionId] = useState("");

useEffect(() => {
  if (team) {
    setSelectedOption(team.name);
    setSelectedOptionId(team.id);
  } else if (agents && agents.length > 0) {
    setSelectedOption(agents[0].name);
    setSelectedOptionId(agents[0].id);
  }
}, [team, agents]);
```

A fallback chain that is a pure function of `team` and `agents`, run one render
late.

Incorrect:

```tsx
const [visibleTabs, setVisibleTabs] = useState(TABS);

useEffect(() => {
  setVisibleTabs(TABS.filter((tab) => !beta || tab.value !== "api"));
}, [beta]);
```

Correct:

```tsx
const size = styles[type] ?? styles.default;
```

The lookup that `component/styles-module` in `dashboard/architecture.md` describes
— no state, no effect, and correct on the first render.

Correct:

```tsx
const selected = team ?? agents?.[0] ?? null;
```

Correct:

```tsx
const visibleTabs = useMemo(
  () => TABS.filter((tab) => !beta || tab.value !== "api"),
  [beta]
);
```

Correct:

```tsx
const [draftName, setDraftName] = useState(agent?.name);

useEffect(() => {
  setDraftName(agent?.name);
}, [agent?.name]);
```

The one legitimate mirror: an editable draft that the user then diverges from,
reset when the underlying record changes. `AgentAbout.tsx` needs this for its
`temp` values — and does not need it for the non-draft copies it keeps beside
them.

---

### `react/one-source-of-truth-per-value`

**Severity: `warn`**

One fact is held in one place. Do not keep a value, a copy of it, and a flag
describing their relationship.

Every additional `useState` is another thing to keep in sync on every path, and
the paths multiply: `AgentAbout.tsx` holds `description`, `tempDescription` and
`isDescUpdated`, then the same three for `name` — six states for two editable
fields, with an effect resetting four of them. There are 175 `useState` calls in
the dashboard against 95 `useEffect`s, and the effects are largely there to
reconcile the states. Deriving the flag from the two values removes a whole class
of "the button is enabled but the field is unchanged" bug.

Incorrect:

```tsx
const [description, setDescription] = useState(agent?.description);
const [tempDescription, setTempDescription] = useState(agent?.description);
const [isDescUpdated, setIsDescUpdated] = useState(true);
```

Incorrect:

```tsx
const [agents, setAgents] = useState([]);
const [filteredAgents, setFilteredAgents] = useState([]);
const [query, setQuery] = useState("");

useEffect(() => {
  setFilteredAgents(agents.filter((a) => a.name.includes(query)));
}, [agents, query]);
```

Correct:

```tsx
const [draftDescription, setDraftDescription] = useState(agent?.description);

const isDescriptionChanged = draftDescription !== agent?.description;
```

One piece of state — the draft — and the flag derived from it.

Correct:

```tsx
const [query, setQuery] = useState("");

const filteredAgents = agents.filter((agent) => agent.name.includes(query));
```

Correct:

```tsx
const [currentTab, setCurrentTab] = useState(initialTab ?? "profile");
```

Independent facts still get their own state — the point is that a value and its
derivative do not.

---

### `react/memoise-deliberately`

**Severity: `warn`**

Reach for `useMemo` and `useCallback` when referential stability changes
behaviour — a dependency array, a memoised child — not as a reflex.

A memo hook is not free: it adds a dependency array to maintain, and a wrong one
produces a stale value that is far harder to find than a re-render. The dashboard
has 53 `useCallback` and 30 `useMemo` calls, and the ones that matter are the
handful feeding something that compares by reference. `useApi.Api(apiCall,
dependencies)` is the load-bearing case in this codebase: the `apiCall` closure
and the dependency array decide when a refetch happens, so an unstable value
there causes an infinite fetch loop rather than a slow render.

Incorrect:

```tsx
const label = useMemo(() => `${agent.name} (${agent.id})`, [agent]);
const isEmpty = useMemo(() => agents.length === 0, [agents]);
```

Memoising a string concatenation and a comparison costs more than it saves.

Incorrect:

```tsx
const handleDelete = useCallback(() => deleteAgent(agent.id), []);
```

An empty dependency array over a closure that reads `agent.id` — the callback
deletes whichever agent was first rendered, forever.

Incorrect:

```tsx
<KnowledgeTable
  rows={rows}
  columns={[{ id: "type", label: "Type" }]}
  onDelete={(id) => deleteKnowledge(id)}
/>
```

A fresh array and a fresh function on every render, handed to a child that is
memoised and therefore re-renders anyway.

Correct:

```tsx
const label = `${agent.name} (${agent.id})`;
const isEmpty = agents.length === 0;
```

Correct:

```tsx
const eventDependencies = [agentUpdated, agentDeleted, agentAdded, teamSelected];

const { data, loading, error, fetch } = Api(
  () => http.get(`/agents`),
  [...eventDependencies, ...fetchState]
);
```

Correct:

```tsx
const handleDelete = useCallback(
  (agentId: string) => deleteAgent(agentId),
  [deleteAgent]
);
```

The value the callback varies on is a parameter rather than a captured one, and
the dependency array is complete.

---

## 17. Logging

### `log/level-matches-severity`

**Severity: `warn`**

Choose the level by what a reader should do about the line. `error` needs
attention, `warn` is degraded but handled, `info` marks a lifecycle event, and
`debug` does not ship.

The project logs 144 times and effectively uses two levels: 87 `console.log`, 47
`console.error`, 6 `console.debug`, 3 `console.info` and a single `console.warn`.
With everything at `log`, no alert can be built and no filter is useful — a
routine step transition and a failed token exchange are the same line to anything
downstream. The volume is spread across `communication/` (52), `mcp/` (45),
`api/src` (37) and `dashboard/src` (10); the API and dashboard route these
through `platform.logger` per
[`obs/platform-logger-not-console`](api/architecture.md), and this rule is about
which level to pick once you are there.

Incorrect:

```ts
console.log("steps", steps);
console.log("supervisedIndex", supervisedIndex);
```

Development tracing left in the `SUPERVISING_ANSWERED` subscription, printing on
every supervision answer in production.

Incorrect:

```ts
platform.logger.error({ message: "Agent created", agentId });
```

A successful lifecycle event at `error`, which pages someone.

Incorrect:

```ts
platform.logger.info({
  message: "Token exchange failed",
  mcpId,
});
```

A failure at `info`, which nothing alerts on.

Correct:

```ts
platform.logger.info({ message: "Agent created", agentId, teamId });
```

Correct:

```ts
platform.logger.warn({
  message: "Knowledge lookup returned a non-JSON error body",
  knowledgeId,
});
```

Handled, degraded, worth noticing — not worth waking anyone.

Correct:

```ts
platform.logger.error({
  message: "MCP token exchange failed",
  mcpId,
  error_message: error instanceof Error ? error.message : String(error),
});
```

Delete `debug` lines before merging rather than shipping them at a level nobody
reads.

---

### `log/named-fields-not-interpolation`

**Severity: `warn`**

A log call passes an object of named fields with a constant `message`. Values are
fields, not fragments of a sentence.

A log line is a record, and a record is only queryable if its parts are named.
`Agent 72ef5b08 created in team cb16e069` cannot be filtered by team, counted by
agent, or joined to anything; the same information as fields can. The constant
`message` is what makes a group of occurrences one event. `server.ts` already
writes this shape for uncaught exceptions — `message`, `error_message`,
`error_stack` — and it is the shape to copy everywhere.

Incorrect:

```ts
platform.logger.info(`agent ${agent.id} created in team ${teamId}`);
```

Incorrect:

```ts
console.log("step", stepId, "status", status, "took", durationMs, "ms");
```

Positional arguments have no names at all once they reach the log backend.

Incorrect:

```ts
platform.logger.error({
  message: `Failed to run action ${action} for step ${stepId}`,
});
```

The values are interpolated into the `message`, so every occurrence is a distinct
message and none can be grouped.

Correct:

```ts
platform.logger.info({ message: "Agent created", agentId: agent.id, teamId });
```

Correct:

```ts
platform.logger.error({
  message: "Action failed",
  action,
  stepId,
  durationMs,
  error_message: error instanceof Error ? error.message : String(error),
});
```

Correct:

```ts
platform.logger.error({
  message: "Uncaught Exception",
  error_message: err.message,
  error_stack: err.stack,
});
```

Never put credentials, tokens or authorization codes in either the message or the
fields — see
[`secrets/never-log-or-return-credentials`](api/architecture.md).

---

## 18. Module boundaries

### `module/no-cycles`

**Severity: `error`**

Two modules do not import each other, directly or through a chain. Break the
cycle with a third module, an interface, or a registration step.

A cycle resolves to a partially initialised module at run time, so one of the two
sees `undefined` where it expected a class or a function — and which one depends
on which was imported first, which is why the failure moves when an unrelated
import is added. It also defeats tree shaking and makes both modules impossible
to test in isolation. The live risk is the model layer: `models/Agent.ts` imports
`./AIEngine` for its `@ForeignKey`, and a `@BelongsTo` on the other side would
close the loop. That is precisely why associations are declared centrally in
`init()` — see
[`model/associations-in-init`](api/architecture.md).

Incorrect:

```ts
import Project from "./Project";

@Table({ tableName: "Agent" })
class Agent extends Model<AgentAttributes> {
  @BelongsTo(() => Project)
  declare team: Project;
}
```

with `Project.ts` importing `./Agent` for its `@HasMany`.

Incorrect:

```ts
import { runAction } from "./agent";

export async function scoreStep({ stepId }) {}
```

in `functions/stepScore.ts`, while `functions/agent.ts` imports `scoreStep` from
`./stepScore`.

Correct:

```ts
async function init() {
  const {
    Postgres: { sequelize },
  } = await platform.getModules();

  const models = sequelize.models;

  models.Project.hasMany(models.Agent, { foreignKey: "teamId", as: "agents" });
  models.Agent.belongsTo(models.Project, { foreignKey: "teamId", as: "team" });
}
```

Neither model file imports the other; a third module wires them once, after both
are registered.

Correct:

```ts
async function step({ stepId, action, parameters }) {
  const result = await runAction({ stepId, action, parameters });

  await recordStepScore({ stepId, result });
}
```

The dependency runs one way — `agent.ts` calls into `stepScore.ts`, and
`stepScore.ts` calls nothing back.

---

### `module/shallow-relative-paths`

**Severity: `warn`**

Relative imports stay shallow. Past two levels up, import through the folder's
barrel rather than reaching further into the tree.

`../../../` appears 36 times in the dashboard and is the point at which a path
stops telling you where the target is — you have to count directories to find
out, and any file move silently rewrites every one of them. There are 29 `index.ts`
barrels in the project already, which is the mechanism: `components/AgentCard`
resolves through its barrel from any depth, so the import says what it wants
instead of how to walk there. No import in the project reaches four levels up
today, and that ceiling is worth keeping. The `@/*` alias in
`dashboard/tsconfig.json` is not the answer here — nothing wires it into Vite, and
[`ts/relative-imports`](dashboard/architecture.md) forbids using it.

Incorrect:

```tsx
import SourcedAvatar from "../../../components/SourcedAvatar/SourcedAvatar";
import { cleanIconName } from "../../../utils/cleanIconName";
```

Incorrect:

```tsx
import TeamChatNavItemSkeleton from "../../../components/Skeletons/TeamChatNavItemSkeleton";
```

Incorrect:

```tsx
import AgentCard from "../../../../components/AgentCard";
```

Four levels up, which nothing in the project does today.

Correct:

```tsx
import SourcedAvatar from "../../components/SourcedAvatar";
import TeamChatNavItemSkeleton from "../../components/Skeletons";
```

Reached through the folder barrel, which is also what
[`component/folder-and-barrel`](dashboard/architecture.md) asks for.

Correct:

```tsx
import ChatInputCommandEditor from "./ChatInputCommandEditor";
import styles from "./styles";
```

A sub-component that belongs to one feature stays beside it, so the import never
leaves the folder.

---

## 19. External calls

### `net/bound-every-external-call`

**Severity: `error`**

Every call to a service you do not control carries a timeout, and anything
retried has a bounded number of attempts.

There are 18 `fetch` calls and 3 `axios` calls to external services across
`api/`, `communication/` and `mcp/`, and not one `AbortController` or `timeout`
option anywhere in the project. `fetch` has no default timeout: a provider that
accepts the connection and never responds holds the request, the event handler
and its whole closure open indefinitely. This code calls LLM providers, an ASR
endpoint, AWS, Puppeteer targets and arbitrary MCP servers — every one of them a
third party with its own failure modes, and several of them slow enough that
"still working" and "hung" look identical.

Incorrect:

```ts
const response = await fetch(endpointUrl, {
  method: "POST",
  headers: { Authorization: `Bearer ${apiKey}` },
  body: audio,
});
```

Incorrect:

```ts
while (true) {
  const { status } = await pollTranscription(jobId);

  if (status === "COMPLETED") break;
}
```

An unbounded retry loop against a remote job that may never complete.

Incorrect:

```ts
const { data } = await axios.post(config.oauth.tokenUrl, { refreshToken });
```

Correct:

```ts
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), ASR_TIMEOUT_MS);

try {
  const response = await fetch(endpointUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: audio,
    signal: controller.signal,
  });

  if (!response.ok) {
    return { error: `ASR request failed with status ${response.status}` };
  }

  return await response.json();
} finally {
  clearTimeout(timeout);
}
```

The timer is cleared in a `finally` for the same reason a browser is closed in
one — see
[`action/release-external-resources`](api/architecture.md).

Correct:

```ts
const MAX_POLL_ATTEMPTS = 30;

for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
  const { status } = await pollTranscription(jobId);

  if (status === "COMPLETED") {
    return { status };
  }
}

return { error: "Transcription did not complete in time" };
```

Correct:

```ts
const { data } = await axios.post(
  config.oauth.tokenUrl,
  { refreshToken },
  { timeout: OAUTH_TIMEOUT_MS }
);
```

A response body is checked before it is used — `response.ok` for `fetch`, which
does not reject on a 4xx or 5xx and will happily hand you an error page to
`JSON.parse`.
