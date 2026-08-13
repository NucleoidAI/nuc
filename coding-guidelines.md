# Coding Guidelines — Rule Catalog

These rules cover how code is written, and they apply to every package in the
repository. Structural rules — layer boundaries, data access, events,
persistence, build and release — live in `api/architecture.md` and
`dashboard/architecture.md`, and this catalog does not repeat them.

Several rules turn on what each package actually enforces today, which is
uneven:

| Package | ESLint config | `lint` script | `tsc` runs | `typecheck` script |
| --- | --- | --- | --- | --- |
| `api/` | yes | yes, no `--max-warnings` | no — esbuild only | no |
| `dashboard/` | yes | yes, `--max-warnings 0` | yes, via `build` | yes |
| `communication/` | yes | no | no — esbuild only | no |
| `mcp/` | yes | no | no | no |
| `server-dashboard/` | **no** | no | yes, via `build` | no |

Root `lint` and `typecheck` both run the dashboard alone, so most of the
repository is checked by nothing. Counts quoted below were measured across the
538 TypeScript files in `api/src`, `dashboard/src`, `communication/`, `mcp/` and
`server-dashboard/src`.

## Contents

- [1. Language baseline](#1-language-baseline)
  - [`lang/const-over-let`](#langconst-over-let)
  - [`lang/strict-equality`](#langstrict-equality)
  - [`lang/nullish-over-logical-or`](#langnullish-over-logical-or)
  - [`lang/template-literals`](#langtemplate-literals)
- [2. Naming](#2-naming)
  - [`naming/case-by-kind`](#namingcase-by-kind)
  - [`naming/boolean-predicate-prefix`](#namingboolean-predicate-prefix)
  - [`naming/no-cryptic-abbreviations`](#namingno-cryptic-abbreviations)
- [3. Functions](#3-functions)
  - [`fn/named-function-declarations`](#fnnamed-function-declarations)
  - [`fn/single-object-parameter`](#fnsingle-object-parameter)
  - [`fn/guard-clauses-over-nesting`](#fnguard-clauses-over-nesting)
  - [`fn/keep-functions-small`](#fnkeep-functions-small)
- [4. Types](#4-types)
  - [`ts/no-any`](#tsno-any)
  - [`ts/no-lying-generics`](#tsno-lying-generics)
  - [`ts/share-union-types`](#tsshare-union-types)
  - [`ts/unknown-in-catch`](#tsunknown-in-catch)
  - [`ts/no-suppression-comments`](#tsno-suppression-comments)
  - [`ts/no-non-null-assertion`](#tsno-non-null-assertion)
- [5. Control flow](#5-control-flow)
  - [`flow/no-nested-ternary`](#flowno-nested-ternary)
  - [`flow/no-ternary-as-statement`](#flowno-ternary-as-statement)
  - [`flow/exhaustive-switch`](#flowexhaustive-switch)
  - [`flow/array-methods-over-index-loops`](#flowarray-methods-over-index-loops)
- [6. Asynchrony and lifetime](#6-asynchrony-and-lifetime)
  - [`async/await-over-then`](#asyncawait-over-then)
  - [`async/no-floating-promises`](#asyncno-floating-promises)
  - [`async/clear-every-timer`](#asyncclear-every-timer)
  - [`async/parallelise-independent-work`](#asyncparallelise-independent-work)
  - [`net/bound-every-external-call`](#netbound-every-external-call)
- [7. Errors](#7-errors)
  - [`error/no-empty-catch`](#errorno-empty-catch)
  - [`error/preserve-the-cause`](#errorpreserve-the-cause)
  - [`error/fail-fast-on-missing-configuration`](#errorfail-fast-on-missing-configuration)
- [8. Data and immutability](#8-data-and-immutability)
  - [`data/no-parameter-mutation`](#datano-parameter-mutation)
  - [`data/copy-before-sort`](#datacopy-before-sort)
  - [`data/parse-json-defensively`](#dataparse-json-defensively)
- [9. Dates and numbers](#9-dates-and-numbers)
  - [`date/guard-before-date-arithmetic`](#dateguard-before-date-arithmetic)
  - [`num/no-silent-numeric-coercion`](#numno-silent-numeric-coercion)
- [10. Environment and process](#10-environment-and-process)
  - [`env/read-through-config`](#envread-through-config)
  - [`env/no-import-time-side-effects`](#envno-import-time-side-effects)
- [11. React state and effects](#11-react-state-and-effects)
  - [`react/derive-during-render`](#reactderive-during-render)
  - [`react/pure-state-updaters`](#reactpure-state-updaters)
  - [`react/one-source-of-truth-per-value`](#reactone-source-of-truth-per-value)
- [12. Logging](#12-logging)
  - [`log/level-matches-severity`](#loglevel-matches-severity)
  - [`log/named-fields-not-interpolation`](#lognamed-fields-not-interpolation)
- [13. Module boundaries](#13-module-boundaries)
  - [`module/no-cross-package-reach`](#moduleno-cross-package-reach)
  - [`module/no-cycles`](#moduleno-cycles)
  - [`module/shallow-relative-paths`](#moduleshallow-relative-paths)
- [14. Comments](#14-comments)
  - [`comment/explain-why`](#commentexplain-why)
  - [`comment/no-commented-out-code`](#commentno-commented-out-code)
- [15. Formatting and enforcement](#15-formatting-and-enforcement)
  - [`format/prettier-owns-layout`](#formatprettier-owns-layout)
  - [`lint/scope-every-suppression`](#lintscope-every-suppression)
  - [`ci/lint-and-typecheck-every-package`](#cilint-and-typecheck-every-package)
- [16. Testing craft](#16-testing-craft)
  - [`test/descriptive-case-names`](#testdescriptive-case-names)
  - [`test/no-logic-in-tests`](#testno-logic-in-tests)
  - [`test/one-behaviour-per-case`](#testone-behaviour-per-case)

---

## 1. Language baseline

### `lang/const-over-let`

**Severity: `error`**

Declare bindings with `const`, reaching for `let` only where the binding is
genuinely reassigned.

`prefer-const` and `no-var` are enabled in `dashboard/.eslintrc.json` and nowhere
else, and the three packages that extend only `eslint:recommended` and
`plugin:@typescript-eslint/recommended` have no rule holding them to it. There
are zero `var` declarations across all 538 files, so the convention holds — but a
mutated object bound with `let`, as in `communication/api/createKnowledge.ts`,
already slips past unnoticed in a package nothing lints.

Incorrect:

```ts
var provider = process.env.PLATFORM_LLM || "local";
```

Incorrect:

```ts
let body = { agentId, type: learnType } as {
  agentId: string;
  type: string;
  url?: string;
};

body.url = learningInfo;
```

The binding is never reassigned — only the object it points at is mutated.

Incorrect:

```ts
let steps = await taskFn.listSteps({ taskId });
let sorted = [...steps].sort((a, b) => a.order - b.order);

return sorted;
```

Correct:

```ts
const body = {
  agentId,
  type: learnType,
  ...(learnType === "URL" && { url: learningInfo }),
};
```

Correct:

```ts
const steps = await taskFn.listSteps({ taskId });
const sorted = [...steps].sort((a, b) => a.order - b.order);

return sorted;
```

Correct:

```ts
let repaired = content;

for (let i = stack.length - 1; i >= 0; i--) {
  repaired += stack[i] === "{" ? "}" : "]";
}
```

`let` earns its place when the binding really is reassigned, as it is in
`api/src/lib/jsonParse.ts`.

---

### `lang/strict-equality`

**Severity: `error`**

Compare with `===` and `!==`, the one exception being `== null` as a deliberate
"null or undefined" test outside `dashboard/`.

`eqeqeq` is set to `["error", "always"]` in `dashboard/.eslintrc.json` and is
unset in every other package. The ten loose comparisons in the repository are all
intentional `== null` tests in `api/` — `lib/parameterRefs.ts`, `lib/llmLog.ts`,
`functions/llmLog.ts`, `actions/evaluate_metrics.ts` — which is a legitimate
idiom there and would be rejected by the dashboard's setting, so dashboard code
writes the check out.

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

A loose comparison on a tenant check, where `undefined != null` is `false`, so a
missing `teamId` passes.

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

Use `??` to supply a default for a missing value and keep `||` for genuinely
boolean logic.

`||` treats `0`, `""` and `false` as absent, which is wrong for almost every
numeric and string field in this domain — a `resultScore` of `0`, a blank
`description`, a `durationMs` of `0` are all real values it silently replaces.
`api/src/lib/llmLog.ts` already uses `??` for exactly this reason.

Incorrect:

```ts
const score = resultScore || 1;
```

A score of `0` becomes `1`.

Incorrect:

```ts
const description = agent.description || "No description";
```

Incorrect:

```ts
const inputTokens = usage.prompt_tokens || null;
```

A genuine zero-token response is recorded as "unknown" rather than as zero.

Correct:

```ts
const score = resultScore ?? 1;
```

Correct:

```ts
const inputTokens = usage.prompt_tokens ?? null;
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

Concatenation hides the interpolation points and forces explicit `String(...)`
calls around non-strings. The one place the repository still concatenates is the
error assembly in `api/src/lib/jsonParse.ts`, which is also the hardest line in
that file to read.

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

---

## 2. Naming

### `naming/case-by-kind`

**Severity: `error`**

Case carries meaning: `PascalCase` for classes, React components and types,
`camelCase` for functions, variables and properties, and `UPPER_SNAKE_CASE` for
module constants and for event and domain-code strings.

The case is the fastest signal of what an identifier is, and the repository
already holds to it — `PROVIDER_LOADERS`, `SESSIONS_STORAGE_KEY`, `DB_PATH` and
`API_BASE_URL` against `PascalCase` models and components and `camelCase`
functions. Domain error codes and event names are `UPPER_SNAKE_CASE` for the same
reason: they are constants that happen to travel as strings.

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

const DB_PATH = path.join(__dirname, "database.json");
```

---

### `naming/boolean-predicate-prefix`

**Severity: `warn`**

Name a boolean as a predicate — `is`, `has`, `should`, `can`, `needs` — so a flag
is distinguishable from a value at the call site.

`if (loading)` and `if (agent)` read the same and mean different things, and the
prefix is what makes a condition legible without looking up the declaration. The
repository already does this where it matters: `isLoading`, `isValid`,
`isSubmitting`, `isJson`, `hasLoadedOnce`, `isError`.

Incorrect:

```ts
const submitting = false;
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

Spell names out, keeping only the established domain acronyms — `LLM`, `MCP`,
`API`, `AI`, `VM`, `ASR`, `QA` — and never inventing new shortenings.

An abbreviation saves the writer a few characters once and costs every later
reader a lookup. The acronyms above are in the product vocabulary, the directory
names and the API surface, so expanding those would be the confusing change.

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

## 3. Functions

### `fn/named-function-declarations`

**Severity: `warn`**

Declare a module's exported functions with the `function` keyword, keeping arrow
functions for callbacks and short expressions.

A named declaration is hoisted, shows its name in stack traces and profiler
output, and reads as a definition rather than an assignment. The repository is
split — 386 `function` declarations against 491 arrow consts — and the
declaration form is what `api/src/functions/`, `api/src/lib/` and
`api/src/actions/` already use, while `communication/api/` uses the arrow form
throughout.

Incorrect:

```ts
const getAgents = async (session) => {
  const { data } = await http.get("/agents");

  return data;
};

export { getAgents };
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
async function getAgents({ accessToken }: { accessToken: string }) {
  const { data } = await http.get("/agents", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return data;
}

export { getAgents };
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

A function taking more than two arguments takes a single destructured object with
an inline type, so every value is named at the call site.

Positional arguments are unreadable at three and dangerous at four. Ten functions
in the repository take three or more, and the worst are in `communication/`:
`createSession(accessToken?, agentId?, blueprintId?, variables?)` takes five,
four of them optional and three of them strings, so `createSession(token,
agentId, variables)` type-checks and silently passes `variables` as
`blueprintId`. `createKnowledge(session, learnType, agentId, learningInfo)` and
`pollForNewSupervising(client, channelId, user, message)` are the same shape with
no types at all.

Incorrect:

```ts
const createSession = async (
  accessToken?: string,
  agentId?: string,
  blueprintId?: string,
  variables?: Record<string, unknown>
) => {};
```

Incorrect:

```ts
const createKnowledge = async (session, learnType, agentId, learningInfo) => {};

await createKnowledge(session, "QA", agent.id, { question, answer });
```

Four values in a row at the call site, and nothing naming which is which.

Incorrect:

```ts
const getTokens = async (code: string, mcp, id: string, isTeam: boolean) => {};
```

A trailing boolean flag, which reads as `getTokens(code, mcp, id, true)` at every
call site.

Correct:

```ts
async function createSession({
  accessToken,
  agentId,
  blueprintId,
  variables,
}: {
  accessToken: string;
  agentId: string;
  blueprintId?: string;
  variables?: Record<string, unknown>;
}) {}
```

Correct:

```ts
await createKnowledge({
  session,
  type: "QA",
  agentId: agent.id,
  learning: { question, answer },
});
```

Correct:

```ts
function cleanIconName(icon?: string) {
  if (!icon) return "";

  return icon.replace(/^:+|:+$/g, "");
}
```

One or two arguments stay positional.

---

### `fn/guard-clauses-over-nesting`

**Severity: `warn`**

Handle failing and empty cases first with an early return, keeping the function's
real work at one level of indentation.

Nesting the happy path inside `if` blocks pushes the important code to the right
and separates each condition from the work it guards. `api/src/functions/knowledge.ts`
and every route that checks a tenant already read this way.

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

Split a function once it does more than one thing, outgrows roughly a screen, or
needs an "and" in its name.

Length is a symptom rather than the defect, but it tracks the defect closely
here. The largest files are `api/src/mcps/mcps.ts` at 8397 lines,
`dashboard/src/widgets/BlueprintFlowWidget/BlueprintFlowWidget.tsx` at 1541,
`api/src/functions/agent.ts` at 1260 and
`dashboard/src/components/SupervisingChat/SupervisingChat.tsx` at 1065 — and
`SupervisingChat.tsx` is one of only two files in the repository carrying a
blanket `eslint-disable`, because a file that large accumulates violations faster
than anyone fixes them.

Incorrect:

```ts
async function step({ stepId, action, parameters, comment, resultScore }) {
  const step = await Step.findByPk(stepId);
  const task = await Task.findByPk(step.taskId);

  const resolved = resolveParameterRefs(parameters, { steps: task.steps });
  const registryEntry = actions.find(action);
  const module = await import(`../actions/${registryEntry.lib}`);
  const result = await module.default.run({ parameters: resolved, meta });

  await step.update({ result, status: result.error ? "FAILED" : "COMPLETED" });

  const siblings = await Step.findAll({ where: { taskId: task.id } });

  if (siblings.every((s) => s.status === "COMPLETED")) {
    await task.update({ status: "COMPLETED" });
    await event.publish("TASK_COMPLETED", { taskId: task.id });
  }

  await StepScore.create({ stepId, score: resultScore, comment });
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

The "and" in the name is the tell — two callers want two different halves of
this, and neither can have one.

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

Never write `any` — use the real type, a narrow interface, or `unknown` with a
check.

`any` disables checking for every expression it touches and spreads through
assignments silently. There are 120 `any` annotations in the repository,
distributed very unevenly: 65 in `mcp/`, 40 in `api/`, 10 in `communication/`, 5
in `dashboard/` and none in `server-dashboard/` — which is the one package with
`strict`, `noUnusedLocals` and `noUnusedParameters` all on. The cost is highest
where the compiler is already weakest: `api/tsconfig.json` sets `strict: true`
but `noImplicitAny: false`, and `dashboard/tsconfig.json` sets `strict: false`,
so an untyped parameter is `any` without anyone writing it.

Incorrect:

```ts
export const getProductByIdTool: Tool<any> = {
  name: "GREY:get_product_by_id",
  handler: async (args: any) => {
    const response = await fetch(`${API_BASE_URL}/products/${args.productId}`);
  },
};
```

The `mcp/` tool shape, repeated 29 times across the servers.

Incorrect:

```ts
await event.subscribe("TASK_CREATED", async (payload: any) => {
  await agentFn.task({ taskId: payload.taskId });
});
```

Incorrect:

```ts
function resolveParameterRefs(parameters: any, context: any): any {
  return parameters;
}
```

Correct:

```ts
type GetProductByIdArgs = { productId: string };

export const getProductByIdTool: Tool<GetProductByIdArgs> = {
  name: "GREY:get_product_by_id",
  handler: async ({ productId }) => {
    const response = await fetch(`${API_BASE_URL}/products/${productId}`);
  },
};
```

Correct:

```ts
await event.subscribe<{ taskId: string }>("TASK_CREATED", ({ taskId }) =>
  agentFn.task({ taskId })
);
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
`api/src/lib/parameterRefs.ts` already uses.

---

### `ts/no-lying-generics`

**Severity: `error`**

A type parameter must be carried through the body; a generic whose implementation
casts to `any` promises safety it does not deliver.

This is worse than plain `any`, because the signature reads as checked. Every
helper in `mcp/servers/order/db/index.ts` does it: `findOne<T extends keyof
Database>(table: T, key: string, value: any)` declares a return type of
`Database[T][number] | null`, then immediately writes `db[table] as any[]` and
looks up `item[key]`, so `key` is unchecked against the record, `value` is
unchecked against the field, and the promised return type is a cast rather than a
deduction. A caller gets red squiggles for the wrong things and none for the
right ones.

Incorrect:

```ts
export function findOne<T extends keyof Database>(
  table: T,
  key: string,
  value: any
): Database[T][number] | null {
  const db = loadDatabase();
  const records = db[table] as any[];

  return records.find((item) => item[key] === value) || null;
}
```

Incorrect:

```ts
export function findAll<T extends keyof Database>(
  table: T,
  filter?: (item: Database[T][number]) => boolean
): Database[T] {
  const records = loadDatabase()[table] as any[];

  return (filter ? records.filter(filter) : records) as Database[T];
}
```

Two casts to `any[]` and one back to `Database[T]`, so the type parameter
constrains nothing inside the function.

Correct:

```ts
export function findOne<T extends keyof Database, K extends keyof Row<T>>(
  table: T,
  key: K,
  value: Row<T>[K]
): Row<T> | null {
  const records: Row<T>[] = loadDatabase()[table];

  return records.find((item) => item[key] === value) ?? null;
}
```

`key` is now constrained to the table's own fields and `value` to that field's
type, so `findOne("products", "vendor_id", 42)` fails to compile.

Correct:

```ts
type Row<T extends keyof Database> = Database[T][number];

export function findAll<T extends keyof Database>(
  table: T,
  filter?: (item: Row<T>) => boolean
): Row<T>[] {
  const records: Row<T>[] = loadDatabase()[table];

  return filter ? records.filter(filter) : records;
}
```

Correct:

```ts
export function getDatabase(): Database {
  return loadDatabase();
}
```

A function with nothing to parameterise takes no type parameter.

---

### `ts/share-union-types`

**Severity: `error`**

A value with a fixed set of members is declared once as an exported union type
and imported wherever it is used.

The status vocabulary is written out by hand in ten places across six different
member sets, and the duplication crosses the package boundary: `"COMPLETED" |
"FAILED" | "SUPERVISED"` appears four times — in `api/src/functions/stepScore.ts`,
`api/src/models/StepScore.ts`, `dashboard/src/hooks/useTaskScores.ts` and
`dashboard/src/components/TaskScores/ScoreCard.tsx` — while `functions/task.ts`
alone carries both `"COMPLETED" | "FAILED"` and `"IN_PROGRESS" | "COMPLETED" |
"FAILED"`. Around them the same strings appear as bare literals in TypeScript 60
times for `"COMPLETED"`, 49 for `"IN_PROGRESS"`, 24 for `"FAILED"`, 23 for
`"ANSWERED"` and 6 for `"SUPERVISED_NEEDED"`, so adding a member means finding
every one of those sites by hand.

The repository uses union types rather than `enum` — there is not a single `enum`
in 538 files — and that is the convention to keep, because a union erases at
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

Two inline unions for one concept in one file, already disagreeing.

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

The column and the shared type are declared together, so a new member is one edit
in each.

---

### `ts/unknown-in-catch`

**Severity: `error`**

A caught error is `unknown` and is narrowed before its properties are read.

TypeScript types a caught value as `unknown`, and annotating it `any` throws that
away — `error.message` on a thrown string is `undefined`, and on a thrown object
is whatever happened to be there. Six `catch (err: any)` clauses exist today. The
narrowing idiom is already established in `api/server.ts`, `api/src/app.ts` and
every `mcp/` tool handler.

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
} catch (error) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
        }),
      },
    ],
    isError: true,
  };
}
```

The shape every `mcp/` tool handler already uses.

---

### `ts/no-suppression-comments`

**Severity: `error`**

Never write `@ts-ignore` or `@ts-nocheck` — fix the type, narrow the value, or
declare the shape the compiler is missing.

A suppression silences every error on the line, including ones introduced later,
and it is invisible to `tsc --noEmit` by design. There is one in the repository,
at `api/src/functions/agent.ts:552`, sitting in the largest function of the
largest file in that package — which is the usual pairing. Where a suppression is
genuinely unavoidable, `@ts-expect-error` with a reason is the form to use,
because it fails the build once the underlying error is fixed and so cannot
outlive its cause.

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

Never assert a value away with `!` — check it, or type it optional and use
optional chaining.

`agent!.teamId` tells the compiler to stop asking and does nothing at run time, so
the `TypeError` still happens; it just happens without a warning first. Five
non-null assertions exist today, and optional chaining with a guard covers every
case they do while producing a real branch.

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

---

## 5. Control flow

### `flow/no-nested-ternary`

**Severity: `warn`**

Allow one ternary per expression, turning any second condition into an `if`, an
early return, or a lookup.

Nested ternaries have no visual structure — the reader counts `?` and `:` to find
which branch belongs to which test — and they resist adding a fourth case without
a rewrite. A single ternary choosing between two values is fine and is used
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

---

### `flow/no-ternary-as-statement`

**Severity: `error`**

A ternary produces a value; when both branches are called only for their effects,
write `if`/`else`.

A ternary in statement position discards its result, so the reader has to notice
that the interesting part is the side effect rather than the value — and any
linter rule about unused expressions cannot tell the two apart.
`server-dashboard/src/App.tsx:36` is the live case, and it sits in the one
package with no ESLint configuration at all.

Incorrect:

```tsx
next.has(url) ? next.delete(url) : next.add(url);
```

Incorrect:

```ts
error ? platform.logger.error({ message }) : platform.logger.info({ message });
```

Correct:

```tsx
if (next.has(url)) {
  next.delete(url);
} else {
  next.add(url);
}
```

Correct:

```ts
const level = error ? "error" : "info";

platform.logger[level]({ message });
```

Choosing a value with the ternary and acting on it once is the version that
keeps the effect visible.

---

### `flow/exhaustive-switch`

**Severity: `error`**

A `switch` over a union handles every member, and its `default` branch either
returns a real fallback or fails loudly.

`noFallthroughCasesInSwitch` is on in `dashboard/tsconfig.json` and
`server-dashboard/tsconfig.json` and absent from `api/`, `communication/` and
`mcp/`, so most of the repository does not catch even a missing `break` — and no
package catches a missing *case*. A `switch` on a union with no `default` returns `undefined` for a member
added later. `communication/api/createKnowledge.ts` shows the cost: its `switch`
on `learnType` handles `URL`, `QA` and `TEXT`, and any other type posts a body
with no content field at all.

Incorrect:

```ts
switch (learnType) {
  case "URL":
    body.url = learningInfo;
    break;
  case "QA":
    body.answer = learningInfo.answer;
    body.question = learningInfo.question;
    break;
  case "TEXT":
    body.text = learningInfo;
    break;
}

await http.post("/knowledge", body);
```

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

```ts
function knowledgeBody(type: KnowledgeType, learning: Learning) {
  switch (type) {
    case "URL":
      return { url: learning.url };
    case "QA":
      return { question: learning.question, answer: learning.answer };
    case "TEXT":
      return { text: learning.text };
    default: {
      const exhaustive: never = type;

      throw new Error(`UNSUPPORTED_KNOWLEDGE_TYPE_${String(exhaustive)}`);
    }
  }
}
```

Adding a member to `KnowledgeType` now fails `tsc` at this line rather than
posting an empty body.

Correct:

```tsx
function getTableHead(selectedType: KnowledgeType) {
  switch (selectedType) {
    case "URL":
      return [{ id: "url", label: "URL" }, { id: "", label: "" }];
    case "QA":
      return [{ id: "question", label: "Question" }, { id: "", label: "" }];
    default:
      return [{ id: "", label: "" }];
  }
}
```

A `default` returning a real fallback is the other valid ending.

---

### `flow/array-methods-over-index-loops`

**Severity: `warn`**

Transform collections with `map`, `filter`, `find`, `some` and `reduce`, keeping
`for` loops for iteration that exits early or walks indices.

The method name states the intent — `filter` returns a subset, `map` returns the
same length, `some` returns a boolean — where a `for` loop with a manual
accumulator makes the reader reconstruct it. `for` remains right where the loop
breaks early or walks characters, as it does in `api/src/lib/jsonParse.ts`.

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

## 6. Asynchrony and lifetime

### `async/await-over-then`

**Severity: `warn`**

Sequence asynchronous work with `async`/`await`, reserving `.then` for promises
deliberately not awaited or adapted to a callback API.

Mixing the two styles in one function makes the order of operations hard to read
and puts errors in two places, since a `try/catch` does not catch a rejection
inside a `.then` callback that follows it. There are 19 `.then` chains in the
repository, and the legitimate ones are the fire-and-forget writes and the
memoized provider load in `api/src/lib/llm.ts`.

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

---

### `async/no-floating-promises`

**Severity: `error`**

Every promise is awaited, returned, or given its own `.catch`, and none is left
dangling.

An unawaited promise means the caller continues before the work finishes, and its
rejection reaches the `unhandledRejection` handler in `api/server.ts` with no
indication of what started it. Logging and metrics writes are the legitimate
fire-and-forget cases, which is exactly why they must carry their own handler.

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

### `async/clear-every-timer`

**Severity: `error`**

Every `setInterval` and `setTimeout` keeps its handle and clears it — on unmount
in React, and on its own terminal condition anywhere else.

In the browser an uncleared interval outlives the component; in a long-lived Node
process it outlives everything, because there is no unmount to save you.
`communication/actions/setupSupervisingInfo.ts` is the one uncleared timer in the
repository, and it is the worst possible place for one: `pollForNewSupervising`
calls `setInterval` without storing the handle, so every invocation of the action
adds another permanent poller to the process, each holding its own closure over
`previousSupervisings` and each posting to Slack forever. The dashboard side of
this is [`effect/clear-timers`](dashboard/architecture.md); this rule is the
server side.

Incorrect:

```ts
const pollForNewSupervising = async (client, channelId, user, message) => {
  let previousSupervisings = (await storage.get("supervisingInfo")) || [];

  setInterval(async () => {
    const newSupervisings = await fetchNewSupervisingInfo(user);

    for (const entry of newSupervisings) {
      await client.chat.postMessage({ channel: channelId, text: entry.question });
    }
  }, POLL_INTERVAL_MS);
};
```

Incorrect:

```tsx
useEffect(() => {
  setInterval(() => {
    getSteps(selectedTask.id);
  }, 2000);
}, [selectedTask?.id]);
```

Correct:

```ts
function pollForNewSupervising({ client, channelId, user }: PollInput) {
  const interval = setInterval(async () => {
    const entries = await fetchNewSupervisingInfo(user);

    for (const entry of entries) {
      await client.chat.postMessage({ channel: channelId, text: entry.question });
    }
  }, POLL_INTERVAL_MS);

  return () => clearInterval(interval);
}
```

Returning the stopper makes the caller responsible for the lifetime, which is
what lets one channel's polling be torn down without restarting the process.

Correct:

```tsx
useEffect(() => {
  const interval = setInterval(() => {
    getSteps(selectedTask.id);
  }, STEP_POLL_INTERVAL_MS);

  return () => clearInterval(interval);
}, [selectedTask?.id]);
```

Correct:

```ts
const intervalId = setInterval(async () => {
  const { data: knowledge } = await http.get(`/knowledge`);

  if (knowledge.status === "COMPLETED") {
    clearInterval(intervalId);
    publish("KNOWLEDGE_STATUS_CHANGED", { ...knowledge });
  }
}, KNOWLEDGE_POLL_INTERVAL_MS);
```

A poll outside React clears itself when its terminal status arrives.

---

### `async/parallelise-independent-work`

**Severity: `warn`**

Run independent awaits together through `Promise.all`, sequencing them only where
a later call needs an earlier result.

Sequential awaits over independent calls cost the sum of their latencies instead
of the maximum, and this code is latency-bound — every action step is a network
call and several are LLM completions. `Promise.all` appears in 10 places already,
so the pattern is established rather than novel.

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

Each scrape waits for the previous one although none depends on it.

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

### `net/bound-every-external-call`

**Severity: `error`**

Every call to a service you do not control carries a timeout, checks the response
status, and bounds any retry.

There are 18 `await fetch` calls across `api/`, `communication/` and `mcp/` and
not one `AbortController`, `signal` or `timeout` option anywhere in the
repository. `fetch` has no default timeout, so a provider that accepts the
connection and never answers holds the request and its whole closure open
indefinitely — and these calls reach LLM providers, an ASR endpoint, AWS,
Puppeteer targets and arbitrary MCP servers. Status checking is in better shape:
14 of the 18 already test `response.ok`, which matters because `fetch` does not
reject on a 4xx or 5xx and will happily hand an error page to `JSON.parse`.

Incorrect:

```ts
const response = await fetch(`${API_BASE_URL}/products/${productId}`);
const result = await response.json();

return result.data;
```

No timeout and no status check, so an error page parses into `undefined`.

Incorrect:

```ts
while (true) {
  const { status } = await pollTranscription(jobId);

  if (status === "COMPLETED") break;
}
```

An unbounded retry against a remote job that may never complete.

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
one — see [`action/release-external-resources`](api/architecture.md).

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

---

## 7. Errors

### `error/no-empty-catch`

**Severity: `error`**

A `catch` block is never empty — it handles, logs, converts, or returns a
documented fallback.

An empty `catch` deletes the only evidence that something failed. There is one in
the repository, at `mcp/servers/grey/tools/knowledge_lookup.ts:38`, where a
failed `JSON.parse` of an error body leaves the caller with a generic message and
no record of why. The deliberate `return null` in the dashboard's mutation hooks
is not an empty catch — it is a documented contract that callers branch on,
covered by
[`data/mutations-swallow-and-return-null`](dashboard/architecture.md).

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
  logger.warn({
    message: "Knowledge lookup returned a non-JSON error body",
    status: response.status,
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
`dashboard/src/utils/formatters.ts` writes it.

---

### `error/preserve-the-cause`

**Severity: `error`**

When you catch an error and throw a different one, attach the original as
`cause`.

Replacing an error with a domain code is right — `platform.error.handle` maps
codes to responses, and a code is what tests and logs compare on — but discarding
the original is what makes the resulting log line useless:
`MCP_TOKEN_EXCHANGE_FAILED` with no indication of whether the provider returned
401, timed out, or sent malformed JSON.

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
credentials — goes into the message instead.

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

The code goes to the client, the detail goes to the log, and the original stays
reachable.

---

### `error/fail-fast-on-missing-configuration`

**Severity: `error`**

Required configuration is validated where it is read, and a missing value fails
with a message naming the variable.

Configuration that is absent produces `undefined` in a request path, a URL
containing the string `undefined`, or a client constructed with no credentials —
all of which fail later, somewhere unrelated, with a message that does not name
the cause. `api/src/lib/llm.ts` sets the shape to copy: its `parseProviderModel`
names the variable, the received value and the valid set.

Incorrect:

```ts
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
```

Incorrect:

```ts
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000";

const response = await fetch(`${API_BASE_URL}/products/${productId}`);
```

A silent localhost fallback, repeated across the `mcp/` tools, so a
misconfigured deployment quietly talks to nothing instead of failing.

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
if (!(provider in PROVIDER_LOADERS)) {
  throw new Error(
    `Unknown LLM provider "${providerPart}" in PLATFORM_LLM="${raw}". ` +
      `Expected "<provider>/<model>" where provider is one of: ` +
      Object.keys(PROVIDER_LOADERS).join(", ")
  );
}
```

Correct:

```ts
const launchTemplateId = process.env.AWS_LAUNCH_TEMPLATE_ID;

if (!launchTemplateId) {
  return { error: "AWS_LAUNCH_TEMPLATE_ID is not configured" };
}
```

Inside an action an anticipated failure is returned rather than thrown — see
[`action/return-errors-do-not-throw`](api/architecture.md).

---

## 8. Data and immutability

### `data/no-parameter-mutation`

**Severity: `error`**

A function does not mutate the objects or arrays it was given; it builds and
returns a new value.

The caller has no way to know its argument changed, so the effect surfaces
somewhere unrelated. It is worse in the dashboard, where React compares by
reference: mutating an array in place leaves the reference identical, so the
component holding it does not re-render and the screen shows stale data the state
believes is fresh.

Incorrect:

```ts
function markCompleted(step: Step) {
  step.status = "COMPLETED";

  return step;
}
```

Incorrect:

```tsx
function renderMatches({ matches }) {
  matches.sort((a, b) => a.index - b.index);

  return matches.map((match) => <Mention key={match.id} match={match} />);
}
```

`matches.sort` reorders the caller's array in place — the shape at
`dashboard/src/components/BlueprintChat/BlueprintChatTitle.tsx:91`.

Incorrect:

```ts
async function publishStepAdded(payload: StepPayload) {
  payload.publishedAt = new Date().toISOString();

  await event.publish("STEP_ADDED", payload);
}
```

Correct:

```ts
function markCompleted(step: Step): Step {
  return { ...step, status: "COMPLETED" };
}
```

Correct:

```tsx
function renderMatches({ matches }) {
  const ordered = [...matches].sort((a, b) => a.index - b.index);

  return ordered.map((match) => <Mention key={match.id} match={match} />);
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

Mutating a value the function created itself is fine — the local `stack` and
`repaired` in `api/src/lib/jsonParse.ts` are owned by the function that builds
them.

---

### `data/copy-before-sort`

**Severity: `warn`**

Spread an array before `sort` or `reverse`, because both mutate in place.

`Array.prototype.sort` returning the array reads like `map` and behaves like
`push`, which is why the mistake is easy to make and hard to see in review. Both
places the repository sorts by timestamp — the sessions route and the
`SUPERVISING_ANSWERED` handler in `api/src/app.ts` — sort results they have just
fetched, which is the safe case; this rule keeps it safe when one of them is
later handed a list from a caller.

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
fallback.

There are 29 `JSON.parse` calls in the repository — 18 in `api/`, 6 in
`dashboard/`, 4 in `mcp/` and 1 in `server-dashboard/` — and the input is never
trusted: it is a model completion, a stored step result, an OAuth error body, a
file on disk, or a value out of `localStorage`. `mcp/servers/order/db/index.ts`
is the sharpest case, because `loadDatabase()` parses the whole database file
with no guard and is called by every `findOne`, `findAll`, `insert` and `update`,
so a single malformed write takes down every tool on that server. Model output
specifically goes through `api/src/lib/jsonParse.ts`, which strips markdown fences
and repairs truncated braces first — see
[`llm/repair-and-parse-model-json`](api/architecture.md).

Incorrect:

```ts
function loadDatabase(): Database {
  const data = fs.readFileSync(DB_PATH, "utf-8");

  return JSON.parse(data);
}
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
a first visit or a partially written key.

Correct:

```ts
function loadDatabase(): Database {
  const data = fs.readFileSync(DB_PATH, "utf-8");

  try {
    return JSON.parse(data);
  } catch (error) {
    throw new Error(`DATABASE_FILE_CORRUPT at ${DB_PATH}`, { cause: error });
  }
}
```

Correct:

```tsx
const [favorites, setFavorites] = useState<Set<string>>(() => {
  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);

    return new Set(stored ? JSON.parse(stored) : []);
  } catch {
    return new Set();
  }
});
```

The guarded read `server-dashboard/src/App.tsx` already uses.

Correct:

```ts
import { parseJsonContent } from "../lib/jsonParse";

const completion = await client.chat.completions.create(payload);

return parseJsonContent(completion.choices[0].message.content, "OpenAI");
```

---

## 9. Dates and numbers

### `date/guard-before-date-arithmetic`

**Severity: `error`**

Check that a timestamp exists before constructing a `Date` from it, because
`new Date(undefined).getTime()` is `NaN` and `NaN` fails every comparison
silently.

There are 58 `new Date(...)` sites in the repository and the failure mode carries
no error: a comparator returning `NaN` leaves the array in its original order, a
duration renders as `NaN`, and nothing logs. This is live surface —
`api/src/models/Agent.ts:25` sets `timestamps: false`, so `agent.createdAt` is
`undefined`, while `AgentCard` renders it and the sessions route sorts by it; and
`communication/actions/setupSupervisingInfo.ts` compares
`new Date(newSupervising.createdAt) > new Date(setupTimestamp)` where
`setupTimestamp` comes from storage and may be absent. Fixing the model is
[`model/timestamps-match-consumers`](api/architecture.md); guarding the
arithmetic is this rule, and both are needed.

Incorrect:

```ts
const sorted = sessions.sort(
  (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
);
```

Incorrect:

```ts
const isAfterSetup =
  new Date(newSupervising.createdAt) > new Date(setupTimestamp);
```

`new Date(undefined)` is an Invalid Date, and every `>` against it is `false`, so
an absent `setupTimestamp` silently filters everything out.

Incorrect:

```tsx
<Typography>{new Date(agent.createdAt).toISOString()}</Typography>
```

`toISOString` on an invalid date throws `RangeError`, so one row without a
timestamp blanks the screen.

Correct:

```ts
const sorted = [...sessions].sort((a, b) => {
  const left = a.createdAt ? new Date(a.createdAt).getTime() : 0;
  const right = b.createdAt ? new Date(b.createdAt).getTime() : 0;

  return right - left;
});
```

Correct:

```ts
const setupAt = setupTimestamp ? new Date(setupTimestamp).getTime() : 0;

const isAfterSetup = new Date(newSupervising.createdAt).getTime() > setupAt;
```

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

Convert to a number explicitly, always with a radix on `parseInt`, and check the
result before using it.

`Number("")` is `0`, `Number(null)` is `0`, `parseFloat("abc")` is `NaN`, and
`+value` hides which of those you meant. A `NaN` score written to a `StepScore`
row propagates into every average computed from it and raises nothing. The
repository has no `parseInt` without a radix and two `parseFloat` calls — both in
`api/src/functions/agent.ts`, at lines 120 and 394 — which already do the
explicit-conversion half and skip the check.

Incorrect:

```ts
const score = +req.body.resultScore;

await StepScore.create({ stepId, score });
```

Incorrect:

```ts
const resultScore =
  result_score != null ? parseFloat(String(result_score)) : undefined;

await step.update({ resultScore });
```

Explicit conversion with no `NaN` check, so a non-numeric value writes `NaN` to
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

## 10. Environment and process

### `env/read-through-config`

**Severity: `error`**

Read `process.env` in `config.ts` and in the few modules that own a specific
integration, so feature code reads the resulting config object instead.

`process.env.*` is referenced at 113 sites across 41 files, covering `AWS_*`,
`GDRIVE_*`, `ATLASSIAN_*`, `GOOGLE_*` and `ASR_*`. Nothing enumerates what the
application needs in order to boot, so a missing variable is found by whichever
request touches it first, and `.env.example` cannot be kept accurate by reading
the code. Concentrating the reads gives one place to validate, one place to
document, and one place a reviewer checks against
[`config/env-for-secrets-config-for-shape`](api/architecture.md).

Incorrect:

```ts
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000";

export const getProductByIdTool: Tool<GetProductByIdArgs> = {
  handler: async ({ productId }) =>
    fetch(`${API_BASE_URL}/products/${productId}`),
};
```

An environment read at module scope in a tool file, repeated across the `mcp/`
servers with a localhost fallback in each.

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

An environment read in the dashboard bundle, frozen at build time and invisible
to `config.live.js`.

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

  return fetch(endpointUrl, { headers: { Authorization: `Bearer ${apiKey}` } });
}
```

Correct:

```tsx
import config from "../../config";

const { beta } = config;
```

The provider-selection read in `api/src/lib/llm.ts` is the deliberate exception:
it reads `PLATFORM_LLM` at module scope because the value decides which module
loads, and it validates against the known provider set on the spot.

---

### `env/no-import-time-side-effects`

**Severity: `error`**

Importing a module only defines things — reading files, opening connections,
calling `dotenv.config()`, creating directories and starting servers belong in an
exported `init` or the entry point.

A side effect at import time runs on every path that transitively imports the
module, including a test that only wanted a type, and it runs in an order set by
the import graph rather than by anything you chose. There are six
`dotenv.config()` calls in the repository and `communication/` holds five of
them, at module scope in `account.ts`, `chatApp.ts`, `http.ts`, `server.ts` and
`test_chat/session.ts`, so load order decides which one wins.
`mcp/servers/activedirectory/index.ts` calls `fs.mkdirSync` while being imported,
and `communication/server.ts` ends with `startServer().catch(console.error)`. The
pattern to copy is `api/`: `models/models.ts` exports `init()`, and `server.ts`
calls `await platform.init(config)` then `await models.init()` in a sequence it
controls.

Incorrect:

```ts
import dotenv from "dotenv";

dotenv.config();

const http = axios.create({ baseURL: process.env.BASE_URL });

export default http;
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

`server.ts` is the entry point, so it is the one place this sequence belongs and
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

## 11. React state and effects

### `react/derive-during-render`

**Severity: `error`**

Compute a value derivable from props or existing state during render, never in a
`useState` kept in sync by a `useEffect`.

Mirroring a prop into state creates a second copy that is right only after an
extra render, so the first paint shows the initial value and the screen flickers.
Worse, the effect must list the prop as a dependency to stay correct, and the
usual response to the lint warning is to empty the array and suppress the rule —
at which point the value never updates at all.
`dashboard/src/components/AddNewButton/AddNewButton.tsx` is exactly that: a
`useState` holding a style object, a `useEffect` with a `switch` on the `type`
prop, an empty dependency array and an
`eslint-disable-next-line react-hooks/exhaustive-deps` holding it in place, so the
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

Correct:

```tsx
const size = styles[type] ?? styles.default;
```

The lookup [`component/styles-module`](dashboard/architecture.md) describes — no
state, no effect, correct on the first render.

Correct:

```tsx
const selected = team ?? agents?.[0] ?? null;
```

Correct:

```tsx
const [draftName, setDraftName] = useState(agent?.name);

useEffect(() => {
  setDraftName(agent?.name);
}, [agent?.name]);
```

The one legitimate mirror: an editable draft the user then diverges from, reset
when the underlying record changes.

---

### `react/pure-state-updaters`

**Severity: `error`**

A `setState` updater computes the next state and nothing else — no writes to
storage, no network calls, no `publish`.

React treats updaters as pure functions and may call them more than once for a
single update; StrictMode does so deliberately in development. An updater with a
side effect therefore fires that effect an unpredictable number of times, and the
bug does not reproduce in production builds, which is the worst possible failure
signature. `server-dashboard/src/App.tsx:37` writes to `localStorage` inside a
`setFavorites(prev => ...)` updater — in the one package with no ESLint
configuration, so `react-hooks/rules-of-hooks` is not watching either.

Incorrect:

```tsx
const toggle = (url: string) => {
  setFavorites((prev) => {
    const next = new Set(prev);

    next.has(url) ? next.delete(url) : next.add(url);
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...next]));

    return next;
  });
};
```

Incorrect:

```tsx
setConversations((prev) => {
  publish("AI_RESPONDED", { content });

  return [...prev, { role: "AI", content }];
});
```

Correct:

```tsx
const toggle = (url: string) => {
  const next = new Set(favorites);

  if (next.has(url)) {
    next.delete(url);
  } else {
    next.add(url);
  }

  setFavorites(next);
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...next]));
};
```

Correct:

```tsx
useEffect(() => {
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...favorites]));
}, [favorites]);
```

Persisting from an effect keyed on the value is the other correct shape, and it
survives any number of updater invocations.

Correct:

```tsx
socket.on("ai_message", ({ content }) => {
  setConversations((prev) => [...prev, { role: "AI", content }]);
  publish("AI_RESPONDED", { content });
});
```

The updater returns the next state; the publish happens beside it, in the handler
that owns the event.

---

### `react/one-source-of-truth-per-value`

**Severity: `warn`**

Hold one fact in one place, never keeping a value, a copy of it, and a flag
describing their relationship.

Every additional `useState` is another thing to keep in sync on every path, and
the paths multiply: `dashboard/src/components/AgentAbout/AgentAbout.tsx` holds
seven `useState` values for two editable fields — `description`,
`tempDescription`, `isDescUpdated` and the same three for `name` — reconciled by
an effect that resets four of them. The dashboard has 226 `useState` calls
against 95 `useEffect`s, and the effects are largely there to reconcile the
states. Deriving the flag from the two values removes a class of "the button is
enabled but the field is unchanged" bug outright.

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

Independent facts still get their own state; the point is that a value and its
derivative do not.

---

## 12. Logging

### `log/level-matches-severity`

**Severity: `warn`**

Choose the level by what a reader should do about the line: `error` needs
attention, `warn` is degraded but handled, `info` marks a lifecycle event, and
`debug` does not ship.

The repository logs 120 times and effectively uses two levels — 74 `console.log`,
36 `console.error`, 6 `console.debug`, 3 `console.info` and a single
`console.warn`. With everything at `log`, no alert can be built and no filter is
useful: a routine step transition and a failed token exchange are the same line
to anything downstream. The volume sits mostly outside the packages that route
through `platform.logger` — `communication/` has 51, `api/` 37, `mcp/` 25 and
`dashboard/` 7 — and which sink to use is
[`obs/platform-logger-not-console`](api/architecture.md); this rule is about
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
platform.logger.info({ message: "Token exchange failed", mcpId });
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

Handled and degraded — worth noticing, not worth waking anyone.

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

A log call passes an object of named fields under a constant `message`, so values
are fields rather than fragments of a sentence.

A log line is a record, and a record is queryable only if its parts are named.
`Agent 72ef5b08 created in team cb16e069` cannot be filtered by team, counted by
agent, or joined to anything; the same information as fields can. The constant
`message` is what makes a group of occurrences one event, and `api/server.ts`
already writes this shape for uncaught exceptions — `message`, `error_message`,
`error_stack`.

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

The values are interpolated into `message`, so every occurrence is a distinct
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

## 13. Module boundaries

### `module/no-cross-package-reach`

**Severity: `error`**

A sibling package or server does not import another's internals; shared code
moves to a shared location.

Reaching sideways couples two units that are meant to ship and fail
independently, and it usually starts as "the type is already defined over
there". `mcp/servers/` shows both halves of the problem at once: the `Tool<T>`
interface is defined five separate times — in `activedirectory`, `gdrive`,
`order`, `servicenow` and `telco` — and the sixth server, `grey`, has no
`types.ts` of its own and instead imports `../../gdrive/tools/types` from 12 of
its tool files. So the same contract is duplicated five ways *and* one server now
cannot be extracted without taking Google Drive with it. The fix is one shared
module, not a sixth copy.

Incorrect:

```ts
import { Tool } from "../../gdrive/tools/types";

export const getProductByIdTool: Tool<GetProductByIdArgs> = {
  name: "GREY:get_product_by_id",
};
```

The `grey` server depending on the `gdrive` server, in 12 files.

Incorrect:

```ts
export interface Tool<T> {
  name: string;
  description: string;
  inputSchema: object;
  handler: (args: T) => Promise<ToolResult>;
}
```

declared independently in five `servers/*/tools/types.ts` files, so a change to
the tool contract means five edits and a guess about the sixth.

Incorrect:

```ts
import { formatKey } from "../../../dashboard/src/utils/formatters";
```

Correct:

```ts
export interface Tool<T> {
  name: string;
  description: string;
  inputSchema: object;
  handler: (args: T) => Promise<ToolResult>;
}
```

in `mcp/lib/tool.ts`, imported by every server:

```ts
import { Tool } from "../../lib/tool";
```

Correct:

```ts
import { runCli } from "../../lib/cli";
```

`mcp/servers/gdrive/index.ts` already reaches for shared code the right way —
`mcp/lib/` exists, and it is where `Tool<T>` belongs too.

---

### `module/no-cycles`

**Severity: `error`**

Two modules do not import each other, directly or through a chain — break the
cycle with a third module, an interface, or a registration step.

A cycle resolves to a partially initialised module at run time, so one side sees
`undefined` where it expected a class or a function, and which side depends on
which was imported first — which is why the failure moves when an unrelated
import is added. It also defeats tree shaking and makes both modules impossible
to test in isolation. The live risk is the model layer: `api/src/models/Agent.ts`
imports `./AIEngine` for its `@ForeignKey`, and a `@BelongsTo` on the other side
would close the loop. That is precisely why associations are declared centrally —
see [`model/associations-in-init`](api/architecture.md).

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

Keep relative imports shallow, reaching through a folder's barrel rather than
climbing more than two levels up the tree.

`../../../` appears 36 times and is the point at which a path stops saying where
the target is — you count directories to find out, and any file move rewrites
every one of them. There are 43 `index.ts` barrels already, which is the
mechanism: `components/AgentCard` resolves through its barrel from any depth, so
the import says what it wants instead of how to walk there. Nothing in the
repository reaches four levels up today, and that ceiling is worth keeping. The
`@/*` alias in `dashboard/tsconfig.json` is not the answer, because nothing wires
it into Vite and [`ts/relative-imports`](dashboard/architecture.md) forbids using
it.

Incorrect:

```tsx
import SourcedAvatar from "../../../components/SourcedAvatar/SourcedAvatar";
import { cleanIconName } from "../../../utils/cleanIconName";
```

Incorrect:

```tsx
import AgentCard from "../../../../components/AgentCard";
```

Four levels up, which nothing in the repository does today.

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

A sub-component belonging to one feature stays beside it, so the import never
leaves the folder.

---

## 14. Comments

### `comment/explain-why`

**Severity: `warn`**

Let the code carry the *what*, and comment only where the *why* cannot be read
from it — a workaround, a non-obvious constraint, a decision that looks wrong
until explained.

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

JSDoc repeating the signature adds nothing the types do not already say, and
`react/prop-types` is off precisely because the types are the documentation.

Correct:

```ts
// Some models (observed on Llama via Bedrock) occasionally drop the final
// closing brace(s) when emitting JSON as plain text. This repairs unbalanced
// braces/brackets (tracked outside of string literals) before re-parsing.
function repairUnbalancedJSON(content: string): string | null {}
```

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

Delete dead code rather than commenting it out, because git already has the
history.

Commented-out code cannot be linted, type-checked, tested or refactored, and it
gives no indication of whether it is a work in progress, a rollback, or something
forgotten. `api/server.ts` reaches `config.kafka.ts` and `config.txq.ts` only
through commented-out import lines, which is why
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

---

## 15. Formatting and enforcement

### `format/prettier-owns-layout`

**Severity: `error`**

Let Prettier decide line breaks, quotes, semicolons and indentation, without
hand-formatting around it or adding per-file style overrides.

`api/`, `dashboard/`, `communication/` and `mcp/` all extend
`plugin:prettier/recommended`, which reports formatting as an ESLint error — so
hand-formatted code fails `bun run lint` rather than merely looking different.
The drift is visible exactly where that enforcement is missing: `server-dashboard/`
has no ESLint configuration at all and writes 4 of its imports with single
quotes, and `communication/` has a lint config but no script to run it and writes
2 the same way. Everywhere lint actually runs, the count is zero.

Incorrect:

```ts
import { useState, useMemo } from 'react';
import './App.css';
```

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
import { useMemo, useState } from "react";

import "./App.css";
```

Correct:

```ts
const agent = await Agent.findOne({ where: { id: validatedId, teamId } });
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
span, never a whole file.

A bare `/* eslint-disable */` removes the file from every rule, not the
inconvenient one: `no-eval`, `eqeqeq`, `react-hooks/rules-of-hooks` and the rest
go with it. `dashboard/` runs lint with `--max-warnings 0` and lint is one of only
two checks CI performs there, so a blanket disable is a hole in the gate. Two
files in the repository do this, and `SupervisingChat.tsx` — over a thousand
lines, with data hooks and dialogs in it — is one of them.
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

Most of the repository is checked by nothing. Root `lint` is
`bun run lint:dashboard` and root `typecheck` is `typecheck:dashboard`, so the
`Test` workflow never touches the other four packages. `api/` has a `lint` script
that nothing at the root calls, no `typecheck` script at all despite
`api/tsconfig.json` setting `strict: true`, and a build that goes through esbuild
and never type-checks. `communication/` and `mcp/` each carry a `.eslintrc.json`
with no script to run it. `server-dashboard/` has no ESLint configuration at all,
and is the only package whose `tsconfig.json` sets `strict`, `noUnusedLocals` and
`noUnusedParameters` together — the strictest settings in the repository, checked
only as a side effect of `tsc && vite build`.

The gap is not abstract. It is why the `any` count is 65 in `mcp/` and 5 in
`dashboard/`, and why every finding in this catalog concentrated in the packages
nothing runs.

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

`api/`'s script without `--max-warnings 0`, so warnings accumulate silently while
the dashboard's identical rules fail the build.

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

## 16. Testing craft

### `test/descriptive-case-names`

**Severity: `warn`**

A test name states the behaviour and the condition, so a failure report is
readable without opening the file.

The name is the only part of a test that appears in CI output, and a sentence
naming the input and the expected outcome turns a red build into a bug report.
`api/src/lib/test/jsonParse.spec.ts` is the model — "strips a markdown fence",
"appends missing closing braces", "does not count braces inside string literals"
— and there are 12 spec and Cypress files in the repository to keep consistent
with it.

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

A name long enough to be a paragraph is as unreadable in CI output as one that is
too short.

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

A test contains no `if`, no loop and no computed expectation, asserting against
literal values instead.

A conditional in a test means one of its branches is not running and nothing
reports which; a computed expectation reimplements the code under test, so both
can be wrong the same way and the test still passes. There is no conditional
logic in any of the 12 spec and Cypress files today, and this rule keeps it that
way.

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

Each `it` exercises one behaviour, keeping that behaviour's assertions together
and giving unrelated ones their own case.

A case asserting four behaviours reports the first failure and hides the other
three, so a single regression looks like a single failure and the rest are found
one build at a time. The counterpart matters as much: a cross-tenant rejection is
one behaviour with two assertions — the status, and that the record survived —
and splitting those weakens the test, because the status alone passes while the
row is already gone.

Incorrect:

```ts
it("handles agents", async () => {
  const { body: created } = await request(app).post("/agents").send(agent).expect(201);

  deepEqual(created.name, "Test Agent");

  const { body: list } = await request(app).get("/agents").expect(200);

  deepEqual(list.length, 3);

  await request(app).delete(`/agents/${created.id}`).expect(204);
});
```

Create, list and delete in one case, sharing state and reporting one failure.

Incorrect:

```ts
it("returns 401 for another team's agent", async () => {
  await request(app).delete(`/agents/${otherTeamAgentId}`).expect(401);
});
```

Half the behaviour — the bypass in `routes/agents.ts` returns `401` *and* deletes
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