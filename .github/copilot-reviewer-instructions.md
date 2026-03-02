# GitHub Copilot Code Review Instructions (Dashboard UI)

Use these instructions when reviewing files under `/dashboard/src`.

## Goal

Review against this architecture rule set:

- `components/` = stateless UI building blocks
- `widgets/` = API calls + data orchestration + feature behavior
- `layouts/` = layout composition only
- `pages/` = page-level containers and routing composition

Focus on real regressions, design violations, and missing tests. Avoid style-only comments unless they block maintainability.

## Review Order

1. Identify file layer (`components`, `widgets`, `layouts`, `pages`).
2. Check if logic belongs to that layer.
3. Flag boundary violations with concrete fix suggestions.
4. Verify loading/error/empty states for async flows.
5. Verify tests for behavior changed in PR.

## Layer Rules With Examples

### 1) Components must be stateless

What to flag:

- `useEffect`, `useReducer`, complex `useState` state machines
- direct API/hook calls (`useAgents`, `useTask`, `fetch`, `axios`)
- route navigation logic (`useNavigate`) unless purely presentational wrapper

Allowed:

- tiny UI-only local state (open/close, input value, hover)
- callbacks passed from parent

Bad example:

```tsx
// components/UserCard.tsx
function UserCard() {
  const { users } = useUsers(); // REVIEW: data fetching in component layer
  return <div>{users.length}</div>;
}
```

Good example:

```tsx
// components/UserCard.tsx
function UserCard({ name, onOpen }) {
  return <button onClick={onOpen}>{name}</button>;
}
```

Review comment template:

- `components/` should stay stateless/presentational. Move data access (`useUsers`) to a `widget` and pass data via props.

### 2) Widgets own API and orchestration

What to flag:

- widgets that only proxy props without orchestration value
- business logic duplicated across multiple widgets
- missing async guards (loading/error/empty)

Bad example:

```tsx
function AgentsWidget() {
  const { agents } = useAgents();
  return agents.map(...); // no loading/error/empty handling
}
```

Good example:

```tsx
function AgentsWidget() {
  const { agents, loading, error } = useAgents();
  if (loading) return <AgentsSkeleton />;
  if (error) return <ErrorState message={error.message} />;
  if (!agents.length) return <EmptyState title="No agents" />;
  return <AgentGrid agents={agents} />;
}
```

Review comment template:

- Widget is the correct layer for fetching/orchestration, but async state handling is incomplete. Add explicit `loading`, `error`, and empty rendering.

### 3) Layouts should not contain feature logic

What to flag:

- API calls, domain rules, mutation logic, feature-specific event handling
- layout importing low-level API hooks directly

Allowed:

- responsive structure, slots, tab shells, section positioning

Bad example:

```tsx
function AgentLayout() {
  const { deleteAgent } = useAgents(); // REVIEW: domain mutation in layout
}
```

Good example:

```tsx
function AgentLayout({ header, sidebar, content }) {
  return <Grid>{/* compose regions only */}</Grid>;
}
```

Review comment template:

- `layouts/` should stay structural. Move domain logic to a widget/page and pass render data/handlers down.

### 4) Pages are containers

What to flag:

- pages with large inline UI trees that should be widget/component
- pages duplicating orchestration already present in widgets

Allowed:

- route params
- choosing layout
- wiring widgets together

Bad example:

```tsx
function AgentsPage() {
  // 250 lines of cards/dialog/forms inline
}
```

Good example:

```tsx
function AgentsPage() {
  const teamId = storage.get("itemId");
  return (
    <SingleScrollableLayout title="Agents">
      <AgentsWidget teamId={teamId} />
    </SingleScrollableLayout>
  );
}
```

Review comment template:

- This page is carrying feature UI/logic that belongs in `widgets/` and `components/`. Keep page as route/container composition.

## PR Checks (Copy/Paste)

Use this checklist in review:

- [ ] File layer matches behavior (`components/widgets/layouts/pages`)
- [ ] No API/data orchestration inside `components/`
- [ ] Widgets handle loading/error/empty states
- [ ] Layouts stay structural (no domain logic)
- [ ] Pages remain container-level
- [ ] No duplicated orchestration logic across widgets
- [ ] Side effects are cleaned up and dependency-safe
- [ ] Tests cover changed behavior (unit/integration/e2e as needed)

## Severity Guide

- `High`: wrong layer creates bugs or blocks scaling (e.g., API in `components/`, mutation in `layouts/`)
- `Medium`: missing async state handling, duplicated orchestration, weak separation
- `Low`: naming, minor readability, non-blocking refactor suggestions

## Output Format for Copilot Review

When leaving review comments:

1. State violation in one sentence.
2. Cite exact file and line.
3. Explain risk.
4. Give direct fix.

Example:

- `dashboard/src/components/AgentCard/AgentCard.tsx:42`: `useAgents()` is called inside `components/`. This breaks layer boundaries and makes reuse/testing harder. Move data fetch to the parent widget and pass `agent` as prop.

## What NOT to do

- Do not request broad rewrites when a targeted move is enough.
- Do not block PR for purely stylistic preference.
- Do not suggest moving logic upward if widget layer is the right owner.
