# GitHub Copilot Code Review Instructions (API)

Use these instructions when reviewing files under `/api/src`.

## Goal

Review against these backend boundaries:

- `routes/` = HTTP layer only (validation, auth check, status codes, call service)
- `functions/` = business logic and orchestration
- `models/` + `schemas/` = persistence/data contract
- `lib/` = external providers/SDK clients
- `dataset/` = machine-readable JSON datasets only
- `seeds/` = seed JSON data only

Focus on correctness, security, contract stability, and test coverage.

## Critical Rule: Dataset Format

`/api/src/dataset/**` and `/api/src/seeds/**` must contain JSON objects only.

Reject if:

- human-language docs, markdown, prose prompts, plain text
- root value is string/array/number
- comments in JSON-like files
- mixed text + JSON in one file

Accept if:

- valid JSON
- root is an object (`{}`)
- keys are explicit and machine-consumable

Bad example:

```md
# prompt

When user asks for help, be polite and explain steps...
```

Bad example:

```json
[{ "instruction": "do X" }]
```

Good example:

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

Review comment template:

- `dataset/` and `seeds/` must be JSON-object only. Replace prose/markdown or non-object root with a valid object-shaped JSON schema.

## Layer Rules With Examples

### 1) Routes must stay thin

What to flag:

- direct DB/model manipulation in route handlers
- business rules implemented inside route files
- duplicated try/catch/response mapping blocks across routes

Bad example:

```ts
// routes/agents.ts
router.post('/', async (req, res) => {
  const agent = new AgentModel(req.body); // REVIEW: persistence in route
  await agent.save();
  if (agent.role === 'admin') { ...complex domain rule... }
  res.json(agent);
});
```

Good example:

```ts
router.post("/", async (req, res) => {
  const result = await createAgent(req.body);
  res.status(201).json(result);
});
```

Review comment template:

- Route should remain HTTP-only. Move persistence/domain logic into `functions/` and keep route focused on request/response mapping.

### 2) Functions own business logic

What to flag:

- business logic spread across multiple routes
- logic embedded in `lib/` provider wrappers
- function returning HTTP-specific objects (`res`, status strings)

Bad example:

```ts
// functions/agent.ts
export async function createAgent(data, res) {
  if (!data.name) return res.status(400).send("bad"); // REVIEW: HTTP concern
}
```

Good example:

```ts
export async function createAgent(data) {
  if (!data.name) throw new Error("AGENT_NAME_REQUIRED");
  return await agentRepo.create(data);
}
```

Review comment template:

- `functions/` should be transport-agnostic. Return domain result/errors and let `routes/` map them to HTTP responses.

### 3) Lib wraps providers only

What to flag:

- `lib/` files containing domain decisions
- provider secrets/logging leaks
- missing timeout/retry handling for network clients

Bad example:

```ts
// lib/openai.ts
if (team.plan === "free") rejectRequest(); // REVIEW: domain policy in provider wrapper
```

Good example:

```ts
// lib/openai.ts
export async function callOpenAI(payload) {
  return client.responses.create(payload);
}
```

Review comment template:

- Keep `lib/` limited to provider interaction. Move plan/policy/domain rules to `functions/`.

### 4) Models/Schemas define contracts

What to flag:

- route/function using fields not present in schema
- breaking schema changes without migration/seed/test updates
- inconsistent required/optional semantics

Review comment template:

- Data contract mismatch: code reads/writes fields not defined in schema/model. Align schema + logic and add migration/test coverage.

## API PR Checks (Copy/Paste)

- [ ] Route layer is thin (no domain/persistence logic)
- [ ] Business logic lives in `functions/`
- [ ] Provider wrappers in `lib/` contain no domain policy
- [ ] Input validation and error mapping are consistent
- [ ] No sensitive data exposure in logs/responses
- [ ] Dataset and seeds are JSON objects only (no human-language prose)
- [ ] Schema/model changes include test and compatibility checks
- [ ] Tests cover changed behavior (`api/src/routes/test` and relevant units)

## Severity Guide

- `High`: security issue, broken contract, dataset format violation, domain logic in wrong layer causing incorrect behavior
- `Medium`: missing validation/error handling, boundary leakage, test gaps on critical path
- `Low`: naming/readability/non-blocking refactor ideas

## Output Format for Copilot Review

When leaving review comments:

1. One-line violation summary
2. Exact file and line
3. Concrete risk
4. Exact fix direction

Example:

- `api/src/dataset/prompts.md:1`: Dataset content is human-language markdown. Dataset files must be JSON objects only. Replace with a `.json` object schema and move prose docs outside `dataset/`.

## What NOT to do

- Do not approve prose/markdown inside `dataset/` or `seeds/`.
- Do not request broad rewrites when a focused layer fix is enough.
- Do not block on stylistic preferences when behavior/contracts are correct.
