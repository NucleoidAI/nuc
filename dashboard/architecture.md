# Dashboard Architecture — Rule Catalog

Architecture rules for `dashboard/src`, written in the style of the ESLint rule
reference: every rule has an id, a severity, a rationale, and paired
**incorrect** / **correct** examples.

All examples are drawn from code that exists in this repository. Paths above each
snippet point at the file the pattern was taken from.

## How to read this document

| Severity | Meaning |
| --- | --- |
| `error` | Blocks review. The change is in the wrong layer or breaks a contract other code depends on. |
| `warn` | Fix unless there is a stated reason. Consistency and maintainability. |

Rules marked **(automated)** are already enforced by `.eslintrc.json`. `lint`
runs with `--max-warnings 0`, so a `warn` fails just as hard as an `error` — in
the `Test` workflow, which runs `bun run lint` and `bun run typecheck` on every
PR to `main`, and in the `pre-push` hook, when it is installed.

Two gaps are worth knowing before trusting the automation:

- **Cypress never runs automatically.** `test.yml` runs lint and typecheck only.
  The specs run through `npm test`, which is invoked by the `pre-push` hook —
  and `prepare.cjs`, which writes that hook, is not wired to a `prepare` script
  in `package.json`, so the hook exists only for developers who ran it by hand.
  Appendix B records what has already drifted as a result.
- **TypeScript is not strict.** See [`ts/explicit-types-under-non-strict`](#tsexplicit-types-under-non-strict).

The rest are review rules — no linter catches them today. They are enforced by
`.github/copilot-reviewer-instructions.md` and by humans, and the pairs below are
what a reviewer should point at.

---

## 1. The module graph

Imports flow in one direction only. A module may import from any layer below it,
never from a layer above or beside it at the same level.

```
routes.tsx
   └── src/pages/            route params, layout choice, widget mounting
          └── src/layouts/   region composition, tab shells
                 └── src/widgets/     hooks + local state + orchestration
                        └── src/components/   presentational only
                               └── src/utils, src/lib, src/constants, src/styles

src/hooks/     the only layer allowed to touch the network (platform http)
src/http/      the only place allowed to construct an axios instance
config.js      the only source of hosts, feature flags and provider settings
```

Cross-cutting, importable from anywhere:

- `@nucleoidai/react-event` — the `publish` / `useEvent` bus
- `@nucleoidjs/webstorage` — the `storage` accessor
- `@canmingir/link/platform/components` — `Iconify`, `CustomPopover`, `usePopover`, `useTable`
- `config` — application configuration

### Responsibilities per layer

| Layer | Owns | Must not contain |
| --- | --- | --- |
| `pages/` | route params, storage lookups, layout choice, `<Page name>` | feature UI trees, orchestration already in a widget |
| `layouts/` | regions, tab state, slot composition | data hooks, mutations, domain rules |
| `widgets/` | hook calls, dialogs, local state machines, loading/empty/error | raw `http` calls, presentational primitives |
| `components/` | markup, MUI styling, callbacks from props | data hooks, `http`, widget imports |
| `hooks/` | `http` calls via `useApi`, event wiring, domain types | JSX |
| `utils/`, `lib/`, `constants/` | pure functions and static data | React, network |

---

## 2. Rule index

### Layer boundaries

| Rule | Severity |
| --- | --- |
| [`layer/no-data-access-in-components`](#layerno-data-access-in-components) | `error` |
| [`layer/no-upward-imports`](#layerno-upward-imports) | `error` |
| [`layer/widgets-own-orchestration`](#layerwidgets-own-orchestration) | `error` |
| [`layer/layouts-stay-structural`](#layerlayouts-stay-structural) | `error` |
| [`layer/pages-are-containers`](#layerpages-are-containers) | `error` |

### Data access

| Rule | Severity |
| --- | --- |
| [`data/http-only-in-hooks`](#datahttp-only-in-hooks) | `error` |
| [`data/no-direct-axios`](#datano-direct-axios) | `error` |
| [`data/use-api-for-reads`](#datause-api-for-reads) | `error` |
| [`data/getters-are-hooks`](#datagetters-are-hooks) | `error` |
| [`data/hook-return-shape`](#datahook-return-shape) | `error` |
| [`data/mutations-swallow-and-return-null`](#datamutations-swallow-and-return-null) | `warn` |
| [`data/handle-async-states`](#datahandle-async-states) | `warn` |
| [`data/use-loading-for-refetch`](#datause-loading-for-refetch) | `warn` |

### Events

| Rule | Severity |
| --- | --- |
| [`event/naming`](#eventnaming) | `error` |
| [`event/publish-after-mutation`](#eventpublish-after-mutation) | `error` |
| [`event/subscribe-as-fetch-dependency`](#eventsubscribe-as-fetch-dependency) | `error` |
| [`event/namespace-cross-app`](#eventnamespace-cross-app) | `warn` |

### Component authoring

| Rule | Severity |
| --- | --- |
| [`component/named-function-default-export`](#componentnamed-function-default-export) | `warn` |
| [`component/folder-and-barrel`](#componentfolder-and-barrel) | `warn` |
| [`component/inline-prop-types`](#componentinline-prop-types) | `warn` |
| [`component/styles-module`](#componentstyles-module) | `warn` |
| [`component/theme-tokens`](#componenttheme-tokens) | `warn` |

### Imports and configuration

| Rule | Severity |
| --- | --- |
| [`import/sort-order`](#importsort-order) **(automated)** | `warn` |
| [`import/no-mui-loading-button`](#importno-mui-loading-button) **(automated)** | `warn` |
| [`import/config-for-hosts`](#importconfig-for-hosts) | `error` |
| [`import/storage-over-local-storage`](#importstorage-over-local-storage) | `warn` |

### Testing

| Rule | Severity |
| --- | --- |
| [`test/data-cy-on-interactive`](#testdata-cy-on-interactive) | `error` |
| [`test/select-by-data-cy`](#testselect-by-data-cy) | `error` |
| [`test/await-domain-events`](#testawait-domain-events) | `warn` |

### Forms and dialogs

| Rule | Severity |
| --- | --- |
| [`form/rhf-with-yup-resolver`](#formrhf-with-yup-resolver) | `error` |
| [`form/submit-button-state`](#formsubmit-button-state) | `warn` |
| [`form/reset-after-submit`](#formreset-after-submit) | `warn` |
| [`dialog/callback-props-not-setters`](#dialogcallback-props-not-setters) | `error` |
| [`dialog/guard-close-while-submitting`](#dialogguard-close-while-submitting) | `warn` |
| [`dialog/stacked-z-index`](#dialogstacked-z-index) | `warn` |

### Effects and lifecycle

| Rule | Severity |
| --- | --- |
| [`effect/clear-timers`](#effectclear-timers) | `error` |
| [`effect/unregister-socket-handlers`](#effectunregister-socket-handlers) | `error` |
| [`effect/scoped-deps-disable`](#effectscoped-deps-disable) | `warn` |

### TypeScript

| Rule | Severity |
| --- | --- |
| [`ts/explicit-types-under-non-strict`](#tsexplicit-types-under-non-strict) | `error` |
| [`ts/relative-imports`](#tsrelative-imports) | `warn` |

### Presentation primitives

| Rule | Severity |
| --- | --- |
| [`ui/platform-table-primitives`](#uiplatform-table-primitives) | `warn` |
| [`ui/format-dates-with-helpers`](#uiformat-dates-with-helpers) | `warn` |
| [`ui/iconify-and-clean-names`](#uiiconify-and-clean-names) | `warn` |
| [`ui/skeleton-per-screen`](#uiskeleton-per-screen) | `warn` |

### Pure modules and the flow subsystem

| Rule | Severity |
| --- | --- |
| [`pure/react-free-modules`](#purereact-free-modules) | `error` |
| [`pure/export-style`](#pureexport-style) | `warn` |
| [`flow/adapter-owns-translation`](#flowadapter-owns-translation) | `warn` |
| [`flow/validate-before-save`](#flowvalidate-before-save) | `warn` |

### Content rendering

| Rule | Severity |
| --- | --- |
| [`content/markdown-through-renderer`](#contentmarkdown-through-renderer) | `error` |
| [`content/restrict-dangerous-html`](#contentrestrict-dangerous-html) | `error` |
| [`ui/sx-over-inline-style`](#uisx-over-inline-style) | `warn` |
| [`ui/deterministic-per-entity-visuals`](#uideterministic-per-entity-visuals) | `warn` |

### Dependencies, charts and external windows

| Rule | Severity |
| --- | --- |
| [`deps/declare-what-you-import`](#depsdeclare-what-you-import) | `error` |
| [`chart/options-through-use-chart`](#chartoptions-through-use-chart) | `warn` |
| [`auth/postmessage-explicit-origin`](#authpostmessage-explicit-origin) | `error` |
| [`auth/read-tokens-from-link-namespace`](#authread-tokens-from-link-namespace) | `warn` |
| [`chat/commands-are-data`](#chatcommands-are-data) | `warn` |

### Cypress infrastructure

| Rule | Severity |
| --- | --- |
| [`test/fixtures-track-renames`](#testfixtures-track-renames) | `error` |
| [`test/typed-custom-commands`](#testtyped-custom-commands) | `warn` |
| [`test/intercepts-in-named-commands`](#testintercepts-in-named-commands) | `warn` |
| [`test/fixture-layout`](#testfixture-layout) | `warn` |

### App robustness and shared state

| Rule | Severity |
| --- | --- |
| [`app/error-boundary-at-route`](#apperror-boundary-at-route) | `error` |
| [`state/no-module-level-mutable-singletons`](#stateno-module-level-mutable-singletons) | `error` |
| [`app/page-sets-document-title`](#apppage-sets-document-title) | `warn` |
| [`state/query-string-for-shareable-view-state`](#statequery-string-for-shareable-view-state) | `warn` |

### Tooling hygiene

| Rule | Severity |
| --- | --- |
| [`deps/no-unused-declared`](#depsno-unused-declared) | `warn` |
| [`deps/no-dead-tooling`](#depsno-dead-tooling) | `warn` |
| [`import/one-declaration-per-module`](#importone-declaration-per-module) | `warn` |
| [`data/sample-data-at-module-scope`](#datasample-data-at-module-scope) | `warn` |

### Accessibility

| Rule | Severity |
| --- | --- |
| [`a11y/icon-button-needs-label`](#a11yicon-button-needs-label) | `error` |
| [`a11y/dialog-labelled-by`](#a11ydialog-labelled-by) | `warn` |

### Storybook, resolution and lint scope

| Rule | Severity |
| --- | --- |
| [`lint/no-blanket-disable`](#lintno-blanket-disable) | `error` |
| [`story/theme-decorator-in-preview`](#storytheme-decorator-in-preview) | `error` |
| [`import/no-file-extensions`](#importno-file-extensions) | `warn` |
| [`component/barrel-is-index`](#componentbarrel-is-index) | `warn` |
| [`story/cover-presentational-components`](#storycover-presentational-components) | `warn` |

### Naming and React correctness

| Rule | Severity |
| --- | --- |
| [`react/no-index-keys-for-data`](#reactno-index-keys-for-data) | `error` |
| [`naming/file-matches-default-export`](#namingfile-matches-default-export) | `error` |
| [`naming/pascal-case-component-files`](#namingpascal-case-component-files) | `warn` |
| [`naming/domain-spelling`](#namingdomain-spelling) | `warn` |
| [`hooks/default-export`](#hooksdefault-export) | `warn` |
| [`ui/emotion-css-scoped-to-slate`](#uiemotion-css-scoped-to-slate) | `warn` |

### Event integrity and registration

| Rule | Severity |
| --- | --- |
| [`event/publish-subscribe-pairing`](#eventpublish-subscribe-pairing) | `error` |
| [`event/no-publish-during-render`](#eventno-publish-during-render) | `error` |
| [`data/default-empty-collections`](#datadefault-empty-collections) | `error` |
| [`event/platform-events-are-inbound`](#eventplatform-events-are-inbound) | `warn` |
| [`route/register-in-routes-and-menu`](#routeregister-in-routes-and-menu) | `warn` |

---

## 3. Layer boundaries

### `layer/no-data-access-in-components`

**Severity: `error`**

Files under `src/components/` must not import from `src/hooks/`, must not import
`@canmingir/link/platform/http`, and must not fetch. They receive data and
callbacks through props.

Rationale: components are the only reusable layer. A component that fetches its
own data can be mounted exactly once per screen, cannot be driven from Storybook,
and cannot be tested without a network stub.

Examples of **incorrect** code for this rule:

`src/components/SupervisingCard/SupervisingCard.tsx`

```tsx
import http from "@canmingir/link/platform/http";

function SupervisingCard({ supervise }) {
  const [usedNodeIds, setUsedNodeIds] = useState<Set<string> | undefined>();

  useEffect(() => {
    http.get(`/tasks/${supervise.taskId}/steps`).then((res) => {
      setUsedNodeIds(new Set(res.data.map((step) => step.nodeId)));
    });
  }, [supervise.taskId]);

  return <Card>{usedNodeIds?.size}</Card>;
}
```

Examples of **correct** code for this rule:

`src/components/AgentCard/AgentCard.tsx`

```tsx
export default function AgentCard({
  agent,
  onView,
  onEdit,
  onDelete,
  allAgentIds,
}: {
  agent: { id: string; name: string; description: string; icon?: string };
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  allAgentIds?: string[];
}) {
  const theme = useTheme();
  const popover = usePopover();

  return <Card onClick={onView}>{agent.name}</Card>;
}
```

**Allowed in components:** UI-local `useState` (open/closed, hover, input value),
`useTheme`, `usePopover`, `useTable`, and `useEvent` when the component is
reacting to a global UI signal rather than fetching.

---

### `layer/no-upward-imports`

**Severity: `error`**

A layer may only import downward. Specifically: `components/` must not import
from `widgets/`, and nothing outside `pages/` may import from `pages/`.

Rationale: an upward import makes the two layers one layer. `components/` stops
being safe to reuse, and the dependency graph acquires cycles that break tree
shaking and Storybook isolation.

Examples of **incorrect** code for this rule:

`src/components/BlueprintKnowledge/BlueprintKnowledge.tsx`

```tsx
import Knowledge from "../../widgets/Knowledge/Knowledge";

function BlueprintKnowledge({ blueprintId, agentId }) {
  return <Knowledge blueprintId={blueprintId} agentId={agentId} />;
}
```

Examples of **correct** code for this rule:

`src/layouts/AgentLayout.tsx`

```tsx
import Knowledge from "../widgets/Knowledge/Knowledge";
import ProfileCard from "../components/ProfileCard/ProfileCard";

function AgentLayout({ agent, loading, allAgentIds }) {
  const [currentTab, setCurrentTab] = useState("profile");

  return (
    <Box>
      <ProfileCard currentTab={currentTab} setCurrentTab={setCurrentTab} />
      {currentTab === "knowledge-base" && (
        <Knowledge teamId={agent.teamId} agentId={agent.id} />
      )}
    </Box>
  );
}
```

The composition happens in the layer that is allowed to see both — a layout, a
widget, or a page — not inside a component.

---

### `layer/widgets-own-orchestration`

**Severity: `error`**

Widgets are the only layer that combines data hooks, local state machines,
dialogs and user intent. A widget that only forwards props to one component
without adding orchestration should be deleted and the component used directly.

Rationale: this is the layer where a feature is assembled. Concentrating the
assembly makes behaviour changes single-file changes.

Examples of **incorrect** code for this rule:

```tsx
function AgentsWidget({ agents, onDelete }) {
  return <AgentGrid agents={agents} onDelete={onDelete} />;
}
```

Examples of **correct** code for this rule:

`src/widgets/AgentsWidget/AgentsWidget.tsx`

```tsx
function AgentsWidget({ teamId }) {
  const [formOpen, setFormOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteFunction, setDeleteFunction] = useState(null);

  const { getTeamAgents, deleteAgent, createAgent } = useAgents();
  const { agents, loading } = getTeamAgents();
  const isLoading = useLoading(loading);

  return (
    <>
      <AddNewButton addNew={"Agent"} onClickFunction={() => setFormOpen(true)} />
      {agents.map((agent) => (
        <AgentCard
          key={agent.id}
          agent={agent}
          onDelete={() => {
            setDeleteFunction(() => () => deleteAgent(agent.id));
            setDialogOpen(true);
          }}
        />
      ))}
      <ConfirmationDialog open={dialogOpen} onConfirm={deleteFunction} />
    </>
  );
}
```

---

### `layer/layouts-stay-structural`

**Severity: `error`**

Layouts compose regions, tabs and slots. They must not call data hooks or
mutations.

Rationale: layouts are shared across routes. A mutation inside a layout fires on
every route that uses it.

Examples of **incorrect** code for this rule:

```tsx
function AgentLayout({ agentId }) {
  const { deleteAgent } = useAgents();
  const { agent } = useAgent().getAgent(agentId);

  return <Box>{agent?.name}</Box>;
}
```

Examples of **correct** code for this rule:

`src/layouts/AgentLayout.tsx`

```tsx
function AgentLayout({
  agent,
  loading,
  initialTab,
  allAgentIds,
}: {
  agent: { id: string; name: string; icon: string; teamId: string };
  loading: boolean;
  initialTab?: string;
  allAgentIds?: string[];
}) {
  const [currentTab, setCurrentTab] = useState(initialTab ?? "profile");

  return (
    <Box>
      {loading ? <Skeleton variant="rectangular" height={200} /> : <ProfileCard />}
      {currentTab === "profile" && <Profile agentId={agent.id} />}
      {currentTab === "tasks" && <TasksWidget agentId={agent.id} />}
    </Box>
  );
}
```

Tab state, query-string sync and `useEvent` for UI signals are structural and
belong here. Fetching `agent` does not — the page passes it in.

---

### `layer/pages-are-containers`

**Severity: `error`**

A page resolves route params and storage keys, renders `<Page name>`, picks a
layout and mounts widgets. Feature UI belongs in widgets and components.

Rationale: pages are the routing contract in `routes.tsx`. Keeping them thin
means a route can be re-pointed without moving feature code.

Examples of **incorrect** code for this rule:

```tsx
function Agents() {
  const teamId = storage.get("itemId");
  const { agents } = useAgents().getTeamAgents();
  const [formOpen, setFormOpen] = useState(false);

  return (
    <Grid container>
      {agents.map((agent) => (
        <Card key={agent.id}>
          <Avatar src={agent.icon} />
          <Typography>{agent.name}</Typography>
          <IconButton onClick={() => setFormOpen(true)}>
            <Iconify icon="solar:pen-bold" />
          </IconButton>
        </Card>
      ))}
      <AgentWizard open={formOpen} onClose={() => setFormOpen(false)} />
    </Grid>
  );
}
```

Examples of **correct** code for this rule:

`src/pages/agents.tsx`

```tsx
function Agents() {
  const teamId = storage.get("itemId");

  const { getTeamById } = useTeam();
  const { team, loading } = getTeamById(teamId);

  if (loading) {
    return <AgentsSkeleton />;
  }

  return (
    <>
      <Page name={"Agent"} />
      <SingleScrollableLayout title={team?.name}>
        <AgentsWidget teamId={teamId} />
      </SingleScrollableLayout>
    </>
  );
}
```

A page may call one hook to resolve the entity that names the screen. It must not
own the feature's dialogs or lists.

---

## 4. Data access

### `data/http-only-in-hooks`

**Severity: `error`**

`@canmingir/link/platform/http` may only be imported from `src/hooks/**`. Every
other layer reaches the network through a hook.

Rationale: hooks are where cache invalidation lives. An `http` call outside a
hook never participates in the event-dependency refetch chain, so its data goes
stale the moment anything else mutates the same resource.

Examples of **incorrect** code for this rule:

`src/components/ChatInput/chat.config.ts`

```ts
import http from "@canmingir/link/platform/http";

const learnAction = async (command) => {
  const { data: createdKnowledge } = await http.post(`/knowledge`, {
    type,
    question,
    answer,
    agentId: agent.id,
  });

  publish("KNOWLEDGE_STATUS_CHANGED", { ...createdKnowledge });
};
```

Examples of **correct** code for this rule:

`src/hooks/useKnowledge.ts`

```ts
import http from "@canmingir/link/platform/http";

function useKnowledge() {
  const createKnowledge = async (knowledge: KnowledgeInput, agentId: string) => {
    const response = await http.post("/knowledge", {
      type: knowledge.type,
      question: knowledge.question,
      answer: knowledge.answer,
      agentId,
    });

    if (response && response.data) {
      publish("KNOWLEDGE_CREATED", { knowledge: response.data });
    }

    return response.data;
  };

  return { createKnowledge };
}
```

---

### `data/no-direct-axios`

**Severity: `error`**

`src/http/user.ts` is the only module allowed to `import axios`. It exists to
attach the identity-provider interceptor. Everything else uses
`platform/http` inside a hook.

Rationale: a second axios instance does not carry the `Authorization`
interceptor, so requests silently go out unauthenticated.

Examples of **incorrect** code for this rule:

```ts
import axios from "axios";

function useStatistics() {
  const getStatistics = () => axios.get(`${config.api}/statistics`);
  return { getStatistics };
}
```

Examples of **correct** code for this rule:

`src/hooks/useStatistics.ts`

```ts
import http from "@canmingir/link/platform/http";
import useApi from "./useApi";

function useStatistics() {
  const { Api } = useApi();

  const [teamSelected] = useEvent("PROJECT_SELECTED", null);
  const [configInitialized] = useEvent("CONFIG_INITIALIZED", null);

  const getStatistics = (fetchState: DependencyArray = []) => {
    const eventDependencies = [teamSelected, configInitialized];

    const { data, loading, error, fetch } = Api(
      () => http.get(`/statistics`),
      [...eventDependencies, ...fetchState]
    );

    return { statistics: data, loading, error, fetch };
  };

  const result = getStatistics();

  return {
    loading: result.loading,
    error: result.error,
    statistics: result.statistics,
  };
}
```

---

### `data/use-api-for-reads`

**Severity: `error`**

Reads go through `useApi().Api(apiCall, dependencies)`. Do not hand-roll
`useState` + `useEffect` + `try/catch` for a GET.

Rationale: `Api` is the shared contract for `data`, `loading`, `error` and
`fetch`, and it normalises the error to
`err.response?.data?.message || err.message`. A hand-rolled fetch produces a
different error shape and a different loading lifecycle.

Examples of **incorrect** code for this rule:

```ts
function useTasks(agentId: string) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    http.get(`/tasks?agentId=${agentId}`).then((res) => {
      setTasks(res.data);
      setLoading(false);
    });
  }, [agentId]);

  return { tasks, loading };
}
```

Examples of **correct** code for this rule:

`src/hooks/useTask.ts`

```ts
function useTask(id: string) {
  const { Api } = useApi();

  const getTask = (fetchState: DependencyArray = []) => {
    const { data, loading, error, fetch } = Api(
      () => (id ? http.get(`/tasks/${id}`) : Promise.resolve({ data: null })),
      [id, ...fetchState]
    );

    return { task: data, loading, error, fetch };
  };

  const result = getTask();

  return { loading: result.loading, error: result.error, task: result.task };
}
```

Guard a missing id inside the `apiCall`, by returning `null` or a resolved
`{ data: null }`, rather than by skipping the `Api` call.

---

### `data/getters-are-hooks`

**Severity: `error`**

The `getX` functions returned by a data hook call `Api`, which calls `useState`
and `useEffect`. They are hooks. Call them unconditionally at the top level of a
render — never inside a condition, a loop, a callback, or an event handler.

Rationale: `useApi.Api` runs three `useState` calls and a `useEffect` on every
invocation. Calling `getTeamAgents()` behind an `if` changes the hook order
between renders and React throws.

Examples of **incorrect** code for this rule:

```tsx
function AgentsWidget({ teamId, expanded }) {
  const { getTeamAgents } = useAgents();

  if (!expanded) {
    return <CollapsedCard />;
  }

  const { agents } = getTeamAgents();

  const handleRefresh = () => {
    const { agents: fresh } = getTeamAgents();
    return fresh;
  };

  return <AgentGrid agents={agents} onRefresh={handleRefresh} />;
}
```

Examples of **correct** code for this rule:

`src/widgets/Knowledge/Knowledge.tsx`

```tsx
function Knowledge({ agentId, teamId }) {
  const { getAgentKnowledges, getTeamKnowledges } = useKnowledge();

  const { knowledges, loading: agentKnowledgesLoading } =
    getAgentKnowledges(agentId);
  const { knowledges: teamKnowledges, loading: teamKnowledgesLoading } =
    getTeamKnowledges(teamId);

  const isKnowledgeLoading = agentKnowledgesLoading || teamKnowledgesLoading;
  const source = agentId ? knowledges : teamKnowledges;

  return <KnowledgeTable rows={source} loading={isKnowledgeLoading} />;
}
```

Both getters run every render; the branch picks between the results. To refetch
on demand use the returned `fetch`, not a second `getX()` call.

---

### `data/hook-return-shape`

**Severity: `error`**

A read getter returns `{ <domainName>, loading, error, fetch }`, renaming `data`
to the domain noun. A hook file exports its domain types. The hook itself
returns an object of functions and is default-exported.

Rationale: every widget destructures the same four keys. Renaming `data` at the
hook boundary is what lets a widget call two getters and disambiguate them.

Examples of **incorrect** code for this rule:

```ts
function useTeams() {
  const { Api } = useApi();

  const getTeams = () => Api(() => http.get("/projects"), []);

  return getTeams;
}
```

Examples of **correct** code for this rule:

`src/hooks/useTeams.ts`

```ts
export type Team = {
  id: string;
  name: string;
  icon: string;
  organizationId?: string;
};

type DependencyArray = object[];

function useTeam() {
  const { Api } = useApi();

  const getTeams = (fetchState: DependencyArray = []) => {
    const { data, loading, error, fetch } = Api(
      () => http.get("/projects"),
      [...fetchState]
    );

    return { teams: data, loading, error, fetch };
  };

  return { getTeams, getTeamById, createTeam, updateTeam, deleteTeam };
}

export default useTeam;
```

---

### `data/mutations-swallow-and-return-null`

**Severity: `warn`**

Mutations are `async`, wrap the request in `try/catch`, publish on success, and
return `response?.data` or `null` on failure. Callers branch on the return value.

Rationale: this is the established contract in `useAgents`, `useTeams` and
`useOrganizations`. A mutation that throws instead crashes the widget that called
it, because no widget wraps mutation calls in `try/catch`.

Examples of **incorrect** code for this rule:

```ts
const deleteAgent = async (agentId) => {
  const response = await http.delete(`/agents/${agentId}`);
  return response.data;
};
```

Examples of **correct** code for this rule:

`src/hooks/useAgents.ts`

```ts
const deleteAgent = async (agentId) => {
  try {
    const response = await http.delete(`/agents/${agentId}`);

    if (response) {
      publish("AGENT_DELETED", { agentId });
    }

    return response?.data;
  } catch (error) {
    return null;
  }
};
```

---

### `data/handle-async-states`

**Severity: `warn`**

A widget that consumes a getter renders an explicit state for loading, for empty,
and for `error`. `error` is returned by every getter and is currently unrendered
almost everywhere — new code must not extend that gap.

Rationale: without an error branch a failed request renders as a permanently
empty list, which is indistinguishable from "no data" and produces no signal to
the user or to a test.

Examples of **incorrect** code for this rule:

```tsx
function AgentsWidget({ teamId }) {
  const { agents } = useAgents().getTeamAgents();

  return agents.map((agent) => <AgentCard key={agent.id} agent={agent} />);
}
```

Examples of **correct** code for this rule:

```tsx
function AgentsWidget({ teamId }) {
  const { getTeamAgents } = useAgents();
  const { agents, loading, error } = getTeamAgents();
  const isLoading = useLoading(loading);

  if (isLoading) {
    return <AgentsSkeleton />;
  }

  if (error) {
    return <Typography color="error.main">{error}</Typography>;
  }

  if (!agents?.length) {
    return <AddNewButton addNew={"Agent"} onClickFunction={onCreate} />;
  }

  return agents.map((agent) => <AgentCard key={agent.id} agent={agent} />);
}
```

Loading placeholders come from `src/components/Skeletons/` and are named after
the screen they replace: `AgentsSkeleton`, `KnowledgeBaseSkeleton`,
`SupervisingSkeleton`. There is no shared error component yet — until one exists,
render the message inline as above rather than dropping the branch.

---

### `data/use-loading-for-refetch`

**Severity: `warn`**

In a widget, pass `loading` through `useLoading(loading)` before rendering a
skeleton. Use the raw `loading` only on a page's first paint.

Rationale: getters refetch whenever a subscribed event fires. Rendering the raw
`loading` flag replaces already-visible content with a skeleton on every
publish, so the screen flashes after every create, edit and delete.
`useLoading` returns `true` only until the first successful load.

Examples of **incorrect** code for this rule:

```tsx
function TasksWidget({ agentId }) {
  const { tasks, loading } = useTasks().getAgentTasks(agentId);

  if (loading) {
    return <TeamSkeleton />;
  }

  return <TaskList tasks={tasks} />;
}
```

Examples of **correct** code for this rule:

`src/widgets/AgentsWidget/AgentsWidget.tsx`

```tsx
function AgentsWidget({ teamId }) {
  const { getTeamAgents } = useAgents();
  const { agents, loading } = getTeamAgents();

  const isLoading = useLoading(loading);

  return isLoading
    ? Array.from({ length: 2 }).map((_, index) => <AgentsSkeleton key={index} />)
    : agents.map((agent) => <AgentCard key={agent.id} agent={agent} />);
}
```

---

## 5. Events

`@nucleoidai/react-event` is the cache-invalidation mechanism. A mutation
publishes; the getters that list the same resource subscribe and refetch. There
is no other cache layer.

### `event/naming`

**Severity: `error`**

Event names are `SCREAMING_SNAKE_CASE`, domain noun first, past-tense verb last:
`AGENT_ADDED`, `KNOWLEDGE_STATUS_CHANGED`, `TEAM_DELETED`, `AGENTS_LOADED`.
Plural noun + `_LOADED` announces a list; singular noun + verb announces a
mutation.

Rationale: Cypress specs wait on these names (`cy.waitEvent("AGENT_ADDED")`), so
a name is a public contract shared by the hook, the subscribers, and the test.

Examples of **incorrect** code for this rule:

```ts
publish("agentCreate", { agentId: response.data.id });
publish("REFRESH_AGENTS", {});
publish("ON_AGENT_ADD", { agentId: response.data.id });
```

Examples of **correct** code for this rule:

`src/hooks/useAgents.ts`

```ts
publish("AGENT_ADDED", { agentId: response.data.id });
publish("AGENT_DELETED", { agentId });
publish("AGENTS_LOADED", { agents: data });
```

Payloads are objects keyed by the domain noun or its id — never a bare value.

---

### `event/publish-after-mutation`

**Severity: `error`**

Every create, update and delete publishes its domain event, guarded on a truthy
response, before returning.

Rationale: this is the only refetch trigger. A mutation that does not publish
leaves every list on screen showing stale data until a full reload.

Examples of **incorrect** code for this rule:

```ts
const createAgent = async (agent, teamId) => {
  const response = await http.post(`/agents`, { ...agent, teamId });
  return response?.data;
};
```

Examples of **correct** code for this rule:

`src/hooks/useAgents.ts`

```ts
const createAgent = async (agent, teamId) => {
  try {
    agent.teamId = teamId || storage.get("projectId");

    const response = await http.post(`/agents`, {
      name: agent.name,
      icon: agent.icon,
      teamId: agent.teamId,
      aiEngineId: agent.aiEngineId,
      description: agent.description,
    });

    if (response && response.data) {
      publish("AGENT_ADDED", { agentId: response.data.id });
    }

    return response?.data;
  } catch (error) {
    return null;
  }
};
```

---

### `event/subscribe-as-fetch-dependency`

**Severity: `error`**

A hook subscribes with `useEvent` at the top of the hook body, collects the
subscriptions into a local `eventDependencies` array, and spreads that array into
the `Api` dependency list ahead of `...fetchState`.

Rationale: the dependency array is the wiring between publish and refetch. The
named `eventDependencies` local is what makes the invalidation set reviewable.

Examples of **incorrect** code for this rule:

```ts
function useAgents() {
  const { Api } = useApi();

  const getTeamAgents = () => {
    const [agentAdded] = useEvent("AGENT_ADDED", null);
    const { data, loading, error, fetch } = Api(() => http.get(`/agents`), []);

    return { agents: data, loading, error, fetch };
  };

  return { getTeamAgents };
}
```

Examples of **correct** code for this rule:

`src/hooks/useAgents.ts`

```ts
function useAgents() {
  const { Api } = useApi();

  const [agentUpdated] = useEvent("AGENT_UPDATED", null);
  const [agentDeleted] = useEvent("AGENT_DELETED", null);
  const [agentAdded] = useEvent("AGENT_ADDED", null);
  const [teamSelected] = useEvent("PROJECT_SELECTED", { projectId: null });

  const getTeamAgents = (fetchState: DependencyArray = []) => {
    const eventDependencies = [
      agentUpdated,
      agentDeleted,
      agentAdded,
      teamSelected,
    ];

    const { data, loading, error, fetch } = Api(
      () => http.get(`/agents`),
      [...eventDependencies, ...fetchState]
    );

    if (data) {
      publish("AGENTS_LOADED", { agents: data });
    }

    return { agents: data, loading, error, fetch };
  };

  return { getTeamAgents };
}
```

Every `useEvent` call needs a default value — `null`, or a shaped object such as
`{ projectId: null }` — so the first render has a defined dependency.

---

### `event/namespace-cross-app`

**Severity: `warn`**

Events owned by the host platform rather than by this dashboard use the two-
argument form: `publish("PLATFORM", "PROJECT_BAR_DIALOG", { open: false })`,
`useEvent("BLUEPRINT", "GENERATING", …)`. Dashboard-local domain events use the
one-argument form.

Rationale: the namespace marks which side of the `@canmingir/link` boundary owns
the name, so renaming a local event stays a local change.

Examples of **incorrect** code for this rule:

```tsx
const [platformDialog] = useEvent("PROJECT_BAR_DIALOG", { open: false });
publish("PROJECT_BAR_DIALOG", { open: false });
```

Examples of **correct** code for this rule:

`src/Container.tsx`

```tsx
function Container() {
  const { organizations } = useOrganizations().getOrganizations();
  const [platformDialog] = useEvent("PLATFORM", "PROJECT_BAR_DIALOG", {
    open: false,
  });

  return (
    <TeamWizard
      open={platformDialog.open}
      onClose={() => {
        if (organizations.length > 0) {
          publish("PLATFORM", "PROJECT_BAR_DIALOG", { open: false });
        }
      }}
    />
  );
}
```

---

## 6. Component authoring

### `component/named-function-default-export`

**Severity: `warn`**

Declare the component as a named `function`, export it as the default at the
bottom of the file. Do not use `React.FC`.

Rationale: the `function` form is the majority — 109 of the 206 `.tsx` files
declare their component that way against 85 using an arrow const, and 174 files
close with a bare `export default X;`. The named declaration is what appears in
React DevTools and in error boundaries. `React.FC` appears exactly once and
should not spread.

Examples of **incorrect** code for this rule:

```tsx
const AgentCard: React.FC<Props> = ({ agent }) => {
  return <Card>{agent.name}</Card>;
};

export default AgentCard;
```

Examples of **correct** code for this rule:

`src/components/Page/Page.tsx`

```tsx
function Page({ name, links, children }) {
  return (
    <Stack margin={2}>
      <PageHelmet name={name} links={links} />
      {children}
    </Stack>
  );
}

export default Page;
```

`export default function AgentCard(…)` is also present in the codebase and is
acceptable; `React.FC` is not.

---

### `component/folder-and-barrel`

**Severity: `warn`**

A component lives in a folder named after it, containing
`ComponentName.tsx`, an optional `styles.ts`, and an `index.ts` barrel that
re-exports the default. Importers use the folder path.

Rationale: the barrel is what allows `styles.ts` and sub-components to be added
later without touching every import site.

Examples of **incorrect** code for this rule:

```tsx
import AgentCard from "../../components/AgentCard/AgentCard";
import styles from "../../components/AgentCard/styles";
```

Examples of **correct** code for this rule:

`src/components/AddNewButton/index.ts`

```ts
export { default } from "./AddNewButton";
```

`src/widgets/AgentsWidget/AgentsWidget.tsx`

```tsx
import AddNewButton from "../../components/AddNewButton";
import AgentCard from "../../components/AgentCard";
import ConfirmationDialog from "../../components/ConfirmationDialog";
```

Sub-components that are only meaningful inside one feature stay in that feature's
folder (`src/widgets/TeamChatWidget/components/`, `src/components/BlueprintFlow/Validation/`)
and do not get their own barrel.

---

### `component/inline-prop-types`

**Severity: `warn`**

Type props inline in the parameter position. Do not declare a separate `Props`
interface for a single-use component, and do not rely on `prop-types`
(`react/prop-types` is disabled).

Rationale: the props list and its types stay adjacent, which is the dominant
shape across `components/`, `layouts/` and `widgets/`.

Examples of **incorrect** code for this rule:

```tsx
interface KnowledgeProps {
  agentId?: string;
  teamId?: string;
}

function Knowledge(props: KnowledgeProps) {
  return <KnowledgeTable agentId={props.agentId} />;
}
```

Examples of **correct** code for this rule:

`src/widgets/Knowledge/Knowledge.tsx`

```tsx
function Knowledge({
  agentId,
  teamId,
  blueprintId,
  onItemAdded,
}: {
  agentId?: string;
  teamId?: string;
  blueprintId?: string;
  onItemAdded?: () => void;
}) {
  return <KnowledgeTable agentId={agentId} teamId={teamId} />;
}
```

Domain shapes that cross module boundaries — `Team`, `Knowledge`,
`KnowledgeInput` — are named types exported from the hook that owns them.

---

### `component/styles-module`

**Severity: `warn`**

Reusable `sx` objects go in a sibling `styles.ts` that default-exports a single
plain object keyed by element role. Keep one-off layout `sx` inline.

Rationale: the object form keeps variant lookups (`styles[type]`) possible and
keeps the component body readable.

Examples of **incorrect** code for this rule:

```ts
export const cardStyle = { position: "relative", minWidth: 290 };
export const avatarStyle = { width: 60, height: 60 };
```

Examples of **correct** code for this rule:

`src/components/AddNewButton/styles.ts`

```ts
const styles = {
  largeButton: {
    height: "100%",
    minWidth: "15rem",
    borderRadius: "20px",
  },
  wideButton: {
    height: "100%",
    minHeight: "20rem",
    width: "255px",
  },
  default: {
    cursor: "pointer",
    border: "1px solid",
    borderColor: "rgba(22, 28, 36, 0.5)",
    backgroundColor: "background.paper",
    color: "text.secondary",
  },
};

export default styles;
```

---

### `component/theme-tokens`

**Severity: `warn`**

Colours reference theme tokens — `background.paper`, `text.secondary`,
`error.main`, `divider` — or come from `useTheme()` via
`theme.palette.grey[500]` and `alpha(...)`. Do not hardcode hex values for
palette colours.

Rationale: the theme is supplied by `<Platform>` from `@canmingir/link` in
`src/index.tsx` and augmented in `src/types/theme.d.ts`, which adds
`background.neutral`, `customShadows.card` and the `profile-card` Card/Paper
variants. `config.template.js` shows the knobs a deployment can turn — `mode`,
`colorPresets`, component variants. A hardcoded hex ignores all of it.

Examples of **incorrect** code for this rule:

```tsx
<Typography sx={{ color: "#919EAB" }}>{agent.description}</Typography>
<Box sx={{ backgroundColor: "#161C24" }} />
```

Examples of **correct** code for this rule:

`src/components/AgentCard/AgentCard.tsx`

```tsx
const theme = useTheme();

<IconButton
  sx={{
    color: "common.white",
    bgcolor: alpha(theme.palette.grey[900], 0.3),
    "&:hover": { bgcolor: alpha(theme.palette.grey[900], 0.5) },
  }}
/>

<MenuItem sx={{ color: "error.main" }}>Delete</MenuItem>
```

Gradients for agent and team avatars come from `src/utils/gradient.ts`
(`getAgentGradients(id, theme, allIds)`), not from literal CSS.

---

## 7. Imports and configuration

### `import/sort-order`

**Severity: `warn` — automated (`sort-imports`)**

`.eslintrc.json` sets
`memberSyntaxSortOrder: ["none", "single", "multiple", "all"]`. Single-member
imports come first in a case-sensitive alphabetical block, then multi-member
imports, also sorted, with members inside the braces sorted too. The codebase
separates the two blocks with a blank line.

Rationale: enforced by `npm run lint`, which runs with `--max-warnings 0`.

Examples of **incorrect** code for this rule:

```tsx
import React, { useState } from "react";
import { Box, Grid } from "@mui/material";
import AgentCard from "../../components/AgentCard";
import useAgents from "../../hooks/useAgents";
import { useNavigate } from "react-router-dom";
```

Examples of **correct** code for this rule:

`src/widgets/AgentsWidget/AgentsWidget.tsx`

```tsx
import AddNewButton from "../../components/AddNewButton";
import AgentCard from "../../components/AgentCard";
import Box from "@mui/material/Box";
import { Grid } from "@mui/material";
import { publish } from "@nucleoidai/react-event";
import useAgent from "../../hooks/useAgent";
import useAgents from "../../hooks/useAgents";
import { useNavigate } from "react-router-dom";

import React, { useState } from "react";
```

A consequence worth knowing: import a single MUI component from its own path
(`@mui/material/Box`) to keep it in the single-member block, and import several
from the package root (`{ Box, Grid, Typography }`) in the multi-member block.

---

### `import/no-mui-loading-button`

**Severity: `warn` — automated (`no-restricted-imports`)**

`@mui/lab/LoadingButton` is banned. Use `LinkLoadingButton`. The ban is lifted
only inside `**/LinkLoadingButton/**` and `LinkLoadingButton.tsx`.

Examples of **incorrect** code for this rule:

```tsx
import LoadingButton from "@mui/lab/LoadingButton";

<LoadingButton loading={submitting} onClick={onSubmit}>Save</LoadingButton>;
```

Examples of **correct** code for this rule:

```tsx
import LinkLoadingButton from "../../components/LinkLoadingButton";

<LinkLoadingButton loading={submitting} onClick={onSubmit}>Save</LinkLoadingButton>;
```

---

### `import/config-for-hosts`

**Severity: `error`**

Hosts, socket paths, feature flags and identity-provider settings come from
`config` (`import config from "../../config"`). Never inline a URL, and never
branch on `window.location` outside `config.js`.

Rationale: `config.js`, `config.live.js` and `config.land.js` are per-deployment
variants of the same shape, and they disagree on exactly these values —
`config.js` derives `api` and `socket.host` from `window.location.origin`,
`config.live.js` sets `api: ""` and swaps the GitHub identity provider for
Google. An inlined host ignores whichever variant is in play and points the
built bundle at the wrong backend.

Examples of **incorrect** code for this rule:

```ts
const socket = io("http://localhost:3003", { path: "/socket.io" });
const showApiTab = window.location.hostname !== "greycollar.ai";
```

Examples of **correct** code for this rule:

`src/hooks/useSession.ts`

```ts
import config from "../../config";

const { host, path } = config.socket;
const token = storage.get("link", "accessToken");

socketRef.current = io(host, { path, auth: { token }, query: { agentId } });
```

`src/layouts/AgentLayout.tsx`

```tsx
const { beta } = config;

const visibleTabs = useMemo(
  () => TABS.filter((tab) => !beta || tab.value !== "api"),
  [beta]
);
```

---

### `import/storage-over-local-storage`

**Severity: `warn`**

Read and write session-scoped values through `storage` from
`@nucleoidjs/webstorage`. Use the two-argument form
(`storage.get("link", "accessToken")`) for values owned by the platform.

Rationale: `storage` is the same accessor the platform writes through, and it
carries the namespace. Raw `localStorage.getItem("projectId")` reads a key the
platform may namespace differently, and returns a raw string instead of the
parsed value.

Examples of **incorrect** code for this rule:

`src/widgets/OrganizationChart/common/standard-node.tsx`

```tsx
const projectId = localStorage.getItem("projectId");
```

Examples of **correct** code for this rule:

`src/pages/knowledgeBase.tsx`

```tsx
import { storage } from "@nucleoidjs/webstorage";

const teamId = storage.get("projectId");
```

`src/http/user.ts`

```ts
const refreshToken = await storage.get("link", "refreshToken");
const identityProvider = await storage.get("link", "identityProvider");
```

Raw `localStorage` is acceptable for purely local UI preferences that the
platform never sees, such as the connection-overlay toggle in
`BlueprintDrawer.tsx`, provided the key is a module-level constant.

---

## 8. Testing

### `test/data-cy-on-interactive`

**Severity: `error`**

Every element a user clicks, types into, or asserts on carries a `data-cy`
attribute. Names are kebab-case and scoped by component:
`agent-card`, `agent-card-menu-edit`, `agent-wizard-name-input`,
`add-new-button`.

Rationale: `cypress/support/commands.ts` selects exclusively through
`cy.getBySel`. An interactive element without `data-cy` is untestable.

Examples of **incorrect** code for this rule:

```tsx
<IconButton onClick={popover.onOpen}>
  <Iconify icon="eva:more-vertical-fill" />
</IconButton>
```

Examples of **correct** code for this rule:

`src/components/AgentCard/AgentCard.tsx`

```tsx
<Box onClick={onView} data-cy="agent-card">
  <Typography variant="subtitle1" data-cy="agent-card-name">
    {agent.name}
  </Typography>
</Box>

<MenuItem data-cy="agent-card-menu-edit" onClick={onEdit}>
  Edit
</MenuItem>
```

---

### `test/select-by-data-cy`

**Severity: `error`**

Specs select with `cy.getBySel("…")`. Never select by CSS class, MUI-generated
class name, tag structure, or visible text.

Rationale: class names and copy change without behaviour changing; `data-cy` is
the only stable contract between the component and the spec.

Examples of **incorrect** code for this rule:

```ts
cy.get(".MuiCard-root").eq(1).click();
cy.contains("Edit").click();
```

Examples of **correct** code for this rule:

`cypress/e2e/agents.cy.ts`

```ts
cy.getBySel("agent-card-more-vert").eq(1).first().click();
cy.getBySel("agent-card-menu-edit").click();
cy.getBySel("agent-card").should("have.length", 3);
```

---

### `test/await-domain-events`

**Severity: `warn`**

Synchronise on the domain event with `cy.waitEvent("AGENT_ADDED")` rather than on
a fixed `cy.wait(ms)`.

Rationale: the publish is what triggers the refetch, so the event is the exact
moment the UI becomes consistent. A timeout either flakes or wastes time.

Examples of **incorrect** code for this rule:

```ts
cy.getBySel("agent-finish-button").click();
cy.wait(2000);
cy.getBySel("agent-card").should("have.length", 3);
```

Examples of **correct** code for this rule:

`cypress/e2e/agents.cy.ts`

```ts
cy.getBySel("add-new-button").click();
cy.waitEvent("AGENT_WIZARD_OPENED");

cy.createAgentViaDialog(this.createdAgent, this.newAgents);
cy.waitEvent("AGENT_ADDED");

cy.getBySel("agent-card").should("have.length", 3);
```

This is the second reason `event/naming` is an `error`-level rule: renaming an
event breaks specs that never import it.

---

## 9. Forms and dialogs

### `form/rhf-with-yup-resolver`

**Severity: `error`**

Forms use `react-hook-form` with a Yup schema through `yupResolver`, rendered
with `FormProvider` and `RHFTextField` from
`@canmingir/link/platform/components`, and validated with `mode: "onChange"`.
Do not hand-roll field state or validation.

Rationale: `FormProvider`/`RHFTextField` read the form context to wire values,
errors and helper text. A raw MUI `TextField` inside a `FormProvider` renders but
never registers, so it validates as empty and submits nothing.

Examples of **incorrect** code for this rule:

```tsx
function AddItemDialog({ addItem }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const onSubmit = () => {
    if (!url.startsWith("http")) {
      setError("Enter a valid URL");
      return;
    }
    addItem({ type: "URL", url });
  };

  return <TextField value={url} onChange={(e) => setUrl(e.target.value)} />;
}
```

Examples of **correct** code for this rule:

`src/components/AddItemDialog/AddItemDialog.tsx`

```tsx
const AddItemSchema = Yup.object().shape({
  inputValue:
    currentType === "URL"
      ? Yup.string()
          .required("URL cannot be an empty field")
          .url("Enter a valid URL")
      : Yup.string(),
});

const resolver: Resolver<FormValues> = yupResolver(
  AddItemSchema
) as Resolver<FormValues>;

const methods = useForm({
  defaultValues: initialValues,
  resolver,
  mode: "onChange",
});

const onSubmit = handleSubmit(async (data) => {
  await addItem({ type: currentType, url: data.inputValue });
});

return (
  <FormProvider methods={methods} onSubmit={onSubmit}>
    <RHFTextField name="inputValue" label={`Enter ${currentType}`} data-cy="add-item-input" />
  </FormProvider>
);
```

Schemas may branch on component state — `AddItemSchema` changes shape with
`currentType`. Recompute the schema in render rather than freezing it at module
level when the fields are conditional.

---

### `form/submit-button-state`

**Severity: `warn`**

The submit control is a `LinkLoadingButton` with `type="submit"`,
`loading={isSubmitting}` and `disabled={!isValid || isSubmitting}`, where
`isValid` comes from `formState` and `isSubmitting` is local state set around the
await.

Rationale: `mode: "onChange"` keeps `isValid` live, so the button is the
validation feedback. Without the disable, a double click fires the mutation twice
and publishes the domain event twice.

Examples of **incorrect** code for this rule:

```tsx
<Button type="submit" onClick={onSubmit}>
  Save
</Button>
```

Examples of **correct** code for this rule:

`src/components/AddItemDialog/AddItemDialog.tsx`

```tsx
const {
  reset,
  handleSubmit,
  formState: { isValid },
} = methods;

<LinkLoadingButton
  type="submit"
  loading={isSubmitting}
  disabled={!isValid || isSubmitting}
  data-cy="finish"
>
  Save
</LinkLoadingButton>;
```

---

### `form/reset-after-submit`

**Severity: `warn`**

Call `reset()` in the `finally` of the submit handler, and again whenever the
form's shape changes underneath it — a type switch, a step change.

Rationale: dialogs are mounted once and reopened. Without `reset()` the second
open shows the previous submission's values, and a type switch leaves the old
field registered against the new schema, so `isValid` stays false with no visible
error.

Examples of **incorrect** code for this rule:

```tsx
const onSubmit = handleSubmit(async (data) => {
  await addItem(data);
  setOpen(false);
});

const handleChangeType = (event) => setCurrentType(event.target.value);
```

Examples of **correct** code for this rule:

`src/components/AddItemDialog/AddItemDialog.tsx`

```tsx
const onSubmit = handleSubmit(async (data) => {
  setIsSubmitting(true);

  try {
    await addItem(payload, payload.agentId, payload.teamId, payload.blueprintId);
    setOpen(false);
  } catch (error) {
    setOpen(false);
  } finally {
    setIsSubmitting(false);
    reset();
  }
});

const handleChangeType = (event) => {
  setCurrentType(event.target.value);
  reset();
};
```

---

### `dialog/callback-props-not-setters`

**Severity: `error`**

A dialog receives `open` plus intent callbacks — `onClose`, `onConfirm`,
`onSubmit`. It must not receive the parent's `useState` setter.

Rationale: a setter prop hands the child write access to the parent's state, so
the parent can no longer run anything on close. `AgentsWidget` needs to clear
`updatedAgent` when its wizard closes; it can only do that because the wizard
takes `onClose`. The setter-passing variants in the tree — `DeleteConfirmation`,
`AddItemDialog`, `FlowDialog` — cannot support that without a prop change.

Examples of **incorrect** code for this rule:

`src/components/DeleteConfirmation/DeleteConfirmation.tsx`

```tsx
function DeleteConfirmation({
  openDeleteDialog,
  setOpenDeleteDialog,
  selectedItem,
  handleDelete,
}) {
  return (
    <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
      <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
    </Dialog>
  );
}
```

Examples of **correct** code for this rule:

`src/components/ConfirmationDialog/ConfirmationDialog.tsx`

```tsx
const ConfirmationDialog = ({ open, onClose, onConfirm, title, content }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      <DialogContentText>{content}</DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button data-cy="confirm" onClick={onConfirm} variant="contained">
        Confirm
      </Button>
      <Button onClick={onClose}>Cancel</Button>
    </DialogActions>
  </Dialog>
);
```

The widget keeps ownership of both the flag and the cleanup:

`src/widgets/AgentsWidget/AgentsWidget.tsx`

```tsx
<AgentWizard
  open={formOpen}
  onClose={() => {
    setFormOpen(false);
    setUpdatedAgent(null);
  }}
/>
```

`ConfirmationDialog` is the shape to copy. Prefer it over `DeleteConfirmation`
for new confirmations rather than adding a third variant.

---

### `dialog/guard-close-while-submitting`

**Severity: `warn`**

While a submit is in flight, backdrop and escape closes are ignored.

Rationale: closing mid-submit unmounts the dialog while its `finally` still holds
a `setIsSubmitting` call, and the user gets no signal about whether the mutation
landed.

Examples of **incorrect** code for this rule:

```tsx
<Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
```

Examples of **correct** code for this rule:

`src/components/AddItemDialog/AddItemDialog.tsx`

```tsx
<Dialog
  open={open}
  onClose={() => {
    if (!isSubmitting) {
      setOpen(false);
    }
  }}
  fullWidth
  maxWidth="sm"
>
```

---

### `dialog/stacked-z-index`

**Severity: `warn`**

A dialog opened from inside another dialog sets
`zIndex: (theme) => theme.zIndex.modal + 3`. A `Select` menu inside such a dialog
sets `MenuProps.sx.zIndex` to `theme.zIndex.modal + 4`.

Rationale: MUI gives every modal the same base `zIndex`, so a nested dialog ties
with its parent and renders behind it depending on mount order. The `+3` / `+4`
offsets are the established ladder; a menu must clear the dialog that contains
it or it opens underneath.

Examples of **incorrect** code for this rule:

```tsx
<Dialog open={open} sx={{ zIndex: 2000 }}>
  <Select value={type} onChange={onChange}>
    {types.map((type) => (
      <MenuItem key={type} value={type}>{type}</MenuItem>
    ))}
  </Select>
</Dialog>
```

Examples of **correct** code for this rule:

`src/components/AddItemDialog/AddItemDialog.tsx`

```tsx
<Dialog open={open} sx={{ zIndex: (theme) => theme.zIndex.modal + 3 }}>
  <Select
    value={currentType}
    onChange={handleChangeType}
    data-cy="add-item-select"
    MenuProps={{ sx: { zIndex: (theme) => theme.zIndex.modal + 4 } }}
  >
    {types.map((type) => (
      <MenuItem data-cy={`add-type-menu-${type}`} key={type} value={type}>
        {type}
      </MenuItem>
    ))}
  </Select>
</Dialog>
```

---

## 10. Effects and lifecycle

### `effect/clear-timers`

**Severity: `error`**

Every `setInterval` and `setTimeout` started in an effect is cleared in that
effect's cleanup. A timer started outside React clears itself on its own exit
condition.

Rationale: this codebase polls. `useChat` refreshes messages every 2s and
`TasksWidget` polls task steps every 2s. An uncleared interval keeps firing after
unmount, calling `setState` on a dead component and holding the whole closure —
including the fetched message list — alive.

Examples of **incorrect** code for this rule:

```tsx
useEffect(() => {
  setInterval(() => {
    getSteps(selectedTask.id);
  }, 2000);
}, [selectedTask?.id]);
```

Examples of **correct** code for this rule:

`src/widgets/TasksWidget/TasksWidget.tsx`

```tsx
useEffect(() => {
  const interval = setInterval(() => {
    getSteps(selectedTask.id);
  }, 2000);

  return () => clearInterval(interval);
}, [selectedTask?.id]);
```

`src/hooks/useChat.ts`

```ts
intervalId.current = setInterval(fetchMessages, 2000);

return () => {
  if (intervalId.current) clearInterval(intervalId.current);
};
```

A poll that lives outside a component, like the knowledge-status watcher in
`chat.config.ts`, must clear itself when its terminal status arrives:

```ts
const intervalId = setInterval(async () => {
  const { data: knowledge } = await http.get(`/knowledge`);

  if (knowledge.status === "COMPLETED") {
    clearInterval(intervalId);
    publish("KNOWLEDGE_STATUS_CHANGED", { ...knowledge });
  }
}, 2000);
```

---

### `effect/unregister-socket-handlers`

**Severity: `error`**

An effect that opens a socket returns a cleanup that calls `socket.off` for every
`socket.on` it registered, then `socket.disconnect()`. Code that replaces a live
socket tears the old one down the same way before creating the new one.

Rationale: `io()` reuses connections. Registering `ai_message` twice appends
every AI reply to the conversation twice. Disconnecting without `off` leaves the
handlers attached to a manager that may reconnect.

Examples of **incorrect** code for this rule:

```ts
useEffect(() => {
  const socket = io(host, { path, auth: { token } });

  socket.on("ai_message", ({ content }) => {
    setConversations((prev) => [...prev, { role: "AI", content }]);
  });

  return () => socket.disconnect();
}, []);
```

Examples of **correct** code for this rule:

`src/hooks/useSession.ts`

```ts
const socket = socketRef.current;

socket.on("connect", () => console.log("Connected to socket server"));
socket.on("session_started", ({ sessionId: id }) => setSessionId(id));
socket.on("ai_message", ({ content }) => {
  setConversations((prev) => [...prev, { role: "AI", content }]);
  publish("AI_RESPONDED", { content });
});
socket.on("error_message", ({ message }) => {
  setError(message);
  publish("AI_ERROR", { message });
});

return () => {
  socket.off("connect");
  socket.off("session_started");
  socket.off("ai_message");
  socket.off("error_message");
  socket.disconnect();
};
```

The same teardown runs at the top of `createSession` before a replacement socket
is opened. Socket payloads that other parts of the UI care about are re-published
onto the event bus — `AI_RESPONDED`, `AI_ERROR` — rather than lifted through
props.

---

### `effect/scoped-deps-disable`

**Severity: `warn`**

`react-hooks/exhaustive-deps` may be suppressed only where the dependency array
is deliberately not the full closure: a mount-only socket or timer setup, or a
dependency list assembled from `eventDependencies` and `fetchState`. Suppress on
the single line, never for a file, and never to silence a stale-closure bug.

Rationale: `plugin:react-hooks/recommended` is on and `lint` runs with
`--max-warnings 0`, so the suppression is a deliberate, reviewable act. The
legitimate cases are narrow and already established — `useApi`, `useSocket`,
`useSession`, `AgentLayout`.

Examples of **incorrect** code for this rule:

```tsx
function TasksWidget({ agentId }) {
  const [steps, setSteps] = useState([]);

  useEffect(() => {
    setSteps(computeSteps(agentId, filter));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
```

Examples of **correct** code for this rule:

`src/hooks/useApi.ts`

```ts
useEffect(() => {
  fetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, dependencies);
```

`src/hooks/useSocket.ts`

```ts
useEffect(() => {
  socketRef.current = io(config.api, { auth: { token } });

  return () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

`useApi` is the load-bearing case: `dependencies` is a runtime array the caller
composes, so the rule cannot see it.

---

## 11. TypeScript

### `ts/explicit-types-under-non-strict`

**Severity: `error`**

`tsconfig.json` sets `strict: false` and `noImplicitAny: false`. Because the
compiler will not infer or complain, props and exported domain shapes must be
typed by hand.

Rationale: with `noImplicitAny` off, an untyped prop is `any`, and `any` flows
through the whole render silently. The prop annotation is the only contract a
reviewer or an editor has. `typecheck` runs in CI, so annotations that are
present are checked — the risk is the ones that are missing.

Examples of **incorrect** code for this rule:

```tsx
function AgentCard({ agent, onView, allAgentIds }) {
  return <Card onClick={onView}>{agent.nmae}</Card>;
}
```

The typo in `agent.nmae` compiles and renders empty.

Examples of **correct** code for this rule:

`src/components/AgentCard/AgentCard.tsx`

```tsx
export default function AgentCard({
  agent,
  onView,
  allAgentIds,
}: {
  agent: {
    id: string;
    name: string;
    description: string;
    icon?: string;
    createdAt: string;
    AIEngine?: { vendor: string; model: string };
  };
  onView: () => void;
  allAgentIds?: string[];
}) {
  return <Card onClick={onView}>{agent.name}</Card>;
}
```

Shapes shared across modules are named types exported from the hook that owns the
resource — `Team`, `TeamInput` in `useTeams.ts`, `Knowledge`, `KnowledgeInput` in
`useKnowledge.ts`. Local helper shapes stay local, as
`ValidationError` and `ValidationResult` do in `BlueprintFlow/Validation/validation.ts`.

---

### `ts/relative-imports`

**Severity: `warn`**

Import with relative paths. Do not use the `@/*` alias.

Rationale: `tsconfig.json` declares `paths: { "@/*": ["src/*"] }`, but no file in
`src` uses it and the Vite config is produced by `@canmingir/link/vite`, which
this repo extends only to add proxies — it never registers a matching
`resolve.alias`. An `@/` import would satisfy `typecheck` and then fail to
resolve at build time.

Examples of **incorrect** code for this rule:

```tsx
import useAgents from "@/hooks/useAgents";
import AgentCard from "@/components/AgentCard";
```

Examples of **correct** code for this rule:

`src/widgets/AgentsWidget/AgentsWidget.tsx`

```tsx
import AgentCard from "../../components/AgentCard";
import useAgents from "../../hooks/useAgents";
```

`config` is reached the same way, from outside `src`: `import config from "../../config"`.

---

## 12. Presentation primitives

### `ui/platform-table-primitives`

**Severity: `warn`**

Tables are built from the platform primitives — `useTable`, `TableHeadCustom`,
`TableSelectedAction`, `Scrollbar`, `Label` — with the `table` object created in
the widget and passed to the presentational table component.

Rationale: `useTable` owns selection, ordering and pagination state. Creating it
in the widget keeps `layer/no-data-access-in-components` intact while the table
component stays presentational, and the shared head/selection components keep
sort and bulk-select behaviour identical across screens.

Examples of **incorrect** code for this rule:

```tsx
function KnowledgeTable({ knowledges }) {
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(0);

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Type</TableCell>
        </TableRow>
      </TableHead>
    </Table>
  );
}
```

Examples of **correct** code for this rule:

`src/widgets/Knowledge/Knowledge.tsx`

```tsx
const table = useTable();

<KnowledgeTable
  table={table}
  selectedType={selectedType}
  knowledges={filteredKnowledges}
  handleDeleteClick={handleDeleteClick}
/>;
```

`src/components/KnowledgeTable/KnowledgeTable.tsx`

```tsx
function KnowledgeTable({ table, selectedType, knowledges, handleDeleteClick }) {
  const getTableHead = (selectedType) => {
    switch (selectedType) {
      case "URL":
        return [
          { id: "url", label: "URL" },
          { id: "status", label: "Status" },
          { id: "date", label: "Date" },
          { id: "", label: "" },
        ];
    }
  };

  return (
    <Card sx={{ borderRadius: 0.5 }}>
      <TableContainer>
        <TableSelectedAction dense={table.dense} />
        <Scrollbar>
          <Table>
            <TableHeadCustom
              order={table.order}
              orderBy={table.orderBy}
              headLabel={getTableHead(selectedType)}
            />
            <TableBody>
              {knowledges
                .slice((page - 1) * rowsPerPage, page * rowsPerPage)
                .map((row, index) => (
                  <TableRow hover key={index} tabIndex={-1}>
                    <TableCell>{row.type}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>
    </Card>
  );
}
```

Column sets are chosen by a `switch` on the active type inside the table
component. A trailing `{ id: "", label: "" }` reserves the actions column.

---

### `ui/format-dates-with-helpers`

**Severity: `warn`**

Format dates through `src/utils/formatTime.ts` and its `formatStr` presets. Do
not call `toLocaleDateString`, `toLocaleString`, or `dayjs` directly in a
component.

Rationale: `formatTime` extends dayjs with the `duration` and `relativeTime`
plugins once at module load and fixes the presets — `DD MMM YYYY h:mm a` and
friends. `toLocaleDateString` renders per the visitor's locale, so the same list
shows `17/04/2022` for one user and `4/17/2022` for another, and no Cypress
assertion on a date string can hold.

Examples of **incorrect** code for this rule:

`src/components/KnowledgeTable/KnowledgeTable.tsx`

```tsx
<TableCell>{new Date(row.createdAt).toLocaleDateString()}</TableCell>
```

Examples of **correct** code for this rule:

`src/widgets/TeamChatWidget/components/TeamChatMessageItem.tsx`

```tsx
import { fDateTime } from "../../../utils/formatTime";

<Typography variant="caption">
  {fDateTime(message.createdAt, "MMM DD, YYYY")}
</Typography>;
```

The module exports `fDate`, `fTime`, `fDateTime`, `today` and `now`, plus a
`formatStr` map of the house presets (`dateTime`, `date`, `time`, and `split` /
`paramCase` variants). Prefer a `formatStr` preset over a literal pattern when
one matches.

Sorting still uses raw timestamps — `new Date(a.createdAt).getTime()` in
`useChat` is comparison, not display, and is correct.

---

### `ui/iconify-and-clean-names`

**Severity: `warn`**

Icons render through `<Iconify icon="…" />`. Any icon name that came from the
server or from user input passes through `cleanIconName` first. Do not inline the
trimming regex.

Rationale: stored icon names arrive wrapped in stray colons, and
`cleanIconName` is the single place that strips them. An inline
`replace(/^:|:$/g, "")` is a second copy that will not be updated when the
stored format changes — and it differs from `cleanIconName`, which strips
repeated colons via `/^:+|:+$/g` and returns `""` for a missing icon instead of
throwing.

Examples of **incorrect** code for this rule:

`src/components/AddItemDialog/AddItemDialog.tsx`

```tsx
<Iconify icon={teamById?.icon?.replace(/^:|:$/g, "")} sx={{ width: 40, height: 40 }} />
```

Examples of **correct** code for this rule:

`src/components/AgentCard/AgentCard.tsx`

```tsx
import { cleanIconName } from "../../utils/cleanIconName";

{agent.icon ? (
  <Iconify icon={cleanIconName(agent.icon)} width={32} height={32} />
) : (
  <Avatar sx={{ width: "100%", height: "100%" }} />
)}
```

Icon names that are literals in this codebase — `"solar:pen-bold"`,
`"eva:more-vertical-fill"`, `"ph:flow-arrow"` — are already clean and need no
call. The avatar and team icon sets live in `src/lib/AgentAndTeamAvatars.ts`.

---

### `ui/skeleton-per-screen`

**Severity: `warn`**

Loading placeholders live in `src/components/Skeletons/` and are named after the
screen or card they stand in for: `AgentSkeleton`, `AgentsSkeleton`,
`KnowledgeBaseSkeleton`, `SupervisingSkeleton`, `BlueprintFlowSkeleton`. A new
screen adds its own rather than reusing a mismatched one or dropping in a bare
`<Skeleton />`.

Rationale: the placeholder should occupy the same space as the content it
replaces, otherwise the page reflows on load. Naming them per screen is what
makes the mismatch visible in review.

Examples of **incorrect** code for this rule:

```tsx
function TaskScores() {
  const { scores, loading } = useTaskScores().getScores();

  if (loading) {
    return <AgentsSkeleton />;
  }

  return <TaskScoresWidget scores={scores} />;
}
```

Examples of **correct** code for this rule:

`src/pages/agents.tsx`

```tsx
if (loading) {
  return <AgentsSkeleton />;
}

return (
  <>
    <Page name={"Agent"} />
    <SingleScrollableLayout title={team?.name}>
      <AgentsWidget teamId={teamId} />
    </SingleScrollableLayout>
  </>
);
```

A single inline `<Skeleton variant="rectangular" height={200} />` is acceptable
for one region inside a layout, as `AgentLayout` does for the profile card.

---

## 13. Pure modules and the flow subsystem

### `pure/react-free-modules`

**Severity: `error`**

`src/utils/`, `src/lib/` and `src/constants/` contain pure functions and static
data. They must not import React, call hooks, render JSX, or reach the network.

Rationale: they are imported by every layer including `components/`. A hook call
inside a util would silently impose the Rules of Hooks on every call site. The
directory is currently clean of React — keep it that way.

Examples of **incorrect** code for this rule:

```ts
import { useTheme } from "@mui/material/styles";

export const getAgentGradients = (id, allIds) => {
  const theme = useTheme();
  return `linear-gradient(${theme.palette.primary.main}, transparent)`;
};
```

Examples of **correct** code for this rule:

`src/utils/cleanIconName.ts`

```ts
export const cleanIconName = (icon?: string) => {
  if (!icon) return "";
  return icon.replace(/^:+|:+$/g, "");
};
```

When a util needs the theme, it takes it as an argument — `getAgentGradients(agent.id, theme, allAgentIds)`
in `src/utils/gradient.ts` — and the caller supplies it from `useTheme()`.

---

### `pure/export-style`

**Severity: `warn`**

`utils/` uses named exports, one concern per file, file named after the export.
`constants/` and single-object modules default-export the object.
`lib/` exports named static data.

Rationale: named exports in `utils/` are what let `import { cleanIconName }`
sort into the single-member import block, and they keep the `sort-imports` order
predictable. A default-exported grab-bag of utilities would import as one opaque
name.

Examples of **incorrect** code for this rule:

```ts
const utils = {
  cleanIconName,
  formatKey,
  getAgentGradients,
};

export default utils;
```

Examples of **correct** code for this rule:

`src/utils/formatters.ts`

```ts
export const formatKey = (key) =>
  key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export const parseJsonResult = (result) => {
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

`src/constants/FormItemTypes.ts`

```ts
const FormItemTypes = {
  AutoComplete: "AutoComplete",
  SelectBox: "SelectBox",
  TextField: "TextField",
  CheckBox: "CheckBox",
};

export default FormItemTypes;
```

Parsers return a discriminated result — `{ isJson, parsedResult }` — rather than
throwing, because their callers render the fallback inline.

---

### `flow/adapter-owns-translation`

**Severity: `warn`**

Conversion between the server's blueprint graph and the `@xyflow/react` node and
edge shapes lives in `src/components/BlueprintFlow/flowAdapter.ts`. Layout goes
through `src/utils/flowLayout.ts`. Nodes and widgets consume the converted shape.

Rationale: the server graph nests targets under `item.true` / `item.false` for
`CONDITION` nodes and carries display data under `item.properties`. That
translation is fiddly and edge ids are generated by a counter — a second copy
would produce colliding ids and diverge on the next schema change.

Examples of **incorrect** code for this rule:

```tsx
function BlueprintFlowWidget({ blueprint }) {
  const nodes = blueprint.nodes.map((item) => ({
    id: item.id,
    label: item.properties?.label,
  }));

  const edges = blueprint.nodes.flatMap((item) =>
    (item.true ?? []).map((target) => ({ id: `${item.id}-${target}` }))
  );
}
```

Examples of **correct** code for this rule:

`src/components/BlueprintFlow/flowAdapter.ts`

```ts
function convertToNodesAndEdges(data) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return { nodes: [], edges: [] };
  }

  const nodes = data.map((item) => ({
    id: item.id,
    label: item.properties?.label,
    icon: item.properties?.icon,
    type: item.type,
    description: item.properties?.description,
  }));

  const edges = [];
  let edgeIdCounter = 0;

  data.forEach((item) => {
    if (item.type === "CONDITION" && item.true) {
      const trueNodes = Array.isArray(item.true) ? item.true : [item.true];

      trueNodes.forEach((targetId) => {
        if (targetId) {
          edges.push({
            id: `edge-${edgeIdCounter++}`,
            source: item.id,
            target: targetId,
            style: { stroke: "#22c55e", strokeDasharray: "5.5" },
            data: { conditionResult: "true" },
          });
        }
      });
    }
  });

  return { nodes, edges };
}
```

The adapter always returns `{ nodes: [], edges: [] }` for absent or malformed
input rather than throwing, so the canvas renders empty instead of blanking the
tab.

---

### `flow/validate-before-save`

**Severity: `warn`**

A blueprint is validated before it is persisted. Validation lives in
`BlueprintFlow/Validation/validation.ts`, returns
`{ isValid, errors }` with `errors` carrying enough to point at the offending
edge, and the widget renders those errors rather than blocking silently.

Rationale: the error shape — `nodeId`, `nodeLabel`, `nextNodeId`,
`nextNodeLabel`, `missingProperties`, `message` — is what lets
`BlueprintFlowWidget` highlight both ends of a broken connection. Returning a
bare boolean loses the ability to point at anything.

Examples of **incorrect** code for this rule:

```tsx
const handleSave = async () => {
  if (!nodes.length) return;
  await upsertBlueprint(agentId, nodes);
};
```

Examples of **correct** code for this rule:

`src/components/BlueprintFlow/Validation/validation.ts`

```ts
type ValidationError = {
  nodeId: string;
  nodeLabel: string;
  nextNodeId: string;
  nextNodeLabel: string;
  missingProperties: string[];
  message: string;
};

type ValidationResult = {
  isValid: boolean;
  errors: ValidationError[];
};
```

`src/widgets/BlueprintFlowWidget/BlueprintFlowWidget.tsx`

```tsx
setValidationErrors(validationResult.errors);

if (validationResult.errors.length === 0 && showValidationErrors) {
  setShowValidationErrors(false);
}
```

Errors are matched back to the canvas by both ends of the edge:

```tsx
const nodeErrors = validationErrors.filter(
  (error) => error.nodeId === nodeId || error.nextNodeId === nodeId
);
```

---

## 14. Content rendering

### `content/markdown-through-renderer`

**Severity: `error`**

Text authored by a model or returned by the API renders through
`components/MarkdownRenderer`. Do not drop a raw `ReactMarkdown` into a feature
with default element mapping, and do not render model output as a plain string
when it may contain markdown.

Rationale: `MarkdownRenderer` maps every markdown element onto MUI —
headings to `Typography` variants, lists to `Box component="ul"` with
themed spacing, and it reads `useTheme()` for the rest. Default `ReactMarkdown`
emits bare `<h1>`/`<p>`/`<ul>`, which inherit none of the theme and break the
visual rhythm of the surrounding card.

Examples of **incorrect** code for this rule:

```tsx
import ReactMarkdown from "react-markdown";

function BlueprintSkill({ skill }) {
  return <ReactMarkdown>{skill}</ReactMarkdown>;
}
```

```tsx
<Typography variant="body2">{aiResponse.content}</Typography>
```

Examples of **correct** code for this rule:

`src/components/BlueprintSkill/BlueprintSkill.tsx`

```tsx
import MarkdownRenderer from "../MarkdownRenderer/MarkdownRenderer";

{skill && <MarkdownRenderer>{skill}</MarkdownRenderer>}
```

`MarkdownRenderer` takes an optional `sx` for the wrapper and applies
`remark-gfm`, so tables and strikethrough work. Extend its component map rather
than adding a second renderer.

---

### `content/restrict-dangerous-html`

**Severity: `error`**

`dangerouslySetInnerHTML` is permitted only for SVG bodies read out of the
bundled `@iconify/json` icon sets. It must never receive API data, model output,
or anything derived from user input.

Rationale: icon bodies are static JSON compiled into the bundle at build time —
there is no injection path. Everything else in this app is attacker-influenced:
agent descriptions, knowledge text and AI replies all round-trip through the API.

Examples of **incorrect** code for this rule:

```tsx
<Box dangerouslySetInnerHTML={{ __html: knowledge.text }} />
<div dangerouslySetInnerHTML={{ __html: aiResponse.content }} />
```

Examples of **correct** code for this rule:

`src/widgets/AIMarketplace/AIEngineIcons.tsx`

```tsx
import vendorIcons from "@iconify/json/json/simple-icons.json";

const openaiIcon = (
  vendorIcons as {
    icons: { [key: string]: { body: string; viewBox?: string } };
  }
).icons["openai"];

export function OpenAIIcon({ width, height }: { width: number; height: number }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={openaiIcon.viewBox || "0 0 24 24"}
      fill="currentColor"
      dangerouslySetInnerHTML={{ __html: openaiIcon.body }}
    />
  );
}
```

For dynamic icon names prefer `<Iconify icon={cleanIconName(icon)} />`, which
resolves through the icon runtime instead of injecting markup.

---

### `ui/sx-over-inline-style`

**Severity: `warn`**

Style MUI components with `sx`. Reserve the `style` prop for non-MUI elements
that do not accept `sx` — raw `svg`, third-party canvas nodes — and for values
that must bypass the emotion cache.

Rationale: `sx` resolves theme tokens (`background.paper`, `error.main`),
responsive breakpoint objects and `&:hover` selectors; `style` resolves none of
them, so anything written there is hardcoded by construction. The codebase is
already 1013 `sx` usages against 60 `style`.

Examples of **incorrect** code for this rule:

`src/components/CodeBlock/CodeBlock.tsx`

```tsx
const CodeBlock = ({ children }) => (
  <code
    style={{
      backgroundColor: "#2e2e2e",
      color: "#f8f8f2",
      padding: "0.5em",
      borderRadius: "4px",
      display: "block",
    }}
  >
    {children}
  </code>
);
```

Examples of **correct** code for this rule:

```tsx
const CodeBlock = ({ children }) => (
  <Box
    component="code"
    sx={{
      display: "block",
      p: 1,
      borderRadius: 1,
      bgcolor: "background.neutral",
      color: "text.primary",
      fontFamily: "monospace",
    }}
  >
    {children}
  </Box>
);
```

`background.neutral` is available because `src/types/theme.d.ts` augments
`TypeBackground` with it.

---

### `ui/deterministic-per-entity-visuals`

**Severity: `warn`**

A colour, gradient or image chosen per entity is derived from that entity's id,
not from `Math.random()` and not from array position.

Rationale: the value has to survive a re-render, a refetch and a reload, and it
has to agree between a card and the detail page for the same agent. Index-based
selection reshuffles the moment the list is sorted or filtered.

Examples of **incorrect** code for this rule:

```tsx
{agents.map((agent, index) => (
  <AgentCard key={agent.id} agent={agent} cover={backgroundUrls[index]} />
))}
```

Examples of **correct** code for this rule:

`src/utils/background.ts`

```ts
export const getBackgroundUrl = (id) => {
  let hash = 0;

  for (let i = 0; i < id?.length; i++) {
    const char = id.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }

  const index = Math.abs(hash) % backgroundUrls.length;
  return backgroundUrls[index];
};
```

`src/utils/gradient.ts` follows the same idea, taking the full id list so a team
of agents gets visually distinct gradients:

```tsx
background: getAgentGradients(agent.id, theme, allAgentIds);
```

This is why `allAgentIds` is threaded from the widget through `AgentCard` and
`AgentLayout` — the gradient depends on the peer set, so it must be passed, not
recomputed locally.

Randomised copy is a deliberate exception: `src/utils/answerPool.ts` picks a
supervision reply at random because varying the wording is the point.

---

## 15. Dependencies, charts and external windows

### `deps/declare-what-you-import`

**Severity: `error`**

Every package imported from `src` appears in this project's `package.json`.
Do not rely on a transitive dependency of `@canmingir/link` resolving at the
top of `node_modules`.

Rationale: `react-apexcharts` is imported by four files and is declared nowhere
in `dashboard/package.json`. It resolves today only because the platform package
happens to depend on it and the installer hoists it. A platform bump that drops
or nests it breaks `bun run build` with a module-not-found in code nobody
touched.

Examples of **incorrect** code for this rule:

`src/widgets/DepartmantCharts/UsageChart.tsx`

```tsx
import Chart from "react-apexcharts";
```

with no `react-apexcharts` entry in `package.json`.

Examples of **correct** code for this rule:

Either add the dependency explicitly:

```json
"dependencies": {
  "react-apexcharts": "^1.4.1",
  "apexcharts": "^3.45.0"
}
```

or import the chart through the platform surface that is already declared:

```tsx
import { useChart } from "@canmingir/link/platform/components";
```

The reverse also applies: `@mui/x-charts` sits in `devDependencies` and is
imported by nothing in `src`. Charts here are ApexCharts.

---

### `chart/options-through-use-chart`

**Severity: `warn`**

Chart options are built with `useChart` from
`@canmingir/link/platform/components`, passing only the chart-specific overrides.
Do not assemble a full ApexCharts options object by hand.

Rationale: `useChart` supplies the house defaults — palette, fonts, grid,
legend, tooltip theme — merged with the overrides. A hand-built options object
renders with ApexCharts defaults and visibly disagrees with every other chart on
the page.

Examples of **incorrect** code for this rule:

```tsx
const chartOptions = {
  chart: { type: "area", toolbar: { show: false } },
  colors: ["#00A76F"],
  stroke: { width: 2 },
  xaxis: { type: "datetime" },
};
```

Examples of **correct** code for this rule:

`src/widgets/DepartmantCharts/UsageChart.tsx`

```tsx
import Chart from "react-apexcharts";
import { useChart } from "@canmingir/link/platform/components";

const chartOptions2 = useChart({
  xaxis: {
    type: "datetime",
    categories: ["2018-09-19T00:00:00.000Z", "2018-09-19T01:30:00.000Z"],
  },
  tooltip: {
    x: { format: "dd/MM/yy HH:mm" },
  },
});
```

Responsive sizing uses `useMediaQuery` rather than ApexCharts' own `responsive`
array, matching `UsageChart`.

---

### `auth/postmessage-explicit-origin`

**Severity: `error`**

`postMessage` names an explicit target origin. Never `"*"`. The listener checks
`event.origin` before trusting the payload.

Rationale: the OAuth popup carries an authorization `code`. Posting it with `"*"`
hands it to whatever document happens to own the opener, which is the whole
attack against popup-based OAuth.

Examples of **incorrect** code for this rule:

```tsx
window.opener.postMessage({ code }, "*");
```

Examples of **correct** code for this rule:

`src/pages/callback.tsx`

```tsx
const Callback = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code && window.opener) {
      window.opener.postMessage({ code }, window.origin);
    }

    setTimeout(() => window.close(), 300);
  }, []);

  return null;
};
```

The callback page is the one legitimate page with no layout, no `<Page>` and a
`null` render — it exists only to hand the code back and close. That is not a
`layer/pages-are-containers` violation.

---

### `auth/read-tokens-from-link-namespace`

**Severity: `warn`**

Tokens are read with the two-argument `storage` form under the `link`
namespace — `storage.get("link", "accessToken")`,
`storage.get("link", "refreshToken")`, `storage.get("link", "identityProvider")`.
Never read a token from a bare key, and never put one in component state or a
query string.

Rationale: the platform owns the `link` namespace and writes the tokens there
after login. A bare `storage.get("accessToken")` reads a different slot and
silently yields `undefined`, which surfaces as an unauthenticated socket rather
than a visible error.

Examples of **incorrect** code for this rule:

```ts
const token = storage.get("accessToken");
const socket = io(host, { path, query: { token } });
```

Examples of **correct** code for this rule:

`src/hooks/useSession.ts`

```ts
const token = storage.get("link", "accessToken");

socketRef.current = io(host, {
  path,
  auth: { token },
  query: { agentId },
});
```

Tokens travel in `auth`, not `query`. `useSocket` uses the app name from config
as its namespace — `storage.get(name, "accessToken")` — which is the same idea
parameterised.

---

### `chat/commands-are-data`

**Severity: `warn`**

Slash commands for the chat input are declared as data in
`src/components/ChatInput/chat.config.ts`: a `name`, `description`, `icon`, an
`action`, and a `next` chain describing the prompts. Adding a command means
adding an entry, not branching in the editor.

Rationale: `CommandList`, `CommandComponent` and the Slate editor all walk the
same declarative tree to render suggestions, collect inputs and dispatch. A
command implemented imperatively in the editor gets no suggestion entry and no
input collection.

Examples of **incorrect** code for this rule:

```tsx
const handleSubmit = (text) => {
  if (text.startsWith("/learn-url")) {
    const url = text.replace("/learn-url", "").trim();
    return learnAction({ url, type: "URL" });
  }

  if (text.startsWith("/task")) {
    return taskAction({ text });
  }
};
```

Examples of **correct** code for this rule:

`src/components/ChatInput/chat.config.ts`

```ts
{
  action: (inputs) => learnAction(inputs),
  name: "/learn-url",
  description: "Learn something new from a URL",
  icon: "mdi:search-web",
  next: {
    type: "AGENT",
    next: {
      label: "Enter URL",
      type: "URL",
    },
  },
}
```

Branching prompts use a `DROPDOWN` step whose `action` maps the choice onto a
key in the next map:

```ts
{
  type: "DROPDOWN",
  label: "Select a Type",
  list: [
    { name: "QA", icon: "ic:twotone-question-answer" },
    { name: "URL", icon: "mdi:search-web" },
  ],
  action: (input) => {
    if (input === "QA") return "qaInput";
    else if (input === "URL") return "urlInput";
  },
  next: {
    qaInput: { type: "QA", next: { label: "Enter Answer", type: "ANSWER" } },
    urlInput: { type: "URL" },
  },
}
```

The `action` functions themselves still owe a debt to
[`data/http-only-in-hooks`](#datahttp-only-in-hooks) — they call `http` directly
today. New commands should delegate to a hook.

---

## 16. Cypress infrastructure

### `test/fixtures-track-renames`

**Severity: `error`**

When a domain noun is renamed, the fixture directories, the fixture paths in
specs, and the `data-cy` names move in the same change.

Rationale: the specs are not run by CI. `test.yml` runs lint and typecheck only,
and `npm test` reaches Cypress only through the `pre-push` hook — which
`prepare.cjs` writes but no `prepare` script installs. A broken fixture path
therefore fails nothing until someone runs the suite by hand.

This has already happened. Every `agents-page/*` fixture referenced by
`agents.cy.ts` and `agent.cy.ts` is missing; the files still sit under the
pre-rename `colleagues-page/` and `colleague/` directories.

Examples of **incorrect** code for this rule:

`cypress/e2e/agents.cy.ts`

```ts
cy.fixture("agents-page/teams.json").then((teams) => {
  cy.platformSetup(teams[1].id, "agents-page/team.json", config);
});

cy.fixture("agents-page/create/agent.post.json").as("createdAgent");
```

against a tree that contains only:

```
cypress/fixtures/colleagues-page/create/agent.post.json
cypress/fixtures/colleague/update/agent.put.json
```

Examples of **correct** code for this rule:

The `knowledges` and `supervising` fixtures, whose spec references all resolve:

```
cypress/fixtures/knowledges/knowledges.json
cypress/fixtures/knowledges/create/knowledges.url.post.json
cypress/fixtures/knowledges/delete/knowledges.qa.delete.json
cypress/fixtures/supervising/supervising.status.answered.json
```

To check the whole suite before pushing, resolve every `cy.fixture(...)`
reference against the tree rather than trusting the specs to fail loudly.

---

### `test/typed-custom-commands`

**Severity: `warn`**

A custom command is declared on `Cypress.Chainable` inside the
`declare namespace Cypress` block at the top of `cypress/support/commands.ts`,
with real parameter types, and then registered with `Cypress.Commands.add`.

Rationale: `tsconfig.json` sets `types: ["cypress"]`, so the declaration is what
gives specs autocomplete and argument checking under `typecheck` — the one gate
that does run in CI for this directory.

Examples of **incorrect** code for this rule:

```ts
Cypress.Commands.add("verifyAgentCard", (agent, index) => {
  cy.getBySel("agent-card-name").eq(index).should("have.text", agent.name);
});
```

Examples of **correct** code for this rule:

`cypress/support/commands.ts`

```ts
declare namespace Cypress {
  interface Chainable {
    verifyAgentCard(
      agent: {
        character: string;
        role: string;
        name: string;
        AIEngine: { vendor: string; model: string };
      },
      index: number
    ): Chainable<void>;

    waitEvent(eventName: string, timeout?: number): Chainable<void>;

    getBySel(selector: string): Chainable<JQuery<HTMLElement>>;
  }
}

Cypress.Commands.add("verifyAgentCard", (agent, index) => {
  cy.getBySel("agent-card-name").eq(index).should("have.text", agent.name);
});
```

---

### `test/intercepts-in-named-commands`

**Severity: `warn`**

Route stubs are grouped into named setup commands — `setAgentIntercept`,
`chatPageIntercept`, `platformSetup` — and called from `beforeEach` or at the
top of a test. Do not scatter `cy.intercept` through assertions.

Rationale: a screen needs its whole dependency set stubbed before it mounts,
because the widgets fetch on mount and refetch on every published event. Stubbing
one route inline leaves the rest hitting a live API, and the failure surfaces as
an unrelated empty list.

Examples of **incorrect** code for this rule:

```ts
it("add a new agent", () => {
  cy.visit("/agents");
  cy.getBySel("add-new-button").click();
  cy.intercept("POST", "/api/agents", { id: "1" });
  cy.intercept("GET", "/api/agents", []);
});
```

Examples of **correct** code for this rule:

`cypress/e2e/agents.cy.ts`

```ts
beforeEach(() => {
  cy.fixture("agents-page/teams.json").then((teams) => {
    cy.platformSetup(teams[1].id, "agents-page/team.json", config);
    cy.viewport(1280, 720);
  });

  cy.fixture("agents-page/create/agent.post.json").as("createdAgent");
});

it("add a new agent", function () {
  cy.visit("/agents");
  cy.setAgentIntercept();

  cy.getBySel("add-new-button").click();
  cy.waitEvent("AGENT_WIZARD_OPENED");
});
```

`platformSetup(itemId, itemFixturePath, config)` seeds storage and the platform
routes so the app boots with a selected team. Call it before `cy.visit`.

---

### `test/fixture-layout`

**Severity: `warn`**

Fixtures live at `cypress/fixtures/<feature>-page/<scenario>/<resource>.<verb>.json`.
The verb is the HTTP method the fixture answers: `.get.json`, `.post.json`,
`.put.json`, `.patch.json`, `.delete.json`. A fixture that is shared across
scenarios sits at the feature root without a verb.

Rationale: a single test walks several states of the same resource — the list
before the create, the POST response, the list after. Encoding scenario and verb
in the path is what keeps them distinguishable.

Examples of **incorrect** code for this rule:

```
cypress/fixtures/agents2.json
cypress/fixtures/agentsAfterCreate.json
cypress/fixtures/newAgentResponse.json
```

Examples of **correct** code for this rule:

```
cypress/fixtures/knowledges/knowledges.json
cypress/fixtures/knowledges/create/knowledges.url.post.json
cypress/fixtures/knowledges/create/knowledges.qa.post.json
cypress/fixtures/knowledges/edit/knowledges.text.json
cypress/fixtures/knowledges/delete/knowledges.get.json
cypress/fixtures/chat-page/messages/messages.reply.post.json
```

---

## 17. App robustness and shared state

### `app/error-boundary-at-route`

**Severity: `error`**

A render throw must be contained. There is no error boundary anywhere in this
app today, so any exception thrown during render unmounts the entire tree and
leaves a blank page with the error only in the console.

Rationale: this is not hypothetical. `useApi` initialises `data` to `null`, and
on a failed request it sets `error`, sets `loading` false, and leaves `data` at
`null`. `useLoading` returns `true` only while `hasLoadedOnce` is still false
*and* `loading` is true — so on the render immediately after a first fetch
fails, it returns false and the widget takes its loaded branch with `agents`
still `null`:

`src/widgets/AgentsWidget/AgentsWidget.tsx`

```tsx
{isLoading
  ? Array.from({ length: 2 }).map((_, index) => (
      <Grid key={index} size={{ xs: 12, sm: 12, md: 6, lg: 4 }}>
        <AgentsSkeleton key={index} />
      </Grid>
    ))
  : agents.map((agent) => (
      <AgentCard key={agent.id} agent={agent} />
    ))}
```

One failed `GET /agents` throws `Cannot read properties of null` and blanks the
application.

Examples of **incorrect** code for this rule:

```tsx
const routes = [
  {
    container: <Container />,
    childs: [{ layout: <DashboardLayout />, pages: [...] }],
  },
];
```

with no boundary between the container and the pages, and widgets that index
into possibly-null data.

Examples of **correct** code for this rule:

Guard the data, which removes the throw:

```tsx
if (error) {
  return <Typography color="error.main">{error}</Typography>;
}

if (!agents?.length) {
  return <AddNewButton addNew={"Agent"} onClickFunction={onCreate} />;
}

return agents.map((agent) => <AgentCard key={agent.id} agent={agent} />);
```

and contain what the guard misses, at the container:

```tsx
function Container() {
  return (
    <RouteErrorBoundary>
      <TeamWizard open={platformDialog.open} onClose={onClose} />
      <Onboarding />
      <Outlet />
    </RouteErrorBoundary>
  );
}
```

The guard is the fix; the boundary is the backstop. Both are required —
[`data/handle-async-states`](#datahandle-async-states) is the rule that would
have prevented this specific crash, and it is currently unmet across every
widget.

---

### `state/no-module-level-mutable-singletons`

**Severity: `error`**

Do not hold cross-component state in a mutable module-scope object and reach it
through an exported setter. Cross-component signalling goes through
`publish` / `useEvent`; parent-to-child goes through props.

Rationale: a module singleton is initialised once per module instance, not per
mount. Two `PopChat` instances overwrite each other's callback, the value
survives navigation with no way to reset it, nothing re-renders when it changes,
and it is invisible to the event bus that the rest of the app is tested through
(`cy.waitEvent`).

Examples of **incorrect** code for this rule:

`src/components/PopChat/PopChat.tsx`

```tsx
const sub = { item: null };

const response = (res) => {
  sub.item = res;
};

export const handleAddResponseMessage = (ret) => {
  sub.item(ret);
};
```

`sub.item` is `null` until some instance has registered, so an early
`handleAddResponseMessage` call throws.

Examples of **correct** code for this rule:

`src/hooks/useSession.ts`

```ts
socket.on("ai_message", ({ content }) => {
  setConversations((prev) => [...prev, { role: "AI", content }]);
  publish("AI_RESPONDED", { content });
});
```

and on the receiving side:

```tsx
const [aiResponded] = useEvent("AI_RESPONDED", null);

useEffect(() => {
  if (aiResponded?.content) {
    appendMessage(aiResponded.content);
  }
}, [aiResponded]);
```

Module-scope constants that are never reassigned — `TABS` in `AgentLayout`,
`ICON_NAMES` in `lib/`, the command tree in `chat.config.ts` — are fine. The rule
is about mutation.

---

### `app/page-sets-document-title`

**Severity: `warn`**

Every routed page renders `<Page name="…">`, which sets the document title
through `react-helmet-async` as `{config.name} - {name}` and renders breadcrumbs
when `links` is supplied.

Rationale: the title is the only per-route signal in the browser tab and in
history. Skipping `<Page>` leaves the previous route's title in place, so back
and forward navigation is unreadable.

Examples of **incorrect** code for this rule:

```tsx
function Cost() {
  return (
    <SingleScrollableLayout title="Cost">
      <CostWidget />
    </SingleScrollableLayout>
  );
}
```

Examples of **correct** code for this rule:

`src/pages/agents.tsx`

```tsx
return (
  <>
    <Page name={"Agent"} />
    <SingleScrollableLayout title={team?.name}>
      <AgentsWidget teamId={teamId} />
    </SingleScrollableLayout>
  </>
);
```

`src/components/Page/PageHelmet.tsx`

```tsx
<Helmet>
  <meta charSet="utf-8" />
  <title>
    {config.name} - {name}
  </title>
</Helmet>
```

`SingleScrollableLayout`'s `title` is the on-screen heading; `Page`'s `name` is
the document title. They are different concerns and both are needed.
`callback.tsx` is the documented exception — see
[`auth/postmessage-explicit-origin`](#authpostmessage-explicit-origin).

---

### `state/query-string-for-shareable-view-state`

**Severity: `warn`**

View state that should survive a reload or be shareable by URL — the active tab,
a selected filter — lives in the query string, written with
`navigate(..., { replace: true })`. Transient state stays in `useState`.

Rationale: `replace: true` keeps tab switches out of the history stack, so the
browser back button leaves the page rather than walking back through tabs. The
component still needs local state, because the query string is the source of
truth only on entry.

Examples of **incorrect** code for this rule:

```tsx
const [currentTab, setCurrentTab] = useState("profile");

const handleTabChange = (newTab: string) => {
  setCurrentTab(newTab);
  navigate(`${location.pathname}?tab=${newTab}`);
};
```

Reloading returns to `profile`, and back walks tab by tab.

Examples of **correct** code for this rule:

`src/layouts/AgentLayout.tsx`

```tsx
const queryParams = new URLSearchParams(location.search);
const tabFromQuery = queryParams.get("tab");

const [currentTab, setCurrentTab] = useState(
  safeInitial ||
    (visibleTabs.some((tab) => tab.value === tabFromQuery) ? tabFromQuery : "profile")
);

const handleTabChange = (newTab: string) => {
  setCurrentTab(newTab);

  const newQueryParams = new URLSearchParams(location.search);
  newQueryParams.set("tab", newTab);

  navigate(
    { pathname: location.pathname, search: newQueryParams.toString() },
    { replace: true }
  );
};
```

The value read out of the query string is validated against the known tab list
before it is trusted — `visibleTabs.some((tab) => tab.value === tabFromQuery)` —
because it is user-supplied input.

---

## 18. Tooling hygiene

### `deps/no-unused-declared`

**Severity: `warn`**

A package declared in `package.json` is imported by something. Remove entries
that nothing uses.

Rationale: the companion to
[`deps/declare-what-you-import`](#depsdeclare-what-you-import). Unused entries
still install, still pull transitive trees, still appear in audit reports, and
still get upgraded by dependency bots — for code that does not exist.

Examples of **incorrect** code for this rule:

```json
"dependencies": {
  "axios-retry": "^3.5.0"
},
"devDependencies": {
  "@mui/x-charts": "^8.28.2"
}
```

Neither is imported anywhere under `src`.

Examples of **correct** code for this rule:

Declarations that earn their place, each with real call sites:

```json
"dependencies": {
  "elkjs": "^0.10.0",
  "react-organizational-chart": "^2.2.1",
  "react-draggable": "4.4.6",
  "use-sound": "^4.0.1"
}
```

used by `utils/flowLayout.ts`, `widgets/OrganizationChart/Content.tsx`, and
`components/PopChat/PopChat.tsx` respectively. A single call site is enough —
absent is the problem, not rare.

---

### `deps/no-dead-tooling`

**Severity: `warn`**

A configured tool is either wired up and working or removed. Do not leave config
files for a runner that never executes.

Rationale: dead config reads as coverage that does not exist. Three pieces of
this repo currently claim more than they deliver:

- `jest.config.ts` and `jest.setup.ts` configure a jsdom test runner, but no
  `*.test.*` or `*.spec.*` file exists under `src`, `npm test` runs Cypress
  rather than Jest, and `jest.setup.ts` imports `@testing-library/jest-dom`,
  which is not in `package.json` at all. The setup would fail on its first line
  if it ever ran.
- `prepare.cjs` writes a `pre-push` hook running lint and tests, but no
  `prepare` script in `package.json` invokes it, so the hook exists only for
  developers who ran the file by hand.
- `tsconfig.json` declares the `@/*` path alias that
  [`ts/relative-imports`](#tsrelative-imports) forbids, because nothing wires it
  into Vite.

Examples of **incorrect** code for this rule:

`jest.config.ts`

```ts
export default {
  testEnvironment: "jsdom",
};
```

with `jest.setup.ts` importing an undeclared package and zero tests to run.

Examples of **correct** code for this rule:

Either commit to it — declare `jest`, `@testing-library/jest-dom` and
`@testing-library/react`, reference `jest.setup.ts` from
`setupFilesAfterEach`, add a distinct script, and run it in `test.yml`:

```json
"scripts": {
  "test:unit": "jest",
  "test": "start-server-and-test dev http://localhost:5173 cypress:run",
  "prepare": "node prepare.cjs"
}
```

or delete `jest.config.ts` and `jest.setup.ts` and let Cypress be the whole
story. Either is defensible; the current middle is not.

---

### `import/one-declaration-per-module`

**Severity: `warn`**

Import each module once per file. Merge the members into a single declaration
rather than splitting them across several.

Rationale: `sort-imports` sorts declarations by their first member, so splitting
one module across declarations scatters them through the import block and hides
how much of a module a file depends on. A merged multi-member import sorts once
and reads as one dependency. ESLint does not catch this — `no-duplicate-imports`
is not enabled.

Examples of **incorrect** code for this rule:

`src/components/PopChat/PopChat.tsx`

```tsx
import { Iconify } from "@canmingir/link/platform/components";
import { LoadingMessage } from "@canmingir/link/platform/components";
import { MessageList } from "@canmingir/link/platform/components";
import { PresetSelector } from "@canmingir/link/platform/components";

import { Scrollbar } from "@canmingir/link/platform/components";
```

`src/components/AddItemDialog/AddItemDialog.tsx`

```tsx
import {
  FormProvider,
  RHFTextField,
} from "@canmingir/link/platform/components";
import { Iconify, Label } from "@canmingir/link/platform/components";
```

Examples of **correct** code for this rule:

```tsx
import {
  FormProvider,
  Iconify,
  Label,
  RHFTextField,
} from "@canmingir/link/platform/components";
```

Members stay alphabetical inside the braces, so the merged form still satisfies
`sort-imports`. Four files split a platform import today: `PopChat.tsx` across
five declarations, and `TeamChart.tsx`, `KnowledgeTable.tsx` and
`AddItemDialog.tsx` across two each.

---

### `data/sample-data-at-module-scope`

**Severity: `warn`**

Demo, seed and placeholder data is a named module-scope constant, declared above
the component and named for what it is. Never inline a fake record among real
fetched values inside a render.

Rationale: placeholder data that sits in the render body is indistinguishable
from state derived from the API, so it survives every review that is looking for
the real fetch. Hoisting and naming it makes it greppable when the endpoint
finally lands.

Examples of **incorrect** code for this rule:

`src/widgets/OrganizationChart/Content.tsx`

```tsx
function OrganizationalChart({ variant = "simple", sx }) {
  const theme = useTheme();

  const manager = {
    name: "Jack Shephard",
    role: "CAO - Chief AI Officer",
    avatar: ":5:",
  };

  const { organization, loading } = useOrganizations().getOrganizationById(organizationId);
}
```

`manager` is hardcoded, rebuilt every render, and reads like it came from
`organization`.

Examples of **correct** code for this rule:

`src/widgets/TeamWizard/TeamWizard.tsx`

```tsx
const sampleAgents = [
  {
    name: "system_agent",
    icon: "mingcute:bank-card-line",
    aiEngineId: "289a3c9a-f23b-421a-ac6e-f14052a2d57c",
    engineName: "OpenAI",
    description: "A system-focused agent designed to support technical workflows.",
  },
];

const teamNames = ["Core Systems", "Operations", "Data Intelligence"];

function TeamWizard({ open, onClose }) {
  const { createTeam } = useTeams();
}
```

`SampleFlow.tsx` and `SampleNode.tsx` under `BlueprintFlow/Samples/` take this
further and give sample data its own directory, which is the right move once
there is more than one constant.

---

## 19. Accessibility

### `a11y/icon-button-needs-label`

**Severity: `error`**

A control whose only content is an icon carries an `aria-label` describing the
action. This covers `IconButton`, `Fab`, and any clickable `Box` wrapping an
`Iconify`.

Rationale: `Iconify` renders an SVG with no text node, so an icon-only button has
no accessible name at all — a screen reader announces "button" and nothing else.
Not one of the 51 `<IconButton>` instances in `src` has an `aria-label` today, so
every menu, close, delete and expand control in this app is unlabelled.

`data-cy` does not help here. It is a test hook with no accessibility semantics,
and the two are not substitutes — a control generally needs both.

Examples of **incorrect** code for this rule:

`src/components/AgentCard/AgentCard.tsx`

```tsx
<IconButton onClick={popover.onOpen} sx={{ position: "absolute", top: 8, right: 8 }}>
  <Iconify icon="eva:more-vertical-fill" />
</IconButton>
```

Examples of **correct** code for this rule:

```tsx
<IconButton
  onClick={popover.onOpen}
  aria-label={`More actions for ${agent.name}`}
  data-cy="agent-card-more-vert"
  sx={{ position: "absolute", top: 8, right: 8 }}
>
  <Iconify icon="eva:more-vertical-fill" />
</IconButton>
```

A control that already contains text needs no label — the
`MenuItem`s in the same popover read "View", "Edit", "Delete" and are fine as
they are. Prefer naming the target, not the glyph: "Delete agent", not
"Trash icon".

---

### `a11y/dialog-labelled-by`

**Severity: `warn`**

A `Dialog` sets `aria-labelledby` pointing at its `DialogTitle` id, and
`aria-describedby` pointing at its `DialogContentText` id when it has body copy.

Rationale: without them the dialog announces as an unnamed group, so a screen
reader user entering a confirmation prompt is not told what they are confirming.
`ConfirmationDialog` is the only one of the dialogs in `src` that does this.

Examples of **incorrect** code for this rule:

`src/components/DeleteConfirmation/DeleteConfirmation.tsx`

```tsx
<Dialog fullWidth open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
  <DialogTitle>{"Confirm Delete"}</DialogTitle>
  <DialogContent>
    <DialogContentText>
      Are you sure you want to delete this item?
    </DialogContentText>
  </DialogContent>
</Dialog>
```

Examples of **correct** code for this rule:

`src/components/ConfirmationDialog/ConfirmationDialog.tsx`

```tsx
<Dialog
  open={open}
  onClose={onClose}
  aria-labelledby="alert-dialog-title"
  aria-describedby="alert-dialog-description"
>
  <DialogTitle id="alert-dialog-title" sx={styles.dialogTitle}>
    {title}
  </DialogTitle>
  <DialogContent>
    <DialogContentText sx={styles.dialogContentText} id="alert-dialog-description">
      {content}
    </DialogContentText>
  </DialogContent>
</Dialog>
```

The ids must be unique on the page. `ConfirmationDialog` gets away with the
fixed `alert-dialog-title` because only one instance mounts at a time; a dialog
that can stack needs an id derived from its subject.

---

## 20. Storybook, resolution and lint scope

### `lint/no-blanket-disable`

**Severity: `error`**

Never disable ESLint for a whole file with a bare `/* eslint-disable */`. Scope
every suppression to the specific rule, and prefer the single-line form.

Rationale: `lint` runs with `--max-warnings 0` and is one of only two checks CI
performs. A blanket disable removes the file from that gate entirely — not just
the rule that was inconvenient, but `no-eval`, `eqeqeq`, `react-hooks/rules-of-hooks`
and everything else. Two files do this today, and one of them,
`SupervisingChat.tsx`, is over a thousand lines with data hooks and dialogs in
it.

Examples of **incorrect** code for this rule:

`src/widgets/ChatInput/ChatInput.tsx`

```ts
/* eslint-disable */
import IconButton from "@mui/material/IconButton";
```

`src/components/SupervisingChat/SupervisingChat.tsx`

```ts
/* eslint-disable */
```

Examples of **correct** code for this rule:

`cypress/support/commands.ts`

```ts
/* eslint-disable @typescript-eslint/no-namespace */
declare namespace Cypress {
  interface Chainable {
    getBySel(selector: string): Chainable<JQuery<HTMLElement>>;
  }
}
```

One rule, named, with the declaration it exists for directly beneath it. For a
single occurrence prefer the line form, as
[`effect/scoped-deps-disable`](#effectscoped-deps-disable) describes.

---

### `story/theme-decorator-in-preview`

**Severity: `error`**

`.storybook/preview.ts` must wrap every story in the same theme provider the app
mounts, so stories render against the real palette.

Rationale: the app's theme arrives through `<Platform>` from `@canmingir/link`
in `src/index.tsx`, and `src/types/theme.d.ts` augments it with
`background.neutral`, `customShadows.card` and the `profile-card` variants.
`preview.ts` currently declares only `actions` and `controls` matchers and
provides no theme, so every token this codebase relies on —
`bgcolor: "background.paper"`, `color: "text.secondary"`, `variant="profile-card"` —
falls back to MUI defaults or renders as nothing. A story that looks right in
Storybook can look wrong in the app, and vice versa, which makes the whole tool
untrustworthy.

Examples of **incorrect** code for this rule:

`.storybook/preview.ts`

```ts
const preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/ },
    },
  },
};

export default preview;
```

Examples of **correct** code for this rule:

```tsx
const preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/ },
    },
  },
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Story />
      </ThemeProvider>
    ),
  ],
};

export default preview;
```

The decorator needs JSX, so `preview.ts` becomes `preview.tsx`. Components that
also read the event bus or router need those providers in the decorator too —
which is a good reason to keep stories to the presentational layer, per the next
rule.

---

### `import/no-file-extensions`

**Severity: `warn`**

Relative imports omit the file extension. Do not write `./AgentCard.js` for a
file that is `AgentCard.tsx`.

Rationale: 26 import sites carry an extension, and every one of them names an
extension the file does not have — `.js` and `.jsx` pointing at `.ts` and
`.tsx`. They resolve only because `moduleResolution: "bundler"` and the Vite
resolver rewrite them. The extension therefore conveys nothing true, breaks a
plain text search for the real filename, and misleads anyone converting the file.

Examples of **incorrect** code for this rule:

`src/components/AgentCard/index.ts`

```ts
export { default } from "./AgentCard.js";
```

`src/widgets/ChatInput/ChatInput.tsx`

```ts
import { BlueprintCommands } from "../../components/ChatInput/chat.config.js";
import ChatInputCommandEditor from "../../components/ChatInput/ChatInputCommandEditor.js";
import { Commands } from "../../components/ChatInput/chat.config.js";
```

Three declarations, one module, and an extension that matches no file on disk —
this line also breaks
[`import/one-declaration-per-module`](#importone-declaration-per-module).

Examples of **correct** code for this rule:

`src/components/AddNewButton/index.ts`

```ts
export { default } from "./AddNewButton";
```

```ts
import {
  BlueprintCommands,
  Commands,
  Types,
} from "../../components/ChatInput/chat.config";
```

---

### `component/barrel-is-index`

**Severity: `warn`**

The barrel file in a component folder is named `index.ts`. Do not name it after
the component.

Rationale: the barrel exists so importers can write the folder path. A barrel
named `TitleBar.ts` sitting beside `TitleBar.tsx` gives the folder two files that
differ only by extension, and `from "../TitleBar/TitleBar"` becomes genuinely
ambiguous to a reader — it resolves to the barrel, not the component.

Examples of **incorrect** code for this rule:

```
src/components/TextFieldWithTitle/
  TextFieldWithTitle.ts
  TextFieldWithTitle.tsx
  styles.ts

src/components/TitleBar/
  TitleBar.ts
  TitleBar.tsx
  styles.ts
```

Examples of **correct** code for this rule:

```
src/components/VoiceGeneratorPanel/
  VoiceGeneratorPanel.tsx
  index.ts
  styles.ts

src/components/AddNewButton/
  AddNewButton.tsx
  index.ts
  styles.ts
```

---

### `story/cover-presentational-components`

**Severity: `warn`**

A component in `src/components/` that renders from props alone should have a
`ComponentName.stories.ts` beside it, exporting a named case per meaningful
state.

Rationale: `.storybook/main.ts` globs `../src/**/*.stories.@(js|jsx|ts|tsx)` and
finds exactly two files — `Form.stories.ts` and `colors.stories.mdx` — against
roughly ninety component folders. Stories are the only place the presentational
layer is exercised in isolation, and they are the payoff for
[`layer/no-data-access-in-components`](#layerno-data-access-in-components): a
component that fetches its own data cannot have one.

Examples of **incorrect** code for this rule:

A component with several visual states and no story — `AgentCard` has an icon
state, an avatar fallback, a missing-description fallback and a popover, none of
which are exercised anywhere.

Examples of **correct** code for this rule:

`src/components/Form/Form.stories.ts`

```ts
import Form from "./Form";
import FormItemTypes from "../../constants/FormItemTypes";

export default {
  title: "Nucleoid/Form",
  component: Form,
};

export const Normal = {
  args: {
    items: [
      { type: FormItemTypes.TextField, name: "address", label: "address", required: true },
    ],
    form: { values: { address: "" }, errors: {}, touched: {} },
  },
};

export const WithValues = {
  args: {
    items: [
      { type: FormItemTypes.TextField, name: "address", label: "address", required: true },
    ],
    form: { values: { address: "Address 1" }, errors: {}, touched: {} },
  },
};
```

One export per state, named for the state. `main.ts` sets
`docs: { autodocs: "tag" }`, so a `tags: ["autodocs"]` on the default export
generates the docs page.

The existing file also shows what not to copy: its imports are
`"./Form.jsx"` and `"../../constants/FormItemTypes.js"`, neither of which is a
real filename — see
[`import/no-file-extensions`](#importno-file-extensions).

---

## 21. Naming and React correctness

### `react/no-index-keys-for-data`

**Severity: `error`**

A list rendered from fetched data keys on the entity id. `key={index}` is
permitted only for fixed-length placeholder arrays that hold no state.

Rationale: React uses the key to decide which DOM node and which component state
belongs to which item. With an index key, deleting the second of five rows makes
rows three through five inherit the state of the rows above them. This bites
hardest exactly where the codebase uses it: `KnowledgeTable` renders paginated,
type-filtered rows with `key={index}` over a `slice`, so the key is not even
stable across pages, and rows carry selection state.

Examples of **incorrect** code for this rule:

`src/components/KnowledgeTable/KnowledgeTable.tsx`

```tsx
{knowledges
  .slice((page - 1) * rowsPerPage, page * rowsPerPage)
  .map((row, index) => (
    <TableRow hover key={index} tabIndex={-1}>
      <TableCell>{row.type}</TableCell>
    </TableRow>
  ))}
```

Examples of **correct** code for this rule:

```tsx
{knowledges
  .slice((page - 1) * rowsPerPage, page * rowsPerPage)
  .map((row) => (
    <TableRow hover key={row.id} tabIndex={-1}>
      <TableCell>{row.type}</TableCell>
    </TableRow>
  ))}
```

`src/widgets/AgentsWidget/AgentsWidget.tsx`

```tsx
{agents.map((agent) => (
  <AgentCard key={agent.id} agent={agent} />
))}
```

The permitted case, from the same file — a fixed placeholder array with no
identity and no state:

```tsx
{Array.from({ length: 2 }).map((_, index) => (
  <Grid key={index} size={{ xs: 12, sm: 12, md: 6, lg: 4 }}>
    <AgentsSkeleton key={index} />
  </Grid>
))}
```

Of the 32 index-key sites in `src`, the skeletons are fine and the data lists are
not. Check what the array holds before copying either.

---

### `naming/file-matches-default-export`

**Severity: `error`**

A file's default export has the same name as the file. A component in
`AgentCard.tsx` is `AgentCard`; a hook in `useAgents.ts` is `useAgents`.

Rationale: the default export name is what every import site chooses, and the
filename is what search and the file tree show. When they disagree, neither
leads to the other — `import useTeam from "../hooks/useTeams"` in `agents.tsx`
is correct today and reads like a mistake, and grepping for `SettingsMenuWidget`
misses the component because it is actually spelled `SettingsMenuWigdet`.

Examples of **incorrect** code for this rule:

`src/widgets/SettingsMenuWidget/SettingsMenuWidget.tsx`

```tsx
function SettingsMenuWigdet({ open, onClose }) {
  return <Menu open={open} onClose={onClose} />;
}

export default SettingsMenuWigdet;
```

`src/hooks/useTeams.ts`

```ts
function useTeam() {
  return { getTeams, getTeamById, createTeam, updateTeam, deleteTeam };
}

export default useTeam;
```

Examples of **correct** code for this rule:

`src/hooks/useAgents.ts`

```ts
function useAgents() {
  return { getTeamAgents, createAgent, deleteAgent };
}

export default useAgents;
```

Thirteen files disagree today — ten components and three hooks. They are listed
in Appendix B. Renaming the export is usually the smaller change, but pick
whichever name is right for the thing and move the other to match.

---

### `naming/pascal-case-component-files`

**Severity: `warn`**

Files exporting a React component are `PascalCase.tsx`. Hooks are
`useThing.ts`. Everything else — utils, config, adapters — is `camelCase.ts`.

Rationale: the case is the fastest signal of what a file contains, and it is
consistent across all but three files in `src`.

Examples of **incorrect** code for this rule:

```
src/widgets/OrganizationChart/common/standard-node.tsx
src/widgets/OrganizationChart/common/simple-node.tsx
src/widgets/OrganizationChart/common/group-node.tsx
```

Examples of **correct** code for this rule:

```
src/widgets/OrganizationChart/common/StandardNode.tsx
src/components/BlueprintFlow/AIResponseNode.tsx
src/components/BlueprintFlow/flowAdapter.ts
src/hooks/useKnowledge.ts
src/utils/cleanIconName.ts
```

`AIResponseNode.tsx` is the precedent for flow-node components: same subsystem,
same purpose, PascalCase.

---

### `naming/domain-spelling`

**Severity: `warn`**

Directory, file, component and prop names spell the domain term correctly and use
the same word the hook and the API use.

Rationale: a misspelled name is unfindable. Someone looking for the statistics
widget searches `Statistics` — which matches `useStatistics` and
`GET /statistics` but not the `StaticsWidget` folder that renders it.

Examples of **incorrect** code for this rule:

```
src/widgets/DepartmantCharts/
src/widgets/StaticsWidget/StaticsWidget.tsx
src/components/ChatInput/MentiontText.tsx
```

with `SettingsMenuWigdet` as the exported component in `SettingsMenuWidget.tsx`.

Examples of **correct** code for this rule:

```
src/widgets/DepartmentCharts/
src/widgets/StatisticsWidget/StatisticsWidget.tsx
src/components/ChatInput/MentionText.tsx
```

matching `src/hooks/useStatistics.ts` and the `/statistics` endpoint it calls.

The team-versus-project split is a different thing and is not a spelling problem:
`useTeams` deliberately calls `/projects` and publishes `PROJECT_CREATED`,
because the API noun is `project` and the UI noun is `team`. Keep the API noun on
the wire and the UI noun in the interface, as that hook does.

---

### `hooks/default-export`

**Severity: `warn`**

A hook module default-exports its hook. Named exports are for the extra
helpers the module also provides.

Rationale: 26 of the 27 hooks default-export, so `import useThing from "../hooks/useThing"`
is the shape every call site expects. `useSocket` is the lone named export and
has to be imported differently for no reason.

Examples of **incorrect** code for this rule:

`src/hooks/useSocket.ts`

```ts
export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  return socketRef.current;
};
```

Examples of **correct** code for this rule:

`src/hooks/useChatSessions.ts`

```ts
export type StoredSession = {
  agentId: string;
  sessionId: string;
};

export const readSessions = (): StoredSession[] => {
  const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
};

export default function useChatSessions(agentId: string) {
  return { sessions, addSession };
}
```

The hook is the default; `readSessions` is a named export precisely because
`useSession` needs it outside a component, and types are named exports too.

---

### `ui/emotion-css-scoped-to-slate`

**Severity: `warn`**

`@emotion/css` and its `css` template literal are confined to the Slate editor
subtree under `src/components/ChatInput/`. Everywhere else styles with `sx`.

Rationale: Slate's leaf and element renderers hand you a `className`, not an MUI
component, so `sx` has nothing to attach to and a real class name is required.
That is a genuine constraint, not a preference — but it applies only there. Five
files use it today and all five are in `ChatInput/`; a sixth anywhere else would
be a second styling system.

Examples of **incorrect** code for this rule:

```tsx
import { css } from "@emotion/css";

function AgentCard({ agent }) {
  return (
    <Card
      className={css`
        border-radius: 8px;
        background: #161c24;
      `}
    >
      {agent.name}
    </Card>
  );
}
```

Examples of **correct** code for this rule:

`src/components/ChatInput/InlineChromiumBugFix.tsx`

```tsx
import { css } from "@emotion/css";

const InlineChromiumBugfix = () => (
  <span
    contentEditable={false}
    className={css`
      font-size: 0;
    `}
  >
    {String.fromCodePoint(160)}
  </span>
);
```

The zero-width span exists to work around a Chromium selection bug at inline-void
boundaries in `contentEditable`. Keep workarounds like this in one small named
component rather than inlining them at each call site — and note this one is
also a `naming/file-matches-default-export` case, since the file is
`InlineChromiumBugFix.tsx` and the export is `InlineChromiumBugfix`.

---

## 22. Event integrity and registration

### `event/publish-subscribe-pairing`

**Severity: `error`**

Every event name passed to `useEvent` is published by something — this app or
`@canmingir/link`. Every name passed to `publish` has at least one subscriber, or
is deliberately documented as broadcast-only.

Rationale: the event bus is untyped and silent. A subscription to a name nobody
publishes compiles, lints, renders, and simply never fires — which, because
subscriptions are refetch dependencies, means the screen quietly stops
refreshing. There is no error to notice.

This has already produced a user-visible bug.
`src/hooks/useAcquiredMCPs.ts` completes the OAuth exchange and publishes
`AUTHORIZED`, but the getter that lists acquired MCPs depends on
`MCP_UPDATED`, which nothing anywhere publishes. The variable name shows the
intent:

Examples of **incorrect** code for this rule:

`src/hooks/useAcquiredMCPs.ts`

```ts
const [authorized] = useEvent("MCP_UPDATED", null);

const getTokens = async (code: string, mcp, id: string, isTeam: boolean) => {
  const response = await http.post(`/mcps`, payload);

  publish("AUTHORIZED", {});

  return response.data;
};

const getAcquiredMCPs = useCallback(() => {
  const { data, loading, error } = Api(() => http.get(`/mcps/acquired`), [authorized]);
}, [authorized]);
```

Authorize an MCP and the list does not refresh, because `authorized` is bound to
a name that is never published.

Examples of **correct** code for this rule:

```ts
const [authorized] = useEvent("AUTHORIZED", null);

const getTokens = async (code: string, mcp, id: string, isTeam: boolean) => {
  const response = await http.post(`/mcps`, payload);

  publish("AUTHORIZED", { mcpId: mcp.id });

  return response.data;
};
```

`src/hooks/useAgents.ts` is the shape to copy — every name it subscribes to is
published by a mutation in the same module or by the platform:

```ts
const [agentUpdated] = useEvent("AGENT_UPDATED", null);
const [agentDeleted] = useEvent("AGENT_DELETED", null);
const [agentAdded] = useEvent("AGENT_ADDED", null);
const [teamSelected] = useEvent("PROJECT_SELECTED", { projectId: null });
```

To audit the whole bus, diff the two name sets — every `publish("NAME"` against
every `useEvent("NAME"` — and check anything unmatched against
`@canmingir/link` before treating it as dead. Appendix B lists what is dead
today.

---

### `event/no-publish-during-render`

**Severity: `error`**

`publish` is a side effect. Call it from an event handler, a mutation, or a
`useEffect` — never from the body of a hook or component that runs during
render.

Rationale: the `*_LOADED` broadcasts currently sit in the render path of their
getters:

```ts
const { data, loading, error, fetch } = Api(() => http.get(`/agents`), [...]);

if (data) {
  publish("AGENTS_LOADED", { agents: data });
}
```

`getTeamAgents()` runs on every render, so this republishes on every render for
as long as `data` is truthy. Nothing subscribes to `AGENTS_LOADED` today, so the
cost is only wasted work — but the moment anything does subscribe, that
subscriber re-renders, which republishes, which re-renders it again. The reason
these broadcasts appear harmless is precisely that they have no consumers.

Examples of **incorrect** code for this rule:

`src/hooks/useKnowledge.ts`

```ts
const getTeamKnowledges = (teamId: string, fetchState: DependencyArray = []) => {
  const { data, loading, error, fetch } = Api(
    () => (teamId ? http.get(`/knowledge?teamId=${teamId}`) : null),
    [teamId, ...eventDependencies, ...fetchState]
  );

  if (data) {
    publish("KNOWLEDGE_LOADED", { knowledge: data });
  }

  return { knowledges: data, loading, error, fetch };
};
```

Examples of **correct** code for this rule:

```ts
const getTeamKnowledges = (teamId: string, fetchState: DependencyArray = []) => {
  const { data, loading, error, fetch } = Api(
    () => (teamId ? http.get(`/knowledge?teamId=${teamId}`) : null),
    [teamId, ...eventDependencies, ...fetchState]
  );

  useEffect(() => {
    if (data) {
      publish("KNOWLEDGE_LOADED", { knowledge: data });
    }
  }, [data]);

  return { knowledges: data, loading, error, fetch };
};
```

Mutations are already correct, because they publish from an async handler rather
than from render:

```ts
const response = await http.delete(`/agents/${agentId}`);

if (response) {
  publish("AGENT_DELETED", { agentId });
}
```

Ten getters across `useAgents`, `useKnowledge`, `useTeams`, `useMCPs`,
`useAcquiredMCPs`, `useOrganizations`, `useOrganization`, `useCommunications`,
`useBlueprint` and `useTask` publish from render today. Adding a subscriber to
any of those names without moving the publish into an effect will loop.

---

### `data/default-empty-collections`

**Severity: `error`**

A getter that returns a collection defaults it to `[]`. A getter that returns a
single record may return `null`, and its consumers use optional chaining.

Rationale: `useApi` initialises `data` to `null` and leaves it `null` when a
request fails, so every consumer that calls `.map`, `.filter` or `.length`
without a guard throws. This is the crash documented in
[`app/error-boundary-at-route`](#apperror-boundary-at-route), and defaulting at
the hook boundary fixes it once for every consumer instead of at each call site.

Examples of **incorrect** code for this rule:

`src/hooks/useAgents.ts`

```ts
return {
  agents: data,
  loading,
  error,
  fetch,
};
```

which lets `AgentsWidget` reach `agents.map(...)` with `agents === null`.

Examples of **correct** code for this rule:

`src/hooks/useModelPricings.ts`

```ts
const getPricings = () => {
  const { data, loading, error, fetch } = Api(() => http.get("/model-pricings"), []);

  return {
    pricings: (data as ModelPricing[]) ?? [],
    loading,
    error,
    fetch,
  };
};
```

Applied to agents:

```ts
return {
  agents: (data as Agent[]) ?? [],
  loading,
  error,
  fetch,
};
```

`useModelPricings` is the only hook doing this today and it is the right
precedent. Single-record getters — `getTask`, `getTeamById`, `getAgent` — stay
nullable, which is why pages write `team?.name`.

---

### `event/platform-events-are-inbound`

**Severity: `warn`**

Events owned by `@canmingir/link` are subscribed to, not published. Treat them
as input from the shell.

Rationale: four names in use here originate in the platform package —
`PROJECT_SELECTED` from `layouts/common/ProjectBar`, `ITEM_SELECTED` from
`project/src/widgets/ProjectContainer`, `CONFIG_INITIALIZED` from `src/config/config.js`,
and `LOADED` from `src/http/index.js`, which drives the global progress bar.
Publishing one of them from the dashboard fakes a shell state change that the
shell itself does not know about, so the two disagree until the next real event.

Note that these arrive in the default namespace, using the one-argument form —
unlike `PLATFORM` / `PROJECT_BAR_DIALOG`, which is a two-way dialog channel and
uses the namespaced form described in
[`event/namespace-cross-app`](#eventnamespace-cross-app). Both patterns are real;
which one applies depends on the event, so check the platform source before
assuming.

Examples of **incorrect** code for this rule:

```tsx
const handleTeamChange = (teamId) => {
  storage.set("projectId", teamId);
  publish("PROJECT_SELECTED", { projectId: teamId });
};
```

Examples of **correct** code for this rule:

`src/hooks/useAgents.ts`

```ts
const [teamSelected] = useEvent("PROJECT_SELECTED", { projectId: null });

const getTeamAgents = (fetchState: DependencyArray = []) => {
  const eventDependencies = [agentUpdated, agentDeleted, agentAdded, teamSelected];

  const { data, loading, error, fetch } = Api(
    () => http.get(`/agents`),
    [...eventDependencies, ...fetchState]
  );
};
```

To ask the shell to change team, drive its UI — publish
`PLATFORM` / `PROJECT_BAR_DIALOG` and let `ProjectBar` publish
`PROJECT_SELECTED` when the user picks one.

---

### `route/register-in-routes-and-menu`

**Severity: `warn`**

A new destination is registered in both `routes.tsx` and `config.menu.js`. The
route decides what renders; the menu decides whether anyone can reach it.

Rationale: they are separate files with no shared source, so a route without a
menu entry is reachable only by typing the URL, and a menu entry without a route
navigates to a blank page. Both failures are invisible in review of a single
file.

Examples of **incorrect** code for this rule:

Adding to `routes.tsx` only:

```tsx
{ path: "/skills", element: <Skills /> },
```

Examples of **correct** code for this rule:

`routes.tsx` — nested under the layout the page belongs to:

```tsx
{
  layout: <DashboardLayout />,
  pages: [
    { path: "/agents", element: <Agents /> },
    { path: "/skills", element: <Skills /> },
  ],
},
```

`config.menu.js` — in the `sideMenu` items, with an Iconify name:

```js
{
  title: "Skills",
  icon: "solar:medal-ribbon-bold",
  path: "/skills",
},
```

External destinations set `external: true`, as the Documentation entry does.
`FullScreenLayout` routes such as `/chat` and `/team` still need a menu entry;
the layout choice is independent of discoverability. Widgets can also be mounted
straight into the shell chrome through `actionButtons`, which is how
`TeamChartButton` reaches the top bar — that import is written
`./src/widgets/TeamChartButton/index.ts`, extension and all, and should not be
copied; see
[`import/no-file-extensions`](#importno-file-extensions).

---

## Appendix A — Adding a feature

The order the layers get written in, using "agent skills" as the example.

1. **Hook** — `src/hooks/useSkills.ts`. Export the domain types. Subscribe to the
   events the getters depend on. Write `getAgentSkills(agentId, fetchState)`
   returning `{ skills, loading, error, fetch }`. Write `createSkill` /
   `deleteSkill` publishing `SKILL_CREATED` / `SKILL_DELETED`.
2. **Components** — `src/components/SkillCard/{SkillCard.tsx,index.ts,styles.ts}`,
   plus `src/components/Skeletons/SkillsSkeleton.tsx`. Props in, callbacks out,
   `data-cy` on every interactive element.
3. **Widget** — `src/widgets/SkillsWidget/SkillsWidget.tsx`. Call the getter at
   the top level, wrap `loading` in `useLoading`, render loading / error / empty,
   own the dialogs.
4. **Layout or page** — add a tab entry to `TABS` in `AgentLayout.tsx`, or add
   `src/pages/skills.tsx` rendering `<Page name>` + a layout + the widget.
5. **Route** — register the page in `routes.tsx` under the right layout. A
   top-level destination also needs a `sideMenu` entry in `config.menu.js`;
   without one the route resolves but is unreachable from the UI.
6. **Spec** — `cypress/e2e/skills.cy.ts` with fixtures under
   `cypress/fixtures/skills-page/`, selecting via `getBySel` and waiting on
   `SKILL_CREATED`.

`prepare.cjs` installs a git `pre-push` hook that runs `npm run lint` and
`npm test`, so the automated rules gate the push, not just CI.

## Appendix B — Known violations

Recorded so they are not mistaken for precedent. New code must not follow them.

| Rule | Files |
| --- | --- |
| `layer/no-data-access-in-components` | `components/BlueprintCard/BlueprintFlowMiniPreview.tsx`, `components/BlueprintDrawer/BlueprintDrawer.tsx`, `components/BlueprintFlow/BlueprintFlow.tsx`, `components/BlueprintMessageBox/BlueprintMessageBox.tsx`, `components/ChatInput/ChatInputCommandEditor.tsx`, `components/SupervisingCard/SupervisingCard.tsx`, `components/SupervisingChat/SupervisingChat.tsx`, `components/SupervisingTask/SupervisingTask.tsx` |
| `layer/no-upward-imports` | `components/BlueprintDrawer/BlueprintDrawer.tsx`, `components/BlueprintFlow/BlueprintFlowDialog.tsx`, `components/BlueprintKnowledge/BlueprintKnowledge.tsx`, `components/BlueprintSkill/BlueprintSkill.tsx`, `components/NucleoidLoginForm/NucleoidLoginForm.tsx`, `components/SocialLoginButtons/SocialLoginButtons.tsx`, `components/SupervisingChat/SupervisingChat.tsx`, `components/SupervisingTypeDialog/SupervisingTypeDialog.tsx` |
| `data/http-only-in-hooks` | `components/SupervisingCard/SupervisingCard.tsx`, `components/ChatInput/chat.config.ts` |
| `data/handle-async-states` | No widget currently renders the `error` returned by a getter. |
| `import/storage-over-local-storage` | `widgets/OrganizationChart/common/standard-node.tsx` |
| `test/data-cy-on-interactive` | `components/AgentCard/AgentCard.tsx` — the overflow `IconButton` has no `data-cy`, while `agents.cy.ts` selects `agent-card-more-vert`. |
| `dialog/callback-props-not-setters` | `components/DeleteConfirmation/DeleteConfirmation.tsx`, `components/AddItemDialog/AddItemDialog.tsx`, `components/FlowDialog/FlowDialog.tsx`, `components/IncomingDrawer/IncomingDrawer.tsx`, `components/ProfileCard/ProfileCard.tsx`, `components/BlueprintDrawer/BlueprintDrawer.tsx` (six setter props), `components/BlueprintFlow/BlueprintFlowDialog.tsx` |
| `ui/format-dates-with-helpers` | `components/KnowledgeTable/KnowledgeTable.tsx` (five call sites), `components/EditDialog/EditDialog.tsx` (two), `components/TaskDetails/TaskDetails.tsx` |
| `ui/iconify-and-clean-names` | `components/AddItemDialog/AddItemDialog.tsx` — inline `replace(/^:\|:$/g, "")` instead of `cleanIconName` |
| `component/named-function-default-export` | `components/ConfirmationDialog/ConfirmationDialog.tsx` and 84 other arrow-const components |
| `test/fixtures-track-renames` | All 11 `agents-page/*` fixtures referenced by `cypress/e2e/agents.cy.ts` and `agent.cy.ts` are missing; the files remain under `colleagues-page/` and `colleague/`. Those two specs cannot pass. |
| `deps/declare-what-you-import` | `react-apexcharts` is imported by `widgets/DepartmantCharts/{UsageChart,PerformanceChart,TotalIncomes}.tsx` and `widgets/WidgetSummary/WidgetSummary.tsx` but declared in no `package.json` here. Conversely `@mui/x-charts` is a declared devDependency imported by nothing. |
| `ui/sx-over-inline-style` | 60 `style={{` call sites against 1013 `sx={{`; `components/CodeBlock/CodeBlock.tsx` is the clearest case, hardcoding `#2e2e2e` and `#f8f8f2`. |
| `import/config-for-hosts` | `utils/hosts.ts` hardcodes `http://localhost:3004` and re-derives the origin instead of reading `config`. |
| `data/hook-return-shape` | `hooks/useMCPs.ts` getters omit `fetch` from their return and are each wrapped in `useCallback`, which disguises the fact that they are hooks — see `data/getters-are-hooks`. |
| `app/error-boundary-at-route` | No error boundary exists anywhere in `src`. `widgets/AgentsWidget/AgentsWidget.tsx:84` throws on a failed first fetch, which blanks the app — see the rule for the full path. |
| `state/no-module-level-mutable-singletons` | `components/PopChat/PopChat.tsx` — the module-scope `sub` object and the exported `handleAddResponseMessage` setter. |
| `deps/no-unused-declared` | `axios-retry` (dependency) and `@mui/x-charts` (devDependency) are imported by nothing in `src`. |
| `deps/no-dead-tooling` | `jest.config.ts` + `jest.setup.ts` with zero tests, an undeclared `@testing-library/jest-dom` import, and `npm test` pointing at Cypress; `prepare.cjs` with no `prepare` script; the unused `@/*` alias in `tsconfig.json`. |
| `import/one-declaration-per-module` | `components/PopChat/PopChat.tsx` (five declarations of one module), `widgets/TeamChart/TeamChart.tsx`, `components/KnowledgeTable/KnowledgeTable.tsx`, `components/AddItemDialog/AddItemDialog.tsx` (two each). |
| `data/sample-data-at-module-scope` | `widgets/OrganizationChart/Content.tsx` — the inline `manager` placeholder record. |
| `a11y/icon-button-needs-label` | All 51 `<IconButton>` instances in `src`. None has an `aria-label`. |
| `a11y/dialog-labelled-by` | Every dialog except `components/ConfirmationDialog/ConfirmationDialog.tsx`. |
| `lint/no-blanket-disable` | `components/SupervisingChat/SupervisingChat.tsx:1` and `widgets/ChatInput/ChatInput.tsx:4` — bare `/* eslint-disable */`, removing both files from the only gate CI runs. |
| `story/theme-decorator-in-preview` | `.storybook/preview.ts` provides no theme, so every story renders against MUI defaults rather than the app palette. |
| `story/cover-presentational-components` | Two story files (`Form.stories.ts`, `colors.stories.mdx`) against roughly ninety component folders. |
| `import/no-file-extensions` | 26 sites, every one naming a `.js`/`.jsx` extension for a `.ts`/`.tsx` file. `widgets/ChatInput/ChatInput.tsx` does it three times for one module. |
| `component/barrel-is-index` | `components/TextFieldWithTitle/TextFieldWithTitle.ts`, `components/TitleBar/TitleBar.ts`. |
| `deps/no-unused-declared` | Also `vite-plugin-svgr` and `vite-plugin-checker` — neither is referenced by `vite.config.ts` or anything in `src`, and `vite-plugin-checker` sits in `dependencies` rather than `devDependencies`. |
| `ui/iconify-and-clean-names` | Also `components/SourcedAvatar/SourcedAvatar.tsx` — inline `iconUrl?.replace(/:/g, "")`, a third variant of the colon-stripping logic that strips every colon rather than only the outer ones. |
| `react/no-index-keys-for-data` | `components/KnowledgeTable/KnowledgeTable.tsx:128` — `key={index}` over a paginated, filtered `slice` of real rows. Of 32 index-key sites, the skeleton placeholders are fine; the data lists are not. |
| `naming/file-matches-default-export` | Components: `ChatInput/InlineChromiumBugFix.tsx` → `InlineChromiumBugfix`, `ChatInput/MentiontText.tsx` → `MentionText`, `MoreButton/MoreButton.tsx` → `MoreVertButton`, `Tabs/Tabs.tsx` → `TabBar`, `AddItemForm/AddItemForm.tsx` → `NewItemForm`, `OrganizationChart/Content.tsx` → `OrganizationalChart`, `OrganizationChart/common/standard-node.tsx` → `StandardNode`, `SettingsMenuWidget/SettingsMenuWidget.tsx` → `SettingsMenuWigdet`, `TeamChartButton/TeamChartButton.tsx` → `OrganizationButton`, `WidgetSummary/WidgetSummary.tsx` → `WidgetSummaryWidget`. Hooks: `useTeams.ts` → `useTeam`, `useSupervise.ts` → `useSupervising`, plus `useSocket.ts` under `hooks/default-export`. |
| `naming/pascal-case-component-files` | `widgets/OrganizationChart/common/{standard,simple,group}-node.tsx`. |
| `naming/domain-spelling` | `widgets/DepartmantCharts/`, `widgets/StaticsWidget/` (against `useStatistics` and `GET /statistics`), `components/ChatInput/MentiontText.tsx`, and the `SettingsMenuWigdet` export. |
| `hooks/default-export` | `hooks/useSocket.ts` — the only named-export hook of 27. |
| `deps/no-unused-declared` | Also `@monaco-editor/react`, a `dependencies` entry imported nowhere in `src`. |
| `event/publish-subscribe-pairing` | **Dead subscriptions** (no publisher in `src` or in `@canmingir/link`): `MCP_UPDATED` in `hooks/useAcquiredMCPs.ts:31` — the module publishes `AUTHORIZED` instead, so acquired MCPs never refetch after authorization; `KNOWLEDGE_UPDATED` in `hooks/useKnowledge.ts:37`, used as a dependency by three getters; `TEAM_SELECTED` in `hooks/useOrganization.ts:11`; and `API_TYPE_ADD`, `API_TYPE_DELETE`, `API_TYPE_RENAME`, `API_RESOURCE_DELETE` in `widgets/APITab/`, which is beta-gated off. **Broadcast with no consumer anywhere**: all 28 published names, including every `*_LOADED` and `AUTHORIZED`. |
| `event/no-publish-during-render` | Ten getters publish `*_LOADED` from the render path — `useAgents`, `useKnowledge`, `useTeams`, `useMCPs`, `useAcquiredMCPs`, `useOrganizations`, `useOrganization`, `useCommunications`, `useBlueprint`, `useTask`. Harmless only because nothing subscribes. |
| `data/default-empty-collections` | Every collection getter except `useModelPricings.getPricings`, which is the correct precedent. |

### Divergences that are not yet rules

Two competing conventions exist where the catalog picks one. Recorded so the
choice is visible rather than silently re-litigated per PR.

- **Mutation return shape.** `data/mutations-swallow-and-return-null` follows
  `useAgents` / `useTeams`, which return `response?.data` or `null`.
  `useBlueprint` instead returns a wrapper on every mutation —
  `{ Blueprint: response?.data }` from `createBlueprint`, `upsertBlueprint`,
  `patchBlueprint` and `removeBlueprint`, and `{ description, skill }` from
  `generate`. Both work; the unwrapped form is the majority and is what new hooks
  should use.
- **Confirmation dialogs.** `ConfirmationDialog` (callback props) and
  `DeleteConfirmation` (setter props) do the same job with incompatible APIs.
  `dialog/callback-props-not-setters` selects the former.

## Related documents

- `.github/copilot-instructions.md` — the layer boundaries as review instructions
- `.github/copilot-reviewer-instructions.md` — PR checklist and severity guide
- `.eslintrc.json` — the automated subset
