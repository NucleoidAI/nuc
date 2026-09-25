---
name: demo-case-from-blueprint
description: Generate a demo overlay case (demo/cases/*.json) from a GreyCollar blueprint. Use when the user asks to create, generate or draft a demo case / demo scenario / overlay case for a blueprint (by id, title or pasted JSON). Asks the user about everything the blueprint does not define instead of guessing.
---

# Demo case from blueprint

Turn a blueprint (a node graph the agent follows) into a demo case the overlay in `demo/` plays: windows to arrange, steps with presenter notes, and event triggers that advance the demo live.

## Ground rule: never assume

A blueprint only says **what the agent does**. It does not say **what the audience sees**: which apps are on screen, how the customer starts the flow, which branch the demo takes, how approval happens. Every such detail comes from the user.

- If something is not written in the blueprint, the existing cases, or the code, **ask** with `AskUserQuestion`. Do not fill it with a plausible default.
- When you have a sensible candidate (e.g. a window definition reused from an existing case), offer it as an option labelled "(Recommended)" — the user still picks it.
- Batch questions: up to 4 per `AskUserQuestion` call, grouped by topic. Do not ask one-by-one when several are independent.
- Never invent customer data, policy numbers, email addresses, URLs, Chrome profile names or app names.
- If the user's answer is ambiguous, ask again rather than interpreting.

## 1. Load the blueprint

Input is one of: blueprint id, blueprint title, or pasted JSON.

- Seeds live in `api/src/seeds/Blueprint.json` (`{ sequence, seed: [...] }`, each row has `id`, `title`, `description`, `skill`, `nodes`, `agentId`, `context`). Look up by `id` or `title`.
- If several titles match, or none, ask the user which one (or to paste the JSON). Do not pick the closest one.

From the blueprint extract:
- `nodes[]` in graph order following `next` from the root (the node no other node points to).
- For each node: `type` (`NORMAL` / `SWITCH`), `properties.action`, `label`, `description`.
- `SWITCH` nodes: `properties.cases[]` (`nodeId`, `label`, `description`).
- Action namespaces: `PLATFORM:*` is GreyCollar itself; anything else (`AS400:*`, etc.) is an external system that may deserve its own window.

Print a short summary of the flow to the user (numbered nodes, branches marked) before asking questions, so they can correct your reading of it.

## 2. Read the current format — every time

The format evolves. Before writing, read:
- `demo/src/types.ts` — the `DemoCase` schema (windows, layout presets/sides, triggers, conditions).
- `demo/src/match.ts` — `where` conditions (`equals`, `not`, `contains`, `matches`, `in`, `exists`, scalar = equals), `{{var}}` rendering, `capture` paths (dot paths into the payload).
- `demo/src/events.ts` — `KNOWN_EVENTS`.
- All files in `demo/cases/` — house style, and window definitions that can be offered for reuse.
- `demo/server.ts` `validate()` — what the loader rejects.

### Event payloads (verify against the source if a trigger depends on a field)

| Event | Published in | Payload fields |
|---|---|---|
| `TASK_CREATED` | `api/src/functions/task.ts` | `taskId, agentId, description, blueprintId, sessionId` |
| `TASK_COMPLETED` | `api/src/functions/task.ts` | `taskId, result, comment` |
| `STEP_ADDED` | `api/src/functions/task.ts` | `stepId, taskId, action, parameters, comment, resultScore` |
| `STEP_COMPLETED` / `STEP_FAILED` | `api/src/functions/task.ts` (`STEP_${status}`) | `taskId, stepId, action, parameters, result` |
| `SESSION_INITIATED` | `api/src/functions/session.ts` | `id, type, agentId, blueprintId, variables?` |
| `SUPERVISING_RAISED` | `api/src/functions/supervising.ts` | `sessionId, conversationId, question, agentId, blueprintId, taskId` |
| `SUPERVISING_ANSWERED` | `api/src/functions/supervising.ts` | `sessionId, agentId, question, answer, type, taskId` |
| `EMAIL_RECEIVED` | `communication/email/inbox.ts` | `sessionId, newSession, from, fromName, to, subject, text, mailbox` |
| `EMAIL_SENT` | `communication/email/session.ts` | `sessionId, to, subject, text, mailbox` |

If a trigger you want relies on a field or value not in this table (e.g. whether a `PLATFORM:switch` or `PLATFORM:complete` node emits its own `STEP_ADDED`, or the exact `result` string of a step), grep the source (`api/src/functions/agent.ts`, `api/src/actions/`) to confirm. If the source does not settle it, ask the user.

## 3. Ask what the blueprint cannot tell

Cover at least these. Skip one only if the user already answered it in the conversation.

**Scope**
- Which `SWITCH` branch does this demo follow? One case per branch, or only one branch? (Existing precedent: `policy-address-update.json` and `policy-phone-update.json` are one blueprint, one case per branch.)
- Target file name in `demo/cases/`. If it exists, ask before overwriting.

**How the flow starts**
- Channel that triggers the blueprint: email, WhatsApp, chat, dashboard, other. This decides the first step's `advance` event (e.g. `EMAIL_RECEIVED`) and what can be captured (`sessionId`, `from` as `customer`...).
- Any `where` filter on the first event (e.g. subject contains a word)? Only add filters the user states.

**Windows** — one question per distinct thing on screen:
- The customer-side app (Gmail web, Outlook app, WhatsApp...): `type` (`chrome` / `chrome-app` / `app`), `url`, `profile`, or `app` name.
- The GreyCollar window: type, app name or url, and the `route` per step if a specific page should open (existing cases use `/agents/{{agentId}}?tab=tasks`).
- For each external action namespace (`AS400:*` etc.): is there a window for it, and its exact definition? Or is it not shown?
- For `PLATFORM:two_factor` nodes: which approval channel is used in this demo (it comes from agent knowledge, not the blueprint) and which window shows it.
- Offer matching definitions from existing cases as options, but let the user confirm.

**Steps and layout**
- Which nodes get their own demo step, and which are merged or skipped (e.g. `PLATFORM:switch`, `PLATFORM:complete` are often not worth a screen). Propose a list; the user confirms.
- Layout per step: which windows, and arrangement (`side: left/right/full` with `ratio`, or a `preset`). Propose; the user confirms. A one-line ASCII preview in `AskUserQuestion` previews helps.
- Should the demo end with a final step without `advance` (a closing screen)?

**Text**
- Language of `title`, `note`, `label` (existing cases are English).
- Anything the presenter must do or say at a step that you cannot derive (e.g. "Approve the request").

**Extras**
- Should a narrator script `demo/narration/<case>.md` be written too, in the style of the existing ones? Only if the user says yes.

## 4. Build the case

Conventions from the existing cases:

- `vars`: put the blueprint id in, e.g. `"<camelName>BlueprintId": "<id>"`.
- Top-level `captures`: `TASK_CREATED` where `blueprintId: "{{<camelName>BlueprintId}}"`, capturing `taskId` and `agentId`, so later steps can filter by `{{taskId}}` and route to `{{agentId}}`.
- `indicator: { "position": "right", "size": 360 }`, `gap: 8` unless the user says otherwise.
- A step's `advance` is what moves the overlay **to the next step**. So the trigger that belongs on step N is the event that marks the start of what step N+1 shows.
  - Next step is about a node starting → `STEP_ADDED` with `where: { taskId: "{{taskId}}", action: "<node action>" }`.
  - Next step is after an approval → `STEP_COMPLETED` with `action: "PLATFORM:two_factor"` and the confirmed `result` value.
  - Next step is the finish → `TASK_COMPLETED` with `taskId`.
  - Reply over email → `EMAIL_SENT` with `sessionId`.
- Filter every task-level trigger by `{{taskId}}`, every session-level trigger by `{{sessionId}}`, so a second demo run or a stray event does not advance the wrong step.
- Give each `advance` trigger a `label` ("Waiting for ...") — the overlay shows it.
- `{{var}}` in `note` / `title` only for vars that are captured before that step.
- Step `id`: kebab-case, unique. Every `pane.window` must exist in `windows`.
- 2-space JSON, key order as in existing cases.

## 5. Show, then write, then check

1. Show the user the step list (id, title, windows, advancing event) as a compact table and ask for confirmation or changes.
2. Write the file.
3. Validate:
   ```bash
   cd demo && bun -e '
   const d = await Bun.file("cases/<file>.json").json();
   const w = new Set(Object.keys(d.windows));
   const bad = d.steps.flatMap(s => (s.layout?.panes ?? []).filter(p => !w.has(p.window)).map(p => `${s.id}: ${p.window}`));
   const ids = d.steps.map(s => s.id);
   const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
   console.log({ steps: ids.length, unknownWindows: bad, duplicateIds: dup });
   '
   ```
   and `cd demo && bun test`.
4. Report: file path, the step table, and the list of things the user decided (so they can spot a wrong answer), plus anything left open.
