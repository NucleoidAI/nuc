# Dashboard Architecture — Rule Catalog

## Contents

- [Contents](#contents)
- [1. Layer boundaries](#1-layer-boundaries)
  - [`layer/no-data-access-in-components`](#layerno-data-access-in-components)
  - [`layer/no-upward-imports`](#layerno-upward-imports)
  - [`layer/widgets-own-orchestration`](#layerwidgets-own-orchestration)
  - [`layer/layouts-stay-structural`](#layerlayouts-stay-structural)
  - [`layer/pages-are-containers`](#layerpages-are-containers)
- [2. Data access](#2-data-access)
  - [`data/http-only-in-hooks`](#datahttp-only-in-hooks)
  - [`data/no-direct-axios`](#datano-direct-axios)
  - [`data/use-api-for-reads`](#datause-api-for-reads)
  - [`data/getters-are-hooks`](#datagetters-are-hooks)
  - [`data/hook-return-shape`](#datahook-return-shape)
  - [`data/mutations-swallow-and-return-null`](#datamutations-swallow-and-return-null)
  - [`data/handle-async-states`](#datahandle-async-states)
  - [`data/use-loading-for-refetch`](#datause-loading-for-refetch)
- [3. Events](#3-events)
  - [`event/naming`](#eventnaming)
  - [`event/publish-after-mutation`](#eventpublish-after-mutation)
  - [`event/subscribe-as-fetch-dependency`](#eventsubscribe-as-fetch-dependency)
  - [`event/namespace-cross-app`](#eventnamespace-cross-app)
- [4. Component authoring](#4-component-authoring)
  - [`component/named-function-default-export`](#componentnamed-function-default-export)
  - [`component/folder-and-barrel`](#componentfolder-and-barrel)
  - [`component/inline-prop-types`](#componentinline-prop-types)
  - [`component/styles-module`](#componentstyles-module)
  - [`component/theme-tokens`](#componenttheme-tokens)
- [5. Imports and configuration](#5-imports-and-configuration)
  - [`import/sort-order`](#importsort-order)
  - [`import/no-mui-loading-button`](#importno-mui-loading-button)
  - [`import/config-for-hosts`](#importconfig-for-hosts)
  - [`import/storage-over-local-storage`](#importstorage-over-local-storage)
- [6. Testing](#6-testing)
  - [`test/data-cy-on-interactive`](#testdata-cy-on-interactive)
  - [`test/select-by-data-cy`](#testselect-by-data-cy)
  - [`test/await-domain-events`](#testawait-domain-events)
- [7. Forms and dialogs](#7-forms-and-dialogs)
  - [`form/rhf-with-yup-resolver`](#formrhf-with-yup-resolver)
  - [`form/submit-button-state`](#formsubmit-button-state)
  - [`form/reset-after-submit`](#formreset-after-submit)
  - [`dialog/callback-props-not-setters`](#dialogcallback-props-not-setters)
  - [`dialog/guard-close-while-submitting`](#dialogguard-close-while-submitting)
  - [`dialog/stacked-z-index`](#dialogstacked-z-index)
- [8. Effects and lifecycle](#8-effects-and-lifecycle)
  - [`effect/clear-timers`](#effectclear-timers)
  - [`effect/unregister-socket-handlers`](#effectunregister-socket-handlers)
  - [`effect/scoped-deps-disable`](#effectscoped-deps-disable)
- [9. TypeScript](#9-typescript)
  - [`ts/explicit-types-under-non-strict`](#tsexplicit-types-under-non-strict)
  - [`ts/relative-imports`](#tsrelative-imports)
- [10. Presentation primitives](#10-presentation-primitives)
  - [`ui/platform-table-primitives`](#uiplatform-table-primitives)
  - [`ui/format-dates-with-helpers`](#uiformat-dates-with-helpers)
  - [`ui/iconify-and-clean-names`](#uiiconify-and-clean-names)
  - [`ui/skeleton-per-screen`](#uiskeleton-per-screen)
- [11. Pure modules and the flow subsystem](#11-pure-modules-and-the-flow-subsystem)
  - [`pure/react-free-modules`](#purereact-free-modules)
  - [`pure/export-style`](#pureexport-style)
  - [`flow/adapter-owns-translation`](#flowadapter-owns-translation)
  - [`flow/validate-before-save`](#flowvalidate-before-save)
- [12. Content rendering](#12-content-rendering)
  - [`content/markdown-through-renderer`](#contentmarkdown-through-renderer)
  - [`content/restrict-dangerous-html`](#contentrestrict-dangerous-html)
  - [`ui/sx-over-inline-style`](#uisx-over-inline-style)
  - [`ui/deterministic-per-entity-visuals`](#uideterministic-per-entity-visuals)
- [13. Dependencies, charts and external windows](#13-dependencies-charts-and-external-windows)
  - [`deps/declare-what-you-import`](#depsdeclare-what-you-import)
  - [`chart/options-through-use-chart`](#chartoptions-through-use-chart)
  - [`auth/postmessage-explicit-origin`](#authpostmessage-explicit-origin)
  - [`auth/read-tokens-from-link-namespace`](#authread-tokens-from-link-namespace)
  - [`chat/commands-are-data`](#chatcommands-are-data)
- [14. Cypress infrastructure](#14-cypress-infrastructure)
  - [`test/fixtures-track-renames`](#testfixtures-track-renames)
  - [`test/typed-custom-commands`](#testtyped-custom-commands)
  - [`test/intercepts-in-named-commands`](#testintercepts-in-named-commands)
  - [`test/fixture-layout`](#testfixture-layout)
- [15. App robustness and shared state](#15-app-robustness-and-shared-state)
  - [`app/error-boundary-at-route`](#apperror-boundary-at-route)
  - [`state/no-module-level-mutable-singletons`](#stateno-module-level-mutable-singletons)
  - [`app/page-sets-document-title`](#apppage-sets-document-title)
  - [`state/query-string-for-shareable-view-state`](#statequery-string-for-shareable-view-state)
- [16. Tooling hygiene](#16-tooling-hygiene)
  - [`deps/no-unused-declared`](#depsno-unused-declared)
  - [`deps/no-dead-tooling`](#depsno-dead-tooling)
  - [`import/one-declaration-per-module`](#importone-declaration-per-module)
  - [`data/sample-data-at-module-scope`](#datasample-data-at-module-scope)
- [17. Accessibility](#17-accessibility)
  - [`a11y/icon-button-needs-label`](#a11yicon-button-needs-label)
  - [`a11y/dialog-labelled-by`](#a11ydialog-labelled-by)
- [18. Storybook, resolution and lint scope](#18-storybook-resolution-and-lint-scope)
  - [`lint/no-blanket-disable`](#lintno-blanket-disable)
  - [`story/theme-decorator-in-preview`](#storytheme-decorator-in-preview)
  - [`import/no-file-extensions`](#importno-file-extensions)
  - [`component/barrel-is-index`](#componentbarrel-is-index)
  - [`story/cover-presentational-components`](#storycover-presentational-components)
- [19. Naming and React correctness](#19-naming-and-react-correctness)
  - [`react/no-index-keys-for-data`](#reactno-index-keys-for-data)
  - [`naming/file-matches-default-export`](#namingfile-matches-default-export)
  - [`naming/pascal-case-component-files`](#namingpascal-case-component-files)
  - [`naming/domain-spelling`](#namingdomain-spelling)
  - [`hooks/default-export`](#hooksdefault-export)
  - [`ui/emotion-css-scoped-to-slate`](#uiemotion-css-scoped-to-slate)
- [20. Event integrity and registration](#20-event-integrity-and-registration)
  - [`event/publish-subscribe-pairing`](#eventpublish-subscribe-pairing)
  - [`event/no-publish-during-render`](#eventno-publish-during-render)
  - [`data/default-empty-collections`](#datadefault-empty-collections)
  - [`event/platform-events-are-inbound`](#eventplatform-events-are-inbound)
  - [`route/register-in-routes-and-menu`](#routeregister-in-routes-and-menu)

---

## Contents

- [1. Layer boundaries](#1-layer-boundaries)
  - [`layer/no-data-access-in-components`](#layerno-data-access-in-components)
  - [`layer/no-upward-imports`](#layerno-upward-imports)
  - [`layer/widgets-own-orchestration`](#layerwidgets-own-orchestration)
  - [`layer/layouts-stay-structural`](#layerlayouts-stay-structural)
  - [`layer/pages-are-containers`](#layerpages-are-containers)
- [2. Data access](#2-data-access)
  - [`data/http-only-in-hooks`](#datahttp-only-in-hooks)
  - [`data/no-direct-axios`](#datano-direct-axios)
  - [`data/use-api-for-reads`](#datause-api-for-reads)
  - [`data/getters-are-hooks`](#datagetters-are-hooks)
  - [`data/hook-return-shape`](#datahook-return-shape)
  - [`data/mutations-swallow-and-return-null`](#datamutations-swallow-and-return-null)
  - [`data/handle-async-states`](#datahandle-async-states)
  - [`data/use-loading-for-refetch`](#datause-loading-for-refetch)
- [3. Events](#3-events)
  - [`event/naming`](#eventnaming)
  - [`event/publish-after-mutation`](#eventpublish-after-mutation)
  - [`event/subscribe-as-fetch-dependency`](#eventsubscribe-as-fetch-dependency)
  - [`event/namespace-cross-app`](#eventnamespace-cross-app)
- [4. Component authoring](#4-component-authoring)
  - [`component/named-function-default-export`](#componentnamed-function-default-export)
  - [`component/folder-and-barrel`](#componentfolder-and-barrel)
  - [`component/inline-prop-types`](#componentinline-prop-types)
  - [`component/styles-module`](#componentstyles-module)
  - [`component/theme-tokens`](#componenttheme-tokens)
- [5. Imports and configuration](#5-imports-and-configuration)
  - [`import/sort-order`](#importsort-order)
  - [`import/no-mui-loading-button`](#importno-mui-loading-button)
  - [`import/config-for-hosts`](#importconfig-for-hosts)
  - [`import/storage-over-local-storage`](#importstorage-over-local-storage)
- [6. Testing](#6-testing)
  - [`test/data-cy-on-interactive`](#testdata-cy-on-interactive)
  - [`test/select-by-data-cy`](#testselect-by-data-cy)
  - [`test/await-domain-events`](#testawait-domain-events)
- [7. Forms and dialogs](#7-forms-and-dialogs)
  - [`form/rhf-with-yup-resolver`](#formrhf-with-yup-resolver)
  - [`form/submit-button-state`](#formsubmit-button-state)
  - [`form/reset-after-submit`](#formreset-after-submit)
  - [`dialog/callback-props-not-setters`](#dialogcallback-props-not-setters)
  - [`dialog/guard-close-while-submitting`](#dialogguard-close-while-submitting)
  - [`dialog/stacked-z-index`](#dialogstacked-z-index)
- [8. Effects and lifecycle](#8-effects-and-lifecycle)
  - [`effect/clear-timers`](#effectclear-timers)
  - [`effect/unregister-socket-handlers`](#effectunregister-socket-handlers)
  - [`effect/scoped-deps-disable`](#effectscoped-deps-disable)
- [9. TypeScript](#9-typescript)
  - [`ts/explicit-types-under-non-strict`](#tsexplicit-types-under-non-strict)
  - [`ts/relative-imports`](#tsrelative-imports)
- [10. Presentation primitives](#10-presentation-primitives)
  - [`ui/platform-table-primitives`](#uiplatform-table-primitives)
  - [`ui/format-dates-with-helpers`](#uiformat-dates-with-helpers)
  - [`ui/iconify-and-clean-names`](#uiiconify-and-clean-names)
  - [`ui/skeleton-per-screen`](#uiskeleton-per-screen)
- [11. Pure modules and the flow subsystem](#11-pure-modules-and-the-flow-subsystem)
  - [`pure/react-free-modules`](#purereact-free-modules)
  - [`pure/export-style`](#pureexport-style)
  - [`flow/adapter-owns-translation`](#flowadapter-owns-translation)
  - [`flow/validate-before-save`](#flowvalidate-before-save)
- [12. Content rendering](#12-content-rendering)
  - [`content/markdown-through-renderer`](#contentmarkdown-through-renderer)
  - [`content/restrict-dangerous-html`](#contentrestrict-dangerous-html)
  - [`ui/sx-over-inline-style`](#uisx-over-inline-style)
  - [`ui/deterministic-per-entity-visuals`](#uideterministic-per-entity-visuals)
- [13. Dependencies, charts and external windows](#13-dependencies-charts-and-external-windows)
  - [`deps/declare-what-you-import`](#depsdeclare-what-you-import)
  - [`chart/options-through-use-chart`](#chartoptions-through-use-chart)
  - [`auth/postmessage-explicit-origin`](#authpostmessage-explicit-origin)
  - [`auth/read-tokens-from-link-namespace`](#authread-tokens-from-link-namespace)
  - [`chat/commands-are-data`](#chatcommands-are-data)
- [14. Cypress infrastructure](#14-cypress-infrastructure)
  - [`test/fixtures-track-renames`](#testfixtures-track-renames)
  - [`test/typed-custom-commands`](#testtyped-custom-commands)
  - [`test/intercepts-in-named-commands`](#testintercepts-in-named-commands)
  - [`test/fixture-layout`](#testfixture-layout)
- [15. App robustness and shared state](#15-app-robustness-and-shared-state)
  - [`app/error-boundary-at-route`](#apperror-boundary-at-route)
  - [`state/no-module-level-mutable-singletons`](#stateno-module-level-mutable-singletons)
  - [`app/page-sets-document-title`](#apppage-sets-document-title)
  - [`state/query-string-for-shareable-view-state`](#statequery-string-for-shareable-view-state)
- [16. Tooling hygiene](#16-tooling-hygiene)
  - [`deps/no-unused-declared`](#depsno-unused-declared)
  - [`deps/no-dead-tooling`](#depsno-dead-tooling)
  - [`import/one-declaration-per-module`](#importone-declaration-per-module)
  - [`data/sample-data-at-module-scope`](#datasample-data-at-module-scope)
- [17. Accessibility](#17-accessibility)
  - [`a11y/icon-button-needs-label`](#a11yicon-button-needs-label)
  - [`a11y/dialog-labelled-by`](#a11ydialog-labelled-by)
- [18. Storybook, resolution and lint scope](#18-storybook-resolution-and-lint-scope)
  - [`lint/no-blanket-disable`](#lintno-blanket-disable)
  - [`story/theme-decorator-in-preview`](#storytheme-decorator-in-preview)
  - [`import/no-file-extensions`](#importno-file-extensions)
  - [`component/barrel-is-index`](#componentbarrel-is-index)
  - [`story/cover-presentational-components`](#storycover-presentational-components)
- [19. Naming and React correctness](#19-naming-and-react-correctness)
  - [`react/no-index-keys-for-data`](#reactno-index-keys-for-data)
  - [`naming/file-matches-default-export`](#namingfile-matches-default-export)
  - [`naming/pascal-case-component-files`](#namingpascal-case-component-files)
  - [`naming/domain-spelling`](#namingdomain-spelling)
  - [`hooks/default-export`](#hooksdefault-export)
  - [`ui/emotion-css-scoped-to-slate`](#uiemotion-css-scoped-to-slate)
- [20. Event integrity and registration](#20-event-integrity-and-registration)
  - [`event/publish-subscribe-pairing`](#eventpublish-subscribe-pairing)
  - [`event/no-publish-during-render`](#eventno-publish-during-render)
  - [`data/default-empty-collections`](#datadefault-empty-collections)
  - [`event/platform-events-are-inbound`](#eventplatform-events-are-inbound)
  - [`route/register-in-routes-and-menu`](#routeregister-in-routes-and-menu)

---

## 1. Layer boundaries

### `layer/no-data-access-in-components`

**Severity: `error`**

Files under `src/components/` must not import from `src/hooks/`, must not import
`@canmingir/link/platform/http`, and must not fetch — they receive data and
callbacks through props.

Components are the only reusable layer. A component that fetches its
own data can be mounted exactly once per screen, cannot be driven from Storybook,
and cannot be tested without a network stub.

Incorrect:

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

Incorrect:

```tsx
import useAgents from "../../hooks/useAgents";

function AgentCard({ agentId }) {
  const { getAgent } = useAgents();
  const { agent } = getAgent(agentId);

  return <Card>{agent?.name}</Card>;
}
```

Incorrect:

```tsx
import useKnowledge from "../../hooks/useKnowledge";

function KnowledgeTable({ rows }) {
  const { deleteKnowledge } = useKnowledge();

  return rows.map((row) => (
    <TableRow key={row.id}>
      <TableCell>
        <IconButton onClick={() => deleteKnowledge(row.id)}>
          <Iconify icon="solar:trash-bin-trash-bold" />
        </IconButton>
      </TableCell>
    </TableRow>
  ));
}
```

Importing a hook for its mutation is the same violation as importing it for its
data — the component now needs a live API to render.

Correct:

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

Correct:

```tsx
function KnowledgeTable({
  rows,
  onDelete,
}: {
  rows: { id: string; type: string }[];
  onDelete: (id: string) => void;
}) {
  return rows.map((row) => (
    <TableRow key={row.id}>
      <TableCell>
        <IconButton onClick={() => onDelete(row.id)} aria-label="Delete item">
          <Iconify icon="solar:trash-bin-trash-bold" />
        </IconButton>
      </TableCell>
    </TableRow>
  ));
}
```

Correct:

```tsx
function SupervisingCard({
  supervise,
  usedNodeIds,
}: {
  supervise: { id: string; question: string };
  usedNodeIds?: Set<string>;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card onClick={() => setExpanded((open) => !open)}>{usedNodeIds?.size}</Card>
  );
}
```

**Allowed in components:** UI-local `useState` (open/closed, hover, input value),
`useTheme`, `usePopover`, `useTable`, and `useEvent` when the component is
reacting to a global UI signal rather than fetching.

---

### `layer/no-upward-imports`

**Severity: `error`**

A layer may only import downward: `components/` must not import from `widgets/`,
and nothing outside `pages/` may import from `pages/`.

An upward import makes the two layers one layer. `components/` stops
being safe to reuse, and the dependency graph acquires cycles that break tree
shaking and Storybook isolation.

Incorrect:

```tsx
import Knowledge from "../../widgets/Knowledge/Knowledge";

function BlueprintKnowledge({ blueprintId, agentId }) {
  return <Knowledge blueprintId={blueprintId} agentId={agentId} />;
}
```

Incorrect:

```tsx
import Agents from "../../pages/agents";

function AgentsWidget({ teamId }) {
  return <Agents teamId={teamId} />;
}
```

Incorrect:

```tsx
import AgentLayout from "../../layouts/AgentLayout";

function AgentCard({ agent }) {
  return <AgentLayout agent={agent} />;
}
```

A component reaching for a layout inverts the whole graph — the layout already
mounts widgets, which mount this component.

Correct:

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

Correct:

```tsx
import BlueprintKnowledge from "../../components/BlueprintKnowledge";
import Knowledge from "../Knowledge/Knowledge";

function BlueprintWidget({ agentId, blueprintId }) {
  return (
    <>
      <BlueprintKnowledge blueprintId={blueprintId} />
      <Knowledge agentId={agentId} blueprintId={blueprintId} />
    </>
  );
}
```

Correct:

```tsx
import AgentLayout from "../layouts/AgentLayout";
import useAgent from "../hooks/useAgent";

function Agent() {
  const { id } = useParams();
  const { agent, loading } = useAgent().getAgent(id);

  return <AgentLayout agent={agent} loading={loading} />;
}
```

The composition happens in the layer that is allowed to see both — a layout, a
widget, or a page — not inside a component.

---

### `layer/widgets-own-orchestration`

**Severity: `error`**

Widgets are the only layer that combines data hooks, local state machines,
dialogs and user intent, so a widget that only forwards props to one component
without adding orchestration should be deleted and the component used directly.

This is the layer where a feature is assembled. Concentrating the
assembly makes behaviour changes single-file changes.

Incorrect:

```tsx
function AgentsWidget({ agents, onDelete }) {
  return <AgentGrid agents={agents} onDelete={onDelete} />;
}
```

Incorrect:

```tsx
function KnowledgeWidget({ agentId, teamId, blueprintId, onItemAdded }) {
  return (
    <Knowledge
      agentId={agentId}
      teamId={teamId}
      blueprintId={blueprintId}
      onItemAdded={onItemAdded}
    />
  );
}
```

Every prop forwarded unchanged and nothing added — the layer exists only as a
rename.

Incorrect:

```tsx
function TasksWidget({ agentId }) {
  const { tasks } = useTasks().getAgentTasks(agentId);

  return <TaskList tasks={tasks} />;
}

function Tasks() {
  const [selectedTask, setSelectedTask] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { deleteTask } = useTasks();

  return (
    <>
      <TasksWidget agentId={agentId} />
      <ConfirmationDialog
        open={dialogOpen}
        onConfirm={() => deleteTask(selectedTask.id)}
      />
    </>
  );
}
```

The orchestration moved up into the page instead of into the widget.

Correct:

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

Correct:

```tsx
function TasksWidget({ agentId }) {
  const [selectedTask, setSelectedTask] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { getAgentTasks, deleteTask } = useTasks();
  const { tasks, loading, error } = getAgentTasks(agentId);

  const isLoading = useLoading(loading);

  if (isLoading) {
    return <TasksSkeleton />;
  }

  if (error) {
    return <Typography color="error.main">{error}</Typography>;
  }

  return (
    <>
      <TaskList
        tasks={tasks}
        onSelect={setSelectedTask}
        onDelete={(task) => {
          setSelectedTask(task);
          setDialogOpen(true);
        }}
      />
      <ConfirmationDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={() => deleteTask(selectedTask.id)}
      />
    </>
  );
}
```

---

### `layer/layouts-stay-structural`

**Severity: `error`**

Layouts compose regions, tabs and slots, and must not call data hooks or
mutations.

Layouts are shared across routes. A mutation inside a layout fires on
every route that uses it.

Incorrect:

```tsx
function AgentLayout({ agentId }) {
  const { deleteAgent } = useAgents();
  const { agent } = useAgent().getAgent(agentId);

  return <Box>{agent?.name}</Box>;
}
```

Incorrect:

```tsx
function DashboardLayout({ children }) {
  const { getStatistics } = useStatistics();
  const { statistics } = getStatistics();

  return (
    <Box>
      <TopBar usage={statistics?.usage} />
      {children}
    </Box>
  );
}
```

`DashboardLayout` wraps every route, so this fetches statistics on every screen
in the app.

Incorrect:

```tsx
function SingleScrollableLayout({ title, children }) {
  const { updateTeam } = useTeams();

  useEffect(() => {
    updateTeam({ lastVisitedAt: new Date().toISOString() });
  }, []);

  return <Stack>{children}</Stack>;
}
```

A mutation in a shared layout fires on every route that uses it.

Correct:

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

Correct:

```tsx
function SingleScrollableLayout({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <Stack sx={{ height: "100%", overflowY: "auto" }}>
      <Typography variant="h4">{title}</Typography>
      {children}
    </Stack>
  );
}
```

Correct:

```tsx
function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [projectBar] = useEvent("PLATFORM", "PROJECT_BAR_DIALOG", {
    open: false,
  });

  return (
    <Box sx={{ display: "flex" }}>
      <SideMenu open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      {children}
    </Box>
  );
}
```

Tab state, drawer state, query-string sync and `useEvent` for UI signals are
structural and belong here. Fetching `agent` does not — the page passes it in.

---

### `layer/pages-are-containers`

**Severity: `error`**

A page resolves route params and storage keys, renders `<Page name>`, picks a
layout and mounts widgets, while feature UI belongs in widgets and components.

Pages are the routing contract in `routes.tsx`. Keeping them thin
means a route can be re-pointed without moving feature code.

Incorrect:

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

Incorrect:

```tsx
function KnowledgeBase() {
  const teamId = storage.get("projectId");

  const { getTeamKnowledges, deleteKnowledge } = useKnowledge();
  const { knowledges } = getTeamKnowledges(teamId);

  const [selectedType, setSelectedType] = useState("ALL");

  const filtered =
    selectedType === "ALL"
      ? knowledges
      : knowledges.filter((k) => k.type === selectedType);

  return <KnowledgeTable rows={filtered} onDelete={deleteKnowledge} />;
}
```

Filtering, selection state and the delete intent are the feature — they belong in
`widgets/Knowledge`.

Incorrect:

```tsx
function Cost() {
  return <CostWidget />;
}
```

No `<Page name>`, so the browser tab keeps the previous route's title.

Correct:

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

Correct:

```tsx
function KnowledgeBase() {
  const teamId = storage.get("projectId");

  return (
    <>
      <Page name={"Knowledge Base"} />
      <SingleScrollableLayout title={"Knowledge Base"}>
        <Knowledge teamId={teamId} />
      </SingleScrollableLayout>
    </>
  );
}
```

Correct:

```tsx
function Cost() {
  return (
    <>
      <Page name={"Cost"} />
      <SingleScrollableLayout title={"Cost"}>
        <CostWidget />
      </SingleScrollableLayout>
    </>
  );
}
```

A page may call one hook to resolve the entity that names the screen. It must not
own the feature's dialogs or lists.

---

## 2. Data access

### `data/http-only-in-hooks`

**Severity: `error`**

`@canmingir/link/platform/http` may only be imported from `src/hooks/**`, and
every other layer reaches the network through a hook.

Hooks are where cache invalidation lives. An `http` call outside a
hook never participates in the event-dependency refetch chain, so its data goes
stale the moment anything else mutates the same resource.

Incorrect:

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

Incorrect:

```tsx
import http from "@canmingir/link/platform/http";

function SupervisingCard({ supervise }) {
  const handleAnswer = async (answer: string) => {
    await http.patch(`/supervisings/${supervise.id}`, { answer });
  };

  return <AnswerForm onSubmit={handleAnswer} />;
}
```

Incorrect:

```ts
export const fetchSteps = (taskId: string) =>
  http.get(`/tasks/${taskId}/steps`).then((res) => res.data);
```

A util that reaches the network is outside every hook's dependency chain, so
nothing refetches it when a step changes.

Correct:

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

Correct:

```ts
function useSupervising() {
  const { Api } = useApi();

  const answerSupervising = async (supervisingId: string, answer: string) => {
    try {
      const response = await http.patch(`/supervisings/${supervisingId}`, {
        answer,
      });

      if (response && response.data) {
        publish("SUPERVISING_ANSWERED", { supervisingId });
      }

      return response?.data;
    } catch (error) {
      return null;
    }
  };

  return { answerSupervising };
}
```

Correct:

```tsx
function SupervisingWidget({ agentId }) {
  const { getSupervisings, answerSupervising } = useSupervising();
  const { supervisings } = getSupervisings(agentId);

  return supervisings.map((supervise) => (
    <SupervisingCard
      key={supervise.id}
      supervise={supervise}
      onAnswer={(answer) => answerSupervising(supervise.id, answer)}
    />
  ));
}
```

---

### `data/no-direct-axios`

**Severity: `error`**

`src/http/user.ts` is the only module allowed to `import axios`, because it
attaches the identity-provider interceptor; everything else uses `platform/http`
inside a hook.

A second axios instance does not carry the `Authorization`
interceptor, so requests silently go out unauthenticated.

Incorrect:

```ts
import axios from "axios";

function useStatistics() {
  const getStatistics = () => axios.get(`${config.api}/statistics`);
  return { getStatistics };
}
```

Incorrect:

```ts
import axios from "axios";

const client = axios.create({ baseURL: config.api });

export default client;
```

A second instance in a shared module is the same problem multiplied — every
consumer of it goes out unauthenticated.

Incorrect:

```ts
const response = await fetch(`${config.api}/statistics`);
const statistics = await response.json();
```

`fetch` bypasses the interceptor just as thoroughly as a second axios instance.

Correct:

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

Correct:

```ts
import axios from "axios";

const refreshToken = await storage.get("link", "refreshToken");

const { data } = await axios.post(`${config.oauth.tokenUrl}`, { refreshToken });
```

`src/http/user.ts` is the one module allowed to import axios, because it is the
module that attaches the identity-provider interceptor in the first place.

---

### `data/use-api-for-reads`

**Severity: `error`**

Reads go through `useApi().Api(apiCall, dependencies)` rather than a hand-rolled
`useState` + `useEffect` + `try/catch` for a GET.

`Api` is the shared contract for `data`, `loading`, `error` and
`fetch`, and it normalises the error to
`err.response?.data?.message || err.message`. A hand-rolled fetch produces a
different error shape and a different loading lifecycle.

Incorrect:

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

Incorrect:

```ts
function useTask(id: string) {
  const { Api } = useApi();

  const getTask = () => {
    if (!id) {
      return { task: null, loading: false, error: null, fetch: () => {} };
    }

    return Api(() => http.get(`/tasks/${id}`), [id]);
  };

  return { getTask };
}
```

Skipping the `Api` call to guard a missing id changes the hook order between
renders — guard inside the `apiCall` instead.

Incorrect:

```ts
const getTasks = async () => {
  try {
    const { data } = await http.get("/tasks");
    return { tasks: data, error: null };
  } catch (err) {
    return { tasks: [], error: err.message };
  }
};
```

`err.message` is the axios message, not
`err.response?.data?.message || err.message`, so a 400 from the API renders as
"Request failed with status code 400".

Correct:

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

Correct:

```ts
function useTasks() {
  const { Api } = useApi();

  const [taskAdded] = useEvent("TASK_ADDED", null);

  const getAgentTasks = (agentId: string, fetchState: DependencyArray = []) => {
    const eventDependencies = [taskAdded];

    const { data, loading, error, fetch } = Api(
      () => (agentId ? http.get(`/tasks?agentId=${agentId}`) : null),
      [agentId, ...eventDependencies, ...fetchState]
    );

    return { tasks: data ?? [], loading, error, fetch };
  };

  return { getAgentTasks };
}
```

Guard a missing id inside the `apiCall`, by returning `null` or a resolved
`{ data: null }`, rather than by skipping the `Api` call.

---

### `data/getters-are-hooks`

**Severity: `error`**

The `getX` functions returned by a data hook call `Api`, which calls `useState`
and `useEffect`, so they are hooks and must be called unconditionally at the top
level of a render — never inside a condition, a loop, a callback, or an event
handler.

`useApi.Api` runs three `useState` calls and a `useEffect` on every
invocation. Calling `getTeamAgents()` behind an `if` changes the hook order
between renders and React throws.

Incorrect:

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

Incorrect:

```tsx
function TeamAgents({ teamIds }) {
  const { getTeamAgents } = useAgents();

  return teamIds.map((teamId) => {
    const { agents } = getTeamAgents(teamId);

    return <AgentGrid key={teamId} agents={agents} />;
  });
}
```

A getter inside a `map` runs a different number of hooks whenever `teamIds`
changes length.

Incorrect:

```tsx
const source = agentId ? getAgentKnowledges(agentId) : getTeamKnowledges(teamId);
```

A ternary is a condition — only one of the two getters runs per render, and which
one flips with `agentId`.

Correct:

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

Correct:

```tsx
function AgentsWidget({ teamId, expanded }) {
  const { getTeamAgents } = useAgents();
  const { agents, loading, fetch } = getTeamAgents();

  if (!expanded) {
    return <CollapsedCard />;
  }

  return <AgentGrid agents={agents} loading={loading} onRefresh={fetch} />;
}
```

The early return moved below the getter, and the refresh handler is the `fetch`
the getter already returned.

Correct:

```tsx
function TeamAgents({ teamId }) {
  const { getTeamAgents } = useAgents();
  const { agents } = getTeamAgents(teamId);

  return <AgentGrid agents={agents} />;
}
```

One getter per component, and the list of teams maps over `TeamAgents` rather
than over the getter.

Both getters run every render; the branch picks between the results. To refetch
on demand use the returned `fetch`, not a second `getX()` call.

---

### `data/hook-return-shape`

**Severity: `error`**

A read getter returns `{ <domainName>, loading, error, fetch }` with `data`
renamed to the domain noun, while the hook file exports its domain types and
default-exports an object of functions.

Every widget destructures the same four keys. Renaming `data` at the
hook boundary is what lets a widget call two getters and disambiguate them.

Incorrect:

```ts
function useTeams() {
  const { Api } = useApi();

  const getTeams = () => Api(() => http.get("/projects"), []);

  return getTeams;
}
```

`data` is not renamed, and the hook returns a bare function rather than an object
of functions.

Incorrect:

```ts
const getTeams = (fetchState: DependencyArray = []) => {
  const { data, loading, error } = Api(() => http.get("/projects"), [
    ...fetchState,
  ]);

  return { teams: data, loading, error };
};
```

`fetch` is dropped, so no consumer can refetch on demand.

Incorrect:

```ts
const getTeams = () => {
  const { data, loading, error, fetch } = Api(() => http.get("/projects"), []);

  return { teams: data, isLoading: loading, errorMessage: error, refetch: fetch };
};
```

Renaming the other three keys breaks the shape every widget destructures.

Correct:

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

Correct:

```ts
export type Knowledge = {
  id: string;
  type: "QA" | "URL" | "TEXT";
  status: string;
};

export type KnowledgeInput = Omit<Knowledge, "id" | "status">;

function useKnowledge() {
  const { Api } = useApi();

  const getAgentKnowledges = (
    agentId: string,
    fetchState: DependencyArray = []
  ) => {
    const { data, loading, error, fetch } = Api(
      () => (agentId ? http.get(`/knowledge?agentId=${agentId}`) : null),
      [agentId, ...fetchState]
    );

    return { knowledges: data ?? [], loading, error, fetch };
  };

  return { getAgentKnowledges, createKnowledge, deleteKnowledge };
}

export default useKnowledge;
```

---

### `data/mutations-swallow-and-return-null`

**Severity: `warn`**

Mutations are `async`, wrap the request in `try/catch`, publish on success, and
return `response?.data` or `null` on failure, so callers can branch on the
return value.

This is the established contract in `useAgents`, `useTeams` and
`useOrganizations`. A mutation that throws instead crashes the widget that called
it, because no widget wraps mutation calls in `try/catch`.

Incorrect:

```ts
const deleteAgent = async (agentId) => {
  const response = await http.delete(`/agents/${agentId}`);

  return response.data;
};
```

Incorrect:

```ts
const createAgent = async (agent, teamId) => {
  try {
    const response = await http.post(`/agents`, { ...agent, teamId });

    publish("AGENT_ADDED", { agentId: response.data.id });

    return response.data;
  } catch (error) {
    throw error;
  }
};
```

Catching and rethrowing keeps the crash and adds a frame. Nothing in `widgets/`
wraps a mutation call.

Incorrect:

```ts
const updateAgent = async (agent) => {
  try {
    const response = await http.put(`/agents/${agent.id}`, agent);

    publish("AGENT_UPDATED", { agentId: agent.id });

    return response?.data;
  } catch (error) {
    return null;
  }
};
```

The publish is unguarded, so a request that resolves without a body still tells
every list to refetch.

Correct:

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

Correct:

```ts
const updateAgent = async (agent) => {
  try {
    const response = await http.put(`/agents/${agent.id}`, agent);

    if (response && response.data) {
      publish("AGENT_UPDATED", { agentId: agent.id });
    }

    return response?.data;
  } catch (error) {
    return null;
  }
};
```

Correct:

```tsx
const created = await createAgent(agent, teamId);

if (!created) {
  setError("Could not create the agent.");
  return;
}

setFormOpen(false);
```

The `null` return is what lets the caller branch without a `try/catch`.

---

### `data/handle-async-states`

**Severity: `warn`**

A widget that consumes a getter renders an explicit state for loading, for
empty, and for `error` — which every getter returns and almost nothing renders
today.

Without an error branch a failed request renders as a permanently
empty list, which is indistinguishable from "no data" and produces no signal to
the user or to a test.

Incorrect:

```tsx
function AgentsWidget({ teamId }) {
  const { agents } = useAgents().getTeamAgents();

  return agents.map((agent) => <AgentCard key={agent.id} agent={agent} />);
}
```

Incorrect:

```tsx
function KnowledgeWidget({ agentId }) {
  const { knowledges, loading } = useKnowledge().getAgentKnowledges(agentId);

  if (loading) {
    return <KnowledgeBaseSkeleton />;
  }

  return <KnowledgeTable rows={knowledges} />;
}
```

`error` is returned and ignored, so a failed request renders an empty table.

Incorrect:

```tsx
function TasksWidget({ agentId }) {
  const { tasks, loading, error } = useTasks().getAgentTasks(agentId);

  if (loading) {
    return <TasksSkeleton />;
  }

  if (error) {
    return null;
  }

  return <TaskList tasks={tasks} />;
}
```

Rendering `null` on error is the same silence as no branch at all.

Correct:

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

Correct:

```tsx
function KnowledgeWidget({ agentId }) {
  const { getAgentKnowledges } = useKnowledge();
  const { knowledges, loading, error } = getAgentKnowledges(agentId);

  const isLoading = useLoading(loading);

  if (isLoading) {
    return <KnowledgeBaseSkeleton />;
  }

  if (error) {
    return <Typography color="error.main">{error}</Typography>;
  }

  if (!knowledges?.length) {
    return <AddNewButton addNew={"Knowledge"} onClickFunction={onCreate} />;
  }

  return <KnowledgeTable rows={knowledges} />;
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
skeleton, and use the raw `loading` only on a page's first paint.

Getters refetch whenever a subscribed event fires. Rendering the raw
`loading` flag replaces already-visible content with a skeleton on every
publish, so the screen flashes after every create, edit and delete.
`useLoading` returns `true` only until the first successful load.

Incorrect:

```tsx
function TasksWidget({ agentId }) {
  const { tasks, loading } = useTasks().getAgentTasks(agentId);

  if (loading) {
    return <TeamSkeleton />;
  }

  return <TaskList tasks={tasks} />;
}
```

Incorrect:

```tsx
function KnowledgeWidget({ agentId }) {
  const { knowledges, loading } = useKnowledge().getAgentKnowledges(agentId);

  return (
    <>
      {loading && <LinearProgress />}
      <KnowledgeTable rows={knowledges} loading={loading} />
    </>
  );
}
```

The raw flag drives a progress bar that flashes on every create, edit and delete.

Correct:

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

Correct:

```tsx
function TasksWidget({ agentId }) {
  const { tasks, loading } = useTasks().getAgentTasks(agentId);

  const isLoading = useLoading(loading);

  if (isLoading) {
    return <TasksSkeleton />;
  }

  return <TaskList tasks={tasks} />;
}
```

Correct:

```tsx
function Agents() {
  const { team, loading } = useTeam().getTeamById(teamId);

  if (loading) {
    return <AgentsSkeleton />;
  }

  return <SingleScrollableLayout title={team?.name} />;
}
```

The raw `loading` is right on a page's first paint, where there is no
already-visible content to replace.

---

## 3. Events

`@nucleoidai/react-event` is the cache-invalidation mechanism. A mutation
publishes; the getters that list the same resource subscribe and refetch. There
is no other cache layer.

### `event/naming`

**Severity: `error`**

Event names are `SCREAMING_SNAKE_CASE` with the domain noun first and a
past-tense verb last — a plural noun + `_LOADED` such as `AGENTS_LOADED`
announces a list, a singular noun + verb such as `AGENT_ADDED` announces a
mutation.

Cypress specs wait on these names (`cy.waitEvent("AGENT_ADDED")`), so
a name is a public contract shared by the hook, the subscribers, and the test.

Incorrect:

```ts
publish("agentCreate", { agentId: response.data.id });
publish("REFRESH_AGENTS", {});
publish("ON_AGENT_ADD", { agentId: response.data.id });
```

Incorrect:

```ts
publish("ADD_AGENT", { agentId: response.data.id });
publish("AGENT_DELETE", { agentId });
```

The verb leads in the first and is present tense in the second — neither reads as
an announcement of something that happened.

Incorrect:

```ts
publish("AGENT_ADDED", response.data.id);
publish("KNOWLEDGE_LOADED", data);
```

A bare value has no key, so a subscriber cannot tell what it received and the
payload cannot grow a second field.

Correct:

```ts
publish("AGENT_ADDED", { agentId: response.data.id });
publish("AGENT_DELETED", { agentId });
publish("AGENTS_LOADED", { agents: data });
```

Correct:

```ts
publish("KNOWLEDGE_CREATED", { knowledge: response.data });
publish("KNOWLEDGE_LOADED", { knowledge: data });
publish("SUPERVISING_ANSWERED", { supervisingId });
publish("TEAMS_LOADED", { teams: data });
```

Payloads are objects keyed by the domain noun or its id — never a bare value.

---

### `event/publish-after-mutation`

**Severity: `error`**

Every create, update and delete publishes its domain event, guarded on a truthy
response, before returning.

This is the only refetch trigger. A mutation that does not publish
leaves every list on screen showing stale data until a full reload.

Incorrect:

```ts
const createAgent = async (agent, teamId) => {
  const response = await http.post(`/agents`, { ...agent, teamId });

  return response?.data;
};
```

Incorrect:

```ts
const deleteKnowledge = async (knowledgeId) => {
  try {
    const response = await http.delete(`/knowledge/${knowledgeId}`);

    return response?.data;
  } catch (error) {
    return null;
  }
};
```

The delete succeeds and the knowledge table keeps showing the deleted row until a
full reload.

Incorrect:

```ts
const updateAgent = async (agent) => {
  publish("AGENT_UPDATED", { agentId: agent.id });

  const response = await http.put(`/agents/${agent.id}`, agent);

  return response?.data;
};
```

Publishing before the request means the refetch races the write and usually reads
the old value back.

Correct:

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

Correct:

```ts
const deleteKnowledge = async (knowledgeId) => {
  try {
    const response = await http.delete(`/knowledge/${knowledgeId}`);

    if (response) {
      publish("KNOWLEDGE_DELETED", { knowledgeId });
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

The dependency array is the wiring between publish and refetch. The
named `eventDependencies` local is what makes the invalidation set reviewable.

Incorrect:

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

Incorrect:

```ts
function useAgents() {
  const [agentAdded] = useEvent("AGENT_ADDED", null);
  const [agentDeleted] = useEvent("AGENT_DELETED", null);

  const getTeamAgents = (fetchState: DependencyArray = []) => {
    const { data, loading, error, fetch } = Api(
      () => http.get(`/agents`),
      [agentAdded, agentDeleted, ...fetchState]
    );

    return { agents: data, loading, error, fetch };
  };
}
```

Correct in behaviour, but the invalidation set is spelled inline, so a reviewer
has to read the array to see what refetches this list.

Incorrect:

```ts
const [agentAdded] = useEvent("AGENT_ADDED");
```

No default value, so the first render has an undefined dependency and `Api` runs
its effect twice.

Correct:

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

Correct:

```ts
function useKnowledge() {
  const { Api } = useApi();

  const [knowledgeCreated] = useEvent("KNOWLEDGE_CREATED", null);
  const [knowledgeDeleted] = useEvent("KNOWLEDGE_DELETED", null);
  const [knowledgeStatusChanged] = useEvent("KNOWLEDGE_STATUS_CHANGED", null);
  const [teamSelected] = useEvent("PROJECT_SELECTED", { projectId: null });

  const getAgentKnowledges = (
    agentId: string,
    fetchState: DependencyArray = []
  ) => {
    const eventDependencies = [
      knowledgeCreated,
      knowledgeDeleted,
      knowledgeStatusChanged,
      teamSelected,
    ];

    const { data, loading, error, fetch } = Api(
      () => (agentId ? http.get(`/knowledge?agentId=${agentId}`) : null),
      [agentId, ...eventDependencies, ...fetchState]
    );

    return { knowledges: data ?? [], loading, error, fetch };
  };

  return { getAgentKnowledges };
}
```

Every `useEvent` call needs a default value — `null`, or a shaped object such as
`{ projectId: null }` — so the first render has a defined dependency.

---

### `event/namespace-cross-app`

**Severity: `warn`**

Events owned by the host platform rather than by this dashboard use the
two-argument form — `publish("PLATFORM", "PROJECT_BAR_DIALOG", { open: false })`
— while dashboard-local domain events use the one-argument form.

The namespace marks which side of the `@canmingir/link` boundary owns
the name, so renaming a local event stays a local change.

Incorrect:

```tsx
const [platformDialog] = useEvent("PROJECT_BAR_DIALOG", { open: false });

publish("PROJECT_BAR_DIALOG", { open: false });
```

Incorrect:

```ts
publish("PLATFORM", "AGENT_ADDED", { agentId: response.data.id });
```

A dashboard-local domain event pushed into the platform namespace, where no
subscriber in this app is listening.

Incorrect:

```ts
const [agentAdded] = useEvent("PLATFORM", "AGENT_ADDED", null);
```

Correct:

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

Correct:

```ts
publish("AGENT_ADDED", { agentId: response.data.id });

const [agentAdded] = useEvent("AGENT_ADDED", null);
```

Dashboard-local domain events use the one-argument form on both sides.

---

## 4. Component authoring

### `component/named-function-default-export`

**Severity: `warn`**

Declare the component as a named `function` and export it as the default at the
bottom of the file, never with `React.FC`.

The `function` form is the majority — 109 of the 206 `.tsx` files
declare their component that way against 85 using an arrow const, and 174 files
close with a bare `export default X;`. The named declaration is what appears in
React DevTools and in error boundaries. `React.FC` appears exactly once and
should not spread.

Incorrect:

```tsx
const AgentCard: React.FC<Props> = ({ agent }) => {
  return <Card>{agent.name}</Card>;
};

export default AgentCard;
```

Incorrect:

```tsx
export default ({ agent }) => <Card>{agent.name}</Card>;
```

An anonymous default export shows as `Unknown` in DevTools and in every error
boundary stack.

Incorrect:

```tsx
const AgentCard = React.memo(({ agent }) => <Card>{agent.name}</Card>);

export default AgentCard;
```

Correct:

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

Correct:

```tsx
export default function AgentCard({
  agent,
  onView,
}: {
  agent: { id: string; name: string };
  onView: () => void;
}) {
  return <Card onClick={onView}>{agent.name}</Card>;
}
```

Both forms are present in the codebase and both are acceptable; `React.FC` is
not.

---

### `component/folder-and-barrel`

**Severity: `warn`**

A component lives in a folder named after it, containing `ComponentName.tsx`, an
optional `styles.ts`, and an `index.ts` barrel re-exporting the default, which
importers reach through the folder path.

The barrel is what allows `styles.ts` and sub-components to be added
later without touching every import site.

Incorrect:

```tsx
import AgentCard from "../../components/AgentCard/AgentCard";
import styles from "../../components/AgentCard/styles";
```

Incorrect:

```
src/components/AgentCard.tsx
src/components/AgentCardStyles.ts
```

A flat file has nowhere to put `styles.ts` or a sub-component without another
top-level file.

Incorrect:

```
src/components/AgentCard/
  AgentCard.tsx
  styles.ts
```

No barrel, so every importer has to repeat the component name in the path.

Correct:

```ts
export { default } from "./AddNewButton";
```

Correct:

```
src/components/AddNewButton/
  AddNewButton.tsx
  index.ts
  styles.ts
```

Correct:

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

Type props inline in the parameter position, without a separate `Props`
interface for a single-use component and without `prop-types`
(`react/prop-types` is disabled).

The props list and its types stay adjacent, which is the dominant
shape across `components/`, `layouts/` and `widgets/`.

Incorrect:

```tsx
interface KnowledgeProps {
  agentId?: string;
  teamId?: string;
}

function Knowledge(props: KnowledgeProps) {
  return <KnowledgeTable agentId={props.agentId} />;
}
```

Incorrect:

```tsx
import PropTypes from "prop-types";

function AgentCard({ agent, onView }) {
  return <Card onClick={onView}>{agent.name}</Card>;
}

AgentCard.propTypes = {
  agent: PropTypes.object.isRequired,
  onView: PropTypes.func,
};
```

`react/prop-types` is disabled, and runtime prop checks are not a substitute for
a type the editor can read.

Incorrect:

```tsx
type Props = {
  agentId?: string;
};

function Knowledge({ agentId }: Props) {
  return <KnowledgeTable agentId={agentId} />;
}
```

Correct:

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

Correct:

```tsx
import { Knowledge } from "../../hooks/useKnowledge";

function KnowledgeTable({
  rows,
  onDelete,
}: {
  rows: Knowledge[];
  onDelete: (id: string) => void;
}) {
  return rows.map((row) => <TableRow key={row.id}>{row.type}</TableRow>);
}
```

Domain shapes that cross module boundaries — `Team`, `Knowledge`,
`KnowledgeInput` — are named types exported from the hook that owns them, and
used inline in the parameter position.

---

### `component/styles-module`

**Severity: `warn`**

Reusable `sx` objects go in a sibling `styles.ts` that default-exports a single
plain object keyed by element role, while one-off layout `sx` stays inline.

The object form keeps variant lookups (`styles[type]`) possible and
keeps the component body readable.

Incorrect:

```ts
export const cardStyle = { position: "relative", minWidth: 290 };
export const avatarStyle = { width: 60, height: 60 };
```

Several named exports rather than one object, so `styles[type]` is impossible.

Incorrect:

```tsx
function AddNewButton({ variant, addNew, onClickFunction }) {
  const style =
    variant === "large"
      ? { height: "100%", minWidth: "15rem", borderRadius: "20px" }
      : { height: "100%", minHeight: "20rem", width: "255px" };

  return <Card sx={style}>{addNew}</Card>;
}
```

The variant table is inlined in the component body and rebuilt every render.

Incorrect:

```tsx
<Card
  sx={{
    position: "relative",
    minWidth: 290,
    cursor: "pointer",
    border: "1px solid",
    borderColor: "rgba(22, 28, 36, 0.5)",
    backgroundColor: "background.paper",
    color: "text.secondary",
    "&:hover": { boxShadow: (theme) => theme.customShadows.card },
  }}
/>
```

Correct:

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

Correct:

```tsx
import styles from "./styles";

function AddNewButton({ variant = "default", addNew, onClickFunction }) {
  return (
    <Card sx={styles[variant]} onClick={onClickFunction}>
      {addNew}
    </Card>
  );
}
```

Correct:

```tsx
<Grid container spacing={2} sx={{ mt: 1 }}>
  <Grid size={{ xs: 12, md: 6 }} />
</Grid>
```

One-off layout `sx` stays inline — only reusable and variant-keyed objects move
to `styles.ts`.

---

### `component/theme-tokens`

**Severity: `warn`**

Colours reference theme tokens — `background.paper`, `text.secondary`,
`error.main`, `divider` — or come from `useTheme()` via
`theme.palette.grey[500]` and `alpha(...)`, never from hardcoded hex values.

The theme is supplied by `<Platform>` from `@canmingir/link` in
`src/index.tsx` and augmented in `src/types/theme.d.ts`, which adds
`background.neutral`, `customShadows.card` and the `profile-card` Card/Paper
variants. `config.template.js` shows the knobs a deployment can turn — `mode`,
`colorPresets`, component variants. A hardcoded hex ignores all of it.

Incorrect:

```tsx
<Typography sx={{ color: "#919EAB" }}>{agent.description}</Typography>
<Box sx={{ backgroundColor: "#161C24" }} />
```

Incorrect:

```tsx
<MenuItem sx={{ color: "rgb(255, 86, 48)" }}>Delete</MenuItem>
```

The palette's `error.main` in a form the theme cannot change.

Incorrect:

```tsx
<Divider sx={{ borderColor: "rgba(145, 158, 171, 0.2)" }} />
<Card sx={{ boxShadow: "0 12px 24px -4px rgba(145, 158, 171, 0.12)" }} />
```

`divider` and `customShadows.card` already exist, and the literals drift from
them on the next theme change.

Correct:

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

Correct:

```tsx
<Divider sx={{ borderColor: "divider" }} />
<Card
  variant="profile-card"
  sx={{
    bgcolor: "background.neutral",
    boxShadow: (theme) => theme.customShadows.card,
  }}
/>
```

Correct:

```tsx
<Box sx={{ background: getAgentGradients(agent.id, theme, allAgentIds) }} />
```

Gradients for agent and team avatars come from `src/utils/gradient.ts`
(`getAgentGradients(id, theme, allIds)`), not from literal CSS.

---

## 5. Imports and configuration

### `import/sort-order`

**Severity: `warn` — automated (`sort-imports`)**

Per the `memberSyntaxSortOrder` in `.eslintrc.json`, single-member imports come
first in a case-sensitive alphabetical block, then multi-member imports — also
sorted, with members inside the braces sorted too — separated by a blank line.

Enforced by `npm run lint`, which runs with `--max-warnings 0`.

Incorrect:

```tsx
import React, { useState } from "react";
import { Box, Grid } from "@mui/material";
import AgentCard from "../../components/AgentCard";
import useAgents from "../../hooks/useAgents";
import { useNavigate } from "react-router-dom";
```

Incorrect:

```tsx
import { Typography, Box, Grid } from "@mui/material";
```

Members inside the braces are not sorted.

Incorrect:

```tsx
import useAgents from "../../hooks/useAgents";
import AgentCard from "../../components/AgentCard";
import Box from "@mui/material/Box";
```

Single-member imports, correctly grouped, but not in case-sensitive alphabetical
order.

Correct:

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

Correct:

```tsx
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Box, Grid, Typography } from "@mui/material";
```

A consequence worth knowing: import a single MUI component from its own path
(`@mui/material/Box`) to keep it in the single-member block, and import several
from the package root (`{ Box, Grid, Typography }`) in the multi-member block.

---

### `import/no-mui-loading-button`

**Severity: `warn` — automated (`no-restricted-imports`)**

`@mui/lab/LoadingButton` is banned in favour of `LinkLoadingButton`, except
inside `**/LinkLoadingButton/**` and `LinkLoadingButton.tsx`.

Incorrect:

```tsx
import LoadingButton from "@mui/lab/LoadingButton";

<LoadingButton loading={submitting} onClick={onSubmit}>Save</LoadingButton>;
```

Incorrect:

```tsx
import { LoadingButton } from "@mui/lab";
```

Incorrect:

```tsx
import Button from "@mui/material/Button";

<Button type="submit" disabled={submitting}>
  {submitting ? <CircularProgress size={16} /> : "Save"}
</Button>;
```

Hand-rolling the loading state is a third variant of the button the rule exists
to consolidate.

Correct:

```tsx
import LinkLoadingButton from "../../components/LinkLoadingButton";

<LinkLoadingButton loading={submitting} onClick={onSubmit}>Save</LinkLoadingButton>;
```

Correct:

```tsx
import LoadingButton from "@mui/lab/LoadingButton";

function LinkLoadingButton(props) {
  return <LoadingButton {...props} />;
}
```

The wrapper itself is the exception the lint rule carves out, matched by
`**/LinkLoadingButton/**` and `LinkLoadingButton.tsx`.

---

### `import/config-for-hosts`

**Severity: `error`**

Hosts, socket paths, feature flags and identity-provider settings come from
`config` (`import config from "../../config"`), never from an inlined URL or a
`window.location` branch outside `config.js`.

`config.js`, `config.live.js` and `config.land.js` are per-deployment
variants of the same shape, and they disagree on exactly these values —
`config.js` derives `api` and `socket.host` from `window.location.origin`,
`config.live.js` sets `api: ""` and swaps the GitHub identity provider for
Google. An inlined host ignores whichever variant is in play and points the
built bundle at the wrong backend.

Incorrect:

```ts
const socket = io("http://localhost:3003", { path: "/socket.io" });
const showApiTab = window.location.hostname !== "greycollar.ai";
```

Incorrect:

```ts
const api =
  window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://api.greycollar.ai";
```

The branch belongs in `config.js`, which is the file the deployment swaps.

Incorrect:

```ts
const identityProvider = "github";
```

hardcoded in a hook, while `config.live.js` sets Google.

Correct:

```ts
import config from "../../config";

const { host, path } = config.socket;
const token = storage.get("link", "accessToken");

socketRef.current = io(host, { path, auth: { token }, query: { agentId } });
```

Correct:

```tsx
const { beta } = config;

const visibleTabs = useMemo(
  () => TABS.filter((tab) => !beta || tab.value !== "api"),
  [beta]
);
```

Correct:

```js
const config = {
  api: window.location.origin,
  socket: { host: window.location.origin, path: "/socket.io" },
  identityProvider: "github",
  beta: false,
};

export default config;
```

`config.js` is the one place a `window.location` branch belongs — that is what
makes the file the deployment variant.

---

### `import/storage-over-local-storage`

**Severity: `warn`**

Read and write session-scoped values through `storage` from
`@nucleoidjs/webstorage`, using the two-argument form
(`storage.get("link", "accessToken")`) for values owned by the platform.

`storage` is the same accessor the platform writes through, and it
carries the namespace. Raw `localStorage.getItem("projectId")` reads a key the
platform may namespace differently, and returns a raw string instead of the
parsed value.

Incorrect:

```tsx
const projectId = localStorage.getItem("projectId");
```

Incorrect:

```ts
const accessToken = localStorage.getItem("accessToken");
```

The platform writes the token under the `link` namespace, so this reads a key
that does not exist and returns `null`.

Incorrect:

```tsx
localStorage.setItem("blueprint-overlay", String(showOverlay));
localStorage.getItem("blueprint-overlay");
```

Even for a purely local preference, the key repeated as a literal at two call
sites drifts on the first rename.

Correct:

```tsx
import { storage } from "@nucleoidjs/webstorage";

const teamId = storage.get("projectId");
```

Correct:

```ts
const refreshToken = await storage.get("link", "refreshToken");
const identityProvider = await storage.get("link", "identityProvider");
```

Correct:

```tsx
const OVERLAY_STORAGE_KEY = "blueprint-overlay";

const [showOverlay, setShowOverlay] = useState(
  localStorage.getItem(OVERLAY_STORAGE_KEY) === "true"
);
```

Raw `localStorage` is acceptable for purely local UI preferences that the
platform never sees, such as the connection-overlay toggle in
`BlueprintDrawer.tsx`, provided the key is a module-level constant.

---

## 6. Testing

### `test/data-cy-on-interactive`

**Severity: `error`**

Every element a user clicks, types into, or asserts on carries a `data-cy`
attribute, kebab-case and scoped by component: `agent-card`,
`agent-card-menu-edit`, `agent-wizard-name-input`.

`cypress/support/commands.ts` selects exclusively through
`cy.getBySel`. An interactive element without `data-cy` is untestable.

Incorrect:

```tsx
<IconButton onClick={popover.onOpen}>
  <Iconify icon="eva:more-vertical-fill" />
</IconButton>
```

Incorrect:

```tsx
<RHFTextField name="name" label="Agent name" />
<LinkLoadingButton type="submit">Save</LinkLoadingButton>
```

Incorrect:

```tsx
<MenuItem data-cy="editMenuItem" onClick={onEdit}>Edit</MenuItem>
<MenuItem data-cy="delete_item" onClick={onDelete}>Delete</MenuItem>
```

Neither name is kebab-case, and neither is scoped to the component, so
`delete_item` collides with every other delete in the app.

Correct:

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

Correct:

```tsx
<IconButton
  onClick={popover.onOpen}
  aria-label={`More actions for ${agent.name}`}
  data-cy="agent-card-more-vert"
>
  <Iconify icon="eva:more-vertical-fill" />
</IconButton>
```

Correct:

```tsx
<RHFTextField name="name" label="Agent name" data-cy="agent-wizard-name-input" />
<LinkLoadingButton type="submit" data-cy="agent-finish-button">
  Save
</LinkLoadingButton>
```

---

### `test/select-by-data-cy`

**Severity: `error`**

Specs select with `cy.getBySel("…")`, never by CSS class, MUI-generated class
name, tag structure, or visible text.

Class names and copy change without behaviour changing; `data-cy` is
the only stable contract between the component and the spec.

Incorrect:

```ts
cy.get(".MuiCard-root").eq(1).click();
cy.contains("Edit").click();
```

Incorrect:

```ts
cy.get("[data-cy=agent-card]").click();
```

The right attribute reached by the wrong helper — `getBySel` is the single place
the selector format is defined.

Incorrect:

```ts
cy.get("div > div > button").first().click();
cy.get("#agent-name").should("have.text", "subscription_agent");
```

Correct:

```ts
cy.getBySel("agent-card-more-vert").eq(1).first().click();
cy.getBySel("agent-card-menu-edit").click();
cy.getBySel("agent-card").should("have.length", 3);
```

Correct:

```ts
cy.getBySel("agent-wizard-name-input").type(agent.name);
cy.getBySel("agent-finish-button").click();
cy.getBySel("agent-card-name").first().should("have.text", agent.name);
```

---

### `test/await-domain-events`

**Severity: `warn`**

Synchronise on the domain event with `cy.waitEvent("AGENT_ADDED")` rather than on
a fixed `cy.wait(ms)`.

The publish is what triggers the refetch, so the event is the exact
moment the UI becomes consistent. A timeout either flakes or wastes time.

Incorrect:

```ts
cy.getBySel("agent-finish-button").click();
cy.wait(2000);
cy.getBySel("agent-card").should("have.length", 3);
```

Incorrect:

```ts
cy.getBySel("agent-card-menu-delete").click();
cy.getBySel("confirm").click();
cy.wait(500);
cy.getBySel("agent-card").should("have.length", 2);
```

Incorrect:

```ts
cy.intercept("POST", "/api/agents").as("createAgent");
cy.getBySel("agent-finish-button").click();
cy.wait("@createAgent");
cy.getBySel("agent-card").should("have.length", 3);
```

Waiting on the request is closer, but the list refetches on the publish, not on
the response — the assertion still races the re-render.

Correct:

```ts
cy.getBySel("add-new-button").click();
cy.waitEvent("AGENT_WIZARD_OPENED");

cy.createAgentViaDialog(this.createdAgent, this.newAgents);
cy.waitEvent("AGENT_ADDED");

cy.getBySel("agent-card").should("have.length", 3);
```

Correct:

```ts
cy.getBySel("agent-card-menu-delete").click();
cy.getBySel("confirm").click();
cy.waitEvent("AGENT_DELETED");

cy.getBySel("agent-card").should("have.length", 2);
```

This is the second reason `event/naming` is an `error`-level rule: renaming an
event breaks specs that never import it.

---

## 7. Forms and dialogs

### `form/rhf-with-yup-resolver`

**Severity: `error`**

Forms use `react-hook-form` with a Yup schema through `yupResolver`, rendered
with `FormProvider` and `RHFTextField` from
`@canmingir/link/platform/components` and validated with `mode: "onChange"`,
never with hand-rolled field state or validation.

`FormProvider`/`RHFTextField` read the form context to wire values,
errors and helper text. A raw MUI `TextField` inside a `FormProvider` renders but
never registers, so it validates as empty and submits nothing.

Incorrect:

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

Incorrect:

```tsx
<FormProvider methods={methods} onSubmit={onSubmit}>
  <TextField name="inputValue" label="Enter URL" />
</FormProvider>
```

A raw MUI `TextField` inside a `FormProvider` renders but never registers, so it
validates as empty and submits nothing.

Incorrect:

```tsx
const methods = useForm({
  defaultValues: initialValues,
  resolver: yupResolver(AddItemSchema),
});
```

Without `mode: "onChange"`, `isValid` updates only on submit, so the disabled
submit button never enables.

Correct:

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

Correct:

```tsx
const AgentSchema = Yup.object().shape({
  name: Yup.string().required("Name cannot be an empty field"),
  description: Yup.string().required("Description cannot be an empty field"),
  aiEngineId: Yup.string().required("Select an AI engine"),
});

const methods = useForm({
  defaultValues: { name: "", description: "", aiEngineId: "" },
  resolver: yupResolver(AgentSchema) as Resolver<FormValues>,
  mode: "onChange",
});

return (
  <FormProvider methods={methods} onSubmit={onSubmit}>
    <RHFTextField name="name" label="Name" data-cy="agent-wizard-name-input" />
    <RHFTextField name="description" label="Description" />
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

`mode: "onChange"` keeps `isValid` live, so the button is the
validation feedback. Without the disable, a double click fires the mutation twice
and publishes the domain event twice.

Incorrect:

```tsx
<Button type="submit" onClick={onSubmit}>
  Save
</Button>
```

Incorrect:

```tsx
<LinkLoadingButton type="submit" loading={isSubmitting}>
  Save
</LinkLoadingButton>
```

No `disabled`, so a double click fires the mutation twice and publishes the domain
event twice.

Incorrect:

```tsx
<LinkLoadingButton type="submit" disabled={!isValid}>
  Save
</LinkLoadingButton>
```

Correct:

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

Correct:

```tsx
const [isSubmitting, setIsSubmitting] = useState(false);

const onSubmit = handleSubmit(async (data) => {
  setIsSubmitting(true);

  try {
    await createAgent(data, teamId);
  } finally {
    setIsSubmitting(false);
    reset();
  }
});
```

`isSubmitting` is local state set around the await, which is what both `loading`
and the second half of `disabled` read.

---

### `form/reset-after-submit`

**Severity: `warn`**

Call `reset()` in the `finally` of the submit handler, and again whenever the
form's shape changes underneath it — a type switch, a step change.

Dialogs are mounted once and reopened. Without `reset()` the second
open shows the previous submission's values, and a type switch leaves the old
field registered against the new schema, so `isValid` stays false with no visible
error.

Incorrect:

```tsx
const onSubmit = handleSubmit(async (data) => {
  await addItem(data);
  setOpen(false);
});

const handleChangeType = (event) => setCurrentType(event.target.value);
```

Incorrect:

```tsx
const onSubmit = handleSubmit(async (data) => {
  await addItem(data);

  reset();
  setOpen(false);
});
```

`reset()` after the await but outside a `finally` is skipped whenever `addItem`
throws, so the dialog reopens with the failed submission still in it.

Incorrect:

```tsx
const handleStepChange = (step: number) => {
  setCurrentStep(step);
};
```

The wizard's next step registers different fields against the same form, and
without a `reset()` the old ones keep `isValid` false with nothing visibly wrong.

Correct:

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

Correct:

```tsx
const handleStepChange = (step: number) => {
  setCurrentStep(step);
  reset();
};
```

---

### `dialog/callback-props-not-setters`

**Severity: `error`**

A dialog receives `open` plus intent callbacks — `onClose`, `onConfirm`,
`onSubmit` — and never the parent's `useState` setter.

A setter prop hands the child write access to the parent's state, so
the parent can no longer run anything on close. `AgentsWidget` needs to clear
`updatedAgent` when its wizard closes; it can only do that because the wizard
takes `onClose`. The setter-passing variants in the tree — `DeleteConfirmation`,
`AddItemDialog`, `FlowDialog` — cannot support that without a prop change.

Incorrect:

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

Incorrect:

```tsx
function AddItemDialog({ open, setOpen, addItem }) {
  const onSubmit = handleSubmit(async (data) => {
    await addItem(data);
    setOpen(false);
  });
}
```

Incorrect:

```tsx
<FlowDialog open={flowOpen} setOpen={setFlowOpen} setNodes={setNodes} />
```

Two setters, so the parent can neither run cleanup on close nor validate what the
child wrote.

Correct:

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

Correct:

```tsx
<AgentWizard
  open={formOpen}
  onClose={() => {
    setFormOpen(false);
    setUpdatedAgent(null);
  }}
/>
```

The widget keeps ownership of both the flag and the cleanup.

Correct:

```tsx
function AddItemDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (item: KnowledgeInput) => Promise<void>;
}) {
  return (
    <Dialog open={open} onClose={onClose}>
      <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)} />
    </Dialog>
  );
}
```

`ConfirmationDialog` is the shape to copy. Prefer it over `DeleteConfirmation`
for new confirmations rather than adding a third variant.

---

### `dialog/guard-close-while-submitting`

**Severity: `warn`**

While a submit is in flight, backdrop and escape closes are ignored.

Closing mid-submit unmounts the dialog while its `finally` still holds
a `setIsSubmitting` call, and the user gets no signal about whether the mutation
landed.

Incorrect:

```tsx
<Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
```

Incorrect:

```tsx
<Dialog open={open} onClose={onClose}>
  <LinkLoadingButton type="submit" loading={isSubmitting}>
    Save
  </LinkLoadingButton>
</Dialog>
```

The button knows about the in-flight submit and the dialog does not, so escape
still closes it mid-write.

Incorrect:

```tsx
<Dialog open={open} onClose={onClose} disableEscapeKeyDown>
```

`disableEscapeKeyDown` blocks escape unconditionally, including when nothing is
in flight, and leaves the backdrop click open.

Correct:

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

Correct:

```tsx
<Dialog
  open={open}
  onClose={() => {
    if (!isSubmitting) {
      onClose();
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
`zIndex: (theme) => theme.zIndex.modal + 3`, and a `Select` menu inside such a
dialog sets `MenuProps.sx.zIndex` to `theme.zIndex.modal + 4`.

MUI gives every modal the same base `zIndex`, so a nested dialog ties
with its parent and renders behind it depending on mount order. The `+3` / `+4`
offsets are the established ladder; a menu must clear the dialog that contains
it or it opens underneath.

Incorrect:

```tsx
<Dialog open={open} sx={{ zIndex: 2000 }}>
  <Select value={type} onChange={onChange}>
    {types.map((type) => (
      <MenuItem key={type} value={type}>{type}</MenuItem>
    ))}
  </Select>
</Dialog>
```

Incorrect:

```tsx
<Dialog open={open}>
  <Select value={currentType} onChange={handleChangeType}>
    <MenuItem value="URL">URL</MenuItem>
  </Select>
</Dialog>
```

The nested dialog ties with its parent on the base `zIndex`, and the menu opens
underneath the dialog that contains it.

Incorrect:

```tsx
<Dialog open={open} sx={{ zIndex: (theme) => theme.zIndex.modal + 3 }}>
  <Select MenuProps={{ sx: { zIndex: (theme) => theme.zIndex.modal + 2 } }} />
</Dialog>
```

Correct:

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

Correct:

```tsx
<Dialog open={open} onClose={onClose}>
  <Select value={currentType} onChange={handleChangeType}>
    <MenuItem value="URL">URL</MenuItem>
  </Select>
</Dialog>
```

A dialog opened from a page rather than from inside another dialog needs no
offset — the ladder starts only where dialogs stack.

---

## 8. Effects and lifecycle

### `effect/clear-timers`

**Severity: `error`**

Every `setInterval` and `setTimeout` started in an effect is cleared in that
effect's cleanup, while a timer started outside React clears itself on its own
exit condition.

This codebase polls. `useChat` refreshes messages every 2s and
`TasksWidget` polls task steps every 2s. An uncleared interval keeps firing after
unmount, calling `setState` on a dead component and holding the whole closure —
including the fetched message list — alive.

Incorrect:

```tsx
useEffect(() => {
  setInterval(() => {
    getSteps(selectedTask.id);
  }, 2000);
}, [selectedTask?.id]);
```

Incorrect:

```tsx
useEffect(() => {
  setTimeout(() => setShowToast(false), 3000);
}, [showToast]);
```

An unmount inside the three seconds leaves a `setState` aimed at a dead
component.

Incorrect:

```ts
const intervalId = setInterval(async () => {
  const { data: knowledge } = await http.get(`/knowledge`);

  if (knowledge.status === "COMPLETED") {
    publish("KNOWLEDGE_STATUS_CHANGED", { ...knowledge });
  }
}, 2000);
```

A poll outside React with no exit condition — it keeps requesting for the life of
the tab.

Correct:

```tsx
useEffect(() => {
  const interval = setInterval(() => {
    getSteps(selectedTask.id);
  }, 2000);

  return () => clearInterval(interval);
}, [selectedTask?.id]);
```

Correct:

```ts
intervalId.current = setInterval(fetchMessages, 2000);

return () => {
  if (intervalId.current) clearInterval(intervalId.current);
};
```

Correct:

```tsx
useEffect(() => {
  const timeout = setTimeout(() => setShowToast(false), 3000);

  return () => clearTimeout(timeout);
}, [showToast]);
```

Correct:

```ts
const intervalId = setInterval(async () => {
  const { data: knowledge } = await http.get(`/knowledge`);

  if (knowledge.status === "COMPLETED") {
    clearInterval(intervalId);
    publish("KNOWLEDGE_STATUS_CHANGED", { ...knowledge });
  }
}, 2000);
```

A poll that lives outside a component, like the knowledge-status watcher in
`chat.config.ts`, must clear itself when its terminal status arrives.

---

### `effect/unregister-socket-handlers`

**Severity: `error`**

An effect that opens a socket returns a cleanup calling `socket.off` for every
`socket.on` it registered and then `socket.disconnect()`, and code replacing a
live socket tears the old one down the same way first.

`io()` reuses connections. Registering `ai_message` twice appends
every AI reply to the conversation twice. Disconnecting without `off` leaves the
handlers attached to a manager that may reconnect.

Incorrect:

```ts
useEffect(() => {
  const socket = io(host, { path, auth: { token } });

  socket.on("ai_message", ({ content }) => {
    setConversations((prev) => [...prev, { role: "AI", content }]);
  });

  return () => socket.disconnect();
}, []);
```

Incorrect:

```ts
const createSession = () => {
  socketRef.current = io(host, { path, auth: { token }, query: { agentId } });

  socketRef.current.on("ai_message", handleAiMessage);
};
```

Replacing a live socket without tearing the old one down first leaves the
previous handlers attached, so every reply appends twice.

Incorrect:

```ts
return () => {
  socket.off("ai_message");
  socket.disconnect();
};
```

One `off` for four `on` calls — `connect`, `session_started` and `error_message`
stay registered.

Correct:

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

Correct:

```ts
const createSession = () => {
  if (socketRef.current) {
    socketRef.current.off("connect");
    socketRef.current.off("session_started");
    socketRef.current.off("ai_message");
    socketRef.current.off("error_message");
    socketRef.current.disconnect();
  }

  socketRef.current = io(host, { path, auth: { token }, query: { agentId } });
};
```

The same teardown runs at the top of `createSession` before a replacement socket
is opened. Socket payloads that other parts of the UI care about are re-published
onto the event bus — `AI_RESPONDED`, `AI_ERROR` — rather than lifted through
props.

---

### `effect/scoped-deps-disable`

**Severity: `warn`**

`react-hooks/exhaustive-deps` may be suppressed only on the single line where
the dependency array is deliberately not the full closure — a mount-only socket
or timer setup, or a list assembled from `eventDependencies` and `fetchState` —
never for a whole file and never to silence a stale-closure bug.

`plugin:react-hooks/recommended` is on and `lint` runs with
`--max-warnings 0`, so the suppression is a deliberate, reviewable act. The
legitimate cases are narrow and already established — `useApi`, `useSocket`,
`useSession`, `AgentLayout`.

Incorrect:

```tsx
function TasksWidget({ agentId }) {
  const [steps, setSteps] = useState([]);

  useEffect(() => {
    setSteps(computeSteps(agentId, filter));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
```

The suppression hides a stale closure — `agentId` and `filter` change and the
steps never recompute.

Incorrect:

```tsx
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
```

A file-wide disable removes every effect in the file from the check, not the one
that needed it.

Incorrect:

```tsx
useEffect(() => {
  fetchMessages(sessionId);
  // eslint-disable-next-line
}, [sessionId]);
```

A bare `eslint-disable-next-line` with no rule name suppresses everything on that
line.

Correct:

```ts
useEffect(() => {
  fetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, dependencies);
```

Correct:

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

Correct:

```tsx
function TasksWidget({ agentId, filter }) {
  const [steps, setSteps] = useState([]);

  useEffect(() => {
    setSteps(computeSteps(agentId, filter));
  }, [agentId, filter]);
}
```

The best fix is usually no suppression at all — list the real dependencies.

`useApi` is the load-bearing case: `dependencies` is a runtime array the caller
composes, so the rule cannot see it.

---

## 9. TypeScript

### `ts/explicit-types-under-non-strict`

**Severity: `error`**

Because `tsconfig.json` sets `strict: false` and `noImplicitAny: false`, props
and exported domain shapes must be typed by hand.

With `noImplicitAny` off, an untyped prop is `any`, and `any` flows
through the whole render silently. The prop annotation is the only contract a
reviewer or an editor has. `typecheck` runs in CI, so annotations that are
present are checked — the risk is the ones that are missing.

Incorrect:

```tsx
function AgentCard({ agent, onView, allAgentIds }) {
  return <Card onClick={onView}>{agent.nmae}</Card>;
}
```

The typo in `agent.nmae` compiles and renders empty.

Incorrect:

```tsx
function KnowledgeTable({ rows, onDelete }: { rows: any[]; onDelete: any }) {
  return rows.map((row) => <TableRow key={row.id}>{row.tpye}</TableRow>);
}
```

An explicit `any` is the same hole written on purpose.

Incorrect:

```ts
export const parseJsonResult = (result) => {
  try {
    return { isJson: true, parsedResult: JSON.parse(String(result)) };
  } catch (e) {
    return { isJson: false, parsedResult: result };
  }
};
```

An exported util with an untyped parameter, so every call site passes whatever it
has.

Correct:

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

Correct:

```ts
export const parseJsonResult = (
  result?: string | object
): { isJson: boolean; parsedResult: unknown } => {
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

Correct:

```tsx
import { Knowledge } from "../../hooks/useKnowledge";

function KnowledgeTable({
  rows,
  onDelete,
}: {
  rows: Knowledge[];
  onDelete: (id: string) => void;
}) {
  return rows.map((row) => <TableRow key={row.id}>{row.type}</TableRow>);
}
```

Shapes shared across modules are named types exported from the hook that owns the
resource — `Team`, `TeamInput` in `useTeams.ts`, `Knowledge`, `KnowledgeInput` in
`useKnowledge.ts`. Local helper shapes stay local, as
`ValidationError` and `ValidationResult` do in `BlueprintFlow/Validation/validation.ts`.

---

### `ts/relative-imports`

**Severity: `warn`**

Import with relative paths, not the `@/*` alias.

`tsconfig.json` declares `paths: { "@/*": ["src/*"] }`, but no file in
`src` uses it and the Vite config is produced by `@canmingir/link/vite`, which
this repo extends only to add proxies — it never registers a matching
`resolve.alias`. An `@/` import would satisfy `typecheck` and then fail to
resolve at build time.

Incorrect:

```tsx
import useAgents from "@/hooks/useAgents";
import AgentCard from "@/components/AgentCard";
```

Incorrect:

```ts
import { cleanIconName } from "@/utils/cleanIconName";
```

Incorrect:

```json
{
  "compilerOptions": {
    "paths": { "@/*": ["src/*"] }
  }
}
```

The alias satisfies `typecheck` and then fails to resolve at build time, because
nothing registers a matching `resolve.alias` in Vite.

Correct:

```tsx
import AgentCard from "../../components/AgentCard";
import useAgents from "../../hooks/useAgents";
```

Correct:

```ts
import config from "../../config";
import { cleanIconName } from "../../utils/cleanIconName";
```

`config` is reached the same way, from outside `src`.

---

## 10. Presentation primitives

### `ui/platform-table-primitives`

**Severity: `warn`**

Tables are built from the platform primitives — `useTable`, `TableHeadCustom`,
`TableSelectedAction`, `Scrollbar`, `Label` — with the `table` object created in
the widget and passed to the presentational table component.

`useTable` owns selection, ordering and pagination state. Creating it
in the widget keeps `layer/no-data-access-in-components` intact while the table
component stays presentational, and the shared head/selection components keep
sort and bulk-select behaviour identical across screens.

Incorrect:

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

Incorrect:

```tsx
function KnowledgeTable({ knowledges }) {
  const table = useTable();

  return <Table>{/* … */}</Table>;
}
```

`useTable` created inside the presentational component means the widget cannot
read the selection, so bulk actions have nowhere to live.

Incorrect:

```tsx
<Table>
  <TableHead>
    <TableRow>
      <TableCell onClick={() => setOrder("asc")}>URL</TableCell>
      <TableCell>Status</TableCell>
    </TableRow>
  </TableHead>
</Table>
```

Hand-rolled sort in place of `TableHeadCustom`, so this screen's sort behaves
differently from every other one.

Correct:

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

Correct:

```tsx
<TableSelectedAction
  dense={table.dense}
  numSelected={table.selected.length}
  rowCount={knowledges.length}
  onSelectAllRows={(checked) =>
    table.onSelectAllRows(
      checked,
      knowledges.map((row) => row.id)
    )
  }
  action={
    <IconButton onClick={handleDeleteClick} aria-label="Delete selected items">
      <Iconify icon="solar:trash-bin-trash-bold" />
    </IconButton>
  }
/>
```

Column sets are chosen by a `switch` on the active type inside the table
component. A trailing `{ id: "", label: "" }` reserves the actions column.

---

### `ui/format-dates-with-helpers`

**Severity: `warn`**

Format dates through `src/utils/formatTime.ts` and its `formatStr` presets,
never by calling `toLocaleDateString`, `toLocaleString`, or `dayjs` directly in
a component.

`formatTime` extends dayjs with the `duration` and `relativeTime`
plugins once at module load and fixes the presets — `DD MMM YYYY h:mm a` and
friends. `toLocaleDateString` renders per the visitor's locale, so the same list
shows `17/04/2022` for one user and `4/17/2022` for another, and no Cypress
assertion on a date string can hold.

Incorrect:

```tsx
<TableCell>{new Date(row.createdAt).toLocaleDateString()}</TableCell>
```

Incorrect:

```tsx
import dayjs from "dayjs";

<Typography>{dayjs(message.createdAt).format("DD/MM/YYYY")}</Typography>;
```

Calling dayjs directly skips the plugin registration `formatTime` does once at
module load, so `fromNow()` elsewhere silently fails.

Incorrect:

```tsx
<Typography>{new Date(agent.createdAt).toLocaleString()}</Typography>
```

Correct:

```tsx
import { fDateTime } from "../../../utils/formatTime";

<Typography variant="caption">
  {fDateTime(message.createdAt, "MMM DD, YYYY")}
</Typography>;
```

Correct:

```tsx
import { fDate, formatStr } from "../../utils/formatTime";

<TableCell>{fDate(row.createdAt, formatStr.date)}</TableCell>;
```

Correct:

```ts
const sorted = [...messages].sort(
  (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
);
```

Sorting still uses raw timestamps — that is comparison, not display.

The module exports `fDate`, `fTime`, `fDateTime`, `today` and `now`, plus a
`formatStr` map of the house presets (`dateTime`, `date`, `time`, and `split` /
`paramCase` variants). Prefer a `formatStr` preset over a literal pattern when
one matches.

---

### `ui/iconify-and-clean-names`

**Severity: `warn`**

Icons render through `<Iconify icon="…" />`, and any icon name that came from
the server or from user input passes through `cleanIconName` first rather than
an inlined trimming regex.

Stored icon names arrive wrapped in stray colons, and
`cleanIconName` is the single place that strips them. An inline
`replace(/^:|:$/g, "")` is a second copy that will not be updated when the
stored format changes — and it differs from `cleanIconName`, which strips
repeated colons via `/^:+|:+$/g` and returns `""` for a missing icon instead of
throwing.

Incorrect:

```tsx
<Iconify icon={teamById?.icon?.replace(/^:|:$/g, "")} sx={{ width: 40, height: 40 }} />
```

Incorrect:

```tsx
<Icon icon={agent.icon} />
```

Bypassing `Iconify` for the raw runtime component loses the sizing and `sx`
handling every other icon in the app gets.

Incorrect:

```tsx
<Iconify icon={agent.icon} width={32} height={32} />
```

A stored icon name used unchanged — the stray colons arrive with it and the icon
fails to resolve.

Correct:

```tsx
import { cleanIconName } from "../../utils/cleanIconName";

{agent.icon ? (
  <Iconify icon={cleanIconName(agent.icon)} width={32} height={32} />
) : (
  <Avatar sx={{ width: "100%", height: "100%" }} />
)}
```

Correct:

```tsx
<Iconify icon="solar:pen-bold" />
<Iconify icon="eva:more-vertical-fill" />
<Iconify icon="ph:flow-arrow" />
```

Icon names that are literals in this codebase are already clean and need no call.

Correct:

```tsx
<Iconify icon={cleanIconName(teamById?.icon)} sx={{ width: 40, height: 40 }} />
```

`cleanIconName` returns `""` for a missing icon rather than throwing, so the
optional chain is enough. The avatar and team icon sets live in
`src/lib/AgentAndTeamAvatars.ts`.

---

### `ui/skeleton-per-screen`

**Severity: `warn`**

Loading placeholders live in `src/components/Skeletons/` and are named after the
screen or card they stand in for — `AgentSkeleton`, `KnowledgeBaseSkeleton`,
`BlueprintFlowSkeleton` — so a new screen adds its own rather than reusing a
mismatched one or dropping in a bare `<Skeleton />`.

The placeholder should occupy the same space as the content it
replaces, otherwise the page reflows on load. Naming them per screen is what
makes the mismatch visible in review.

Incorrect:

```tsx
function TaskScores() {
  const { scores, loading } = useTaskScores().getScores();

  if (loading) {
    return <AgentsSkeleton />;
  }

  return <TaskScoresWidget scores={scores} />;
}
```

A skeleton borrowed from another screen, so the page reflows when the real
content arrives.

Incorrect:

```tsx
if (loading) {
  return <Skeleton />;
}

return <KnowledgeTable rows={knowledges} />;
```

A bare `<Skeleton />` occupies one line where a table is about to appear.

Incorrect:

```tsx
if (loading) {
  return <CircularProgress />;
}
```

Correct:

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

Correct:

```tsx
function TaskScores() {
  const { scores, loading } = useTaskScores().getScores();

  if (loading) {
    return <TaskScoresSkeleton />;
  }

  return <TaskScoresWidget scores={scores} />;
}
```

Correct:

```tsx
{loading ? <Skeleton variant="rectangular" height={200} /> : <ProfileCard />}
```

A single inline skeleton is acceptable for one region inside a layout, as
`AgentLayout` does for the profile card.

---

## 11. Pure modules and the flow subsystem

### `pure/react-free-modules`

**Severity: `error`**

`src/utils/`, `src/lib/` and `src/constants/` contain pure functions and static
data, and must not import React, call hooks, render JSX, or reach the network.

They are imported by every layer including `components/`. A hook call
inside a util would silently impose the Rules of Hooks on every call site. The
directory is currently clean of React — keep it that way.

Incorrect:

```ts
import { useTheme } from "@mui/material/styles";

export const getAgentGradients = (id, allIds) => {
  const theme = useTheme();
  return `linear-gradient(${theme.palette.primary.main}, transparent)`;
};
```

Incorrect:

```tsx
export const renderStatusLabel = (status: string) => (
  <Label color={status === "COMPLETED" ? "success" : "warning"}>{status}</Label>
);
```

JSX in `utils/` makes the module a component in everything but name.

Incorrect:

```ts
import http from "@canmingir/link/platform/http";

export const fetchEngines = () => http.get("/engines").then((res) => res.data);
```

Correct:

```ts
export const cleanIconName = (icon?: string) => {
  if (!icon) return "";
  return icon.replace(/^:+|:+$/g, "");
};
```

Correct:

```ts
import type { Theme } from "@mui/material/styles";

export const getAgentGradients = (
  id: string,
  theme: Theme,
  allIds: string[] = []
) => {
  const index = allIds.indexOf(id);

  return `linear-gradient(180deg, ${theme.palette.primary.main}, transparent)`;
};
```

When a util needs the theme, it takes it as an argument and the caller supplies
it from `useTheme()`.

Correct:

```ts
const FormItemTypes = {
  AutoComplete: "AutoComplete",
  SelectBox: "SelectBox",
};

export default FormItemTypes;
```

Static data with no React, no hooks and no network.

---

### `pure/export-style`

**Severity: `warn`**

`utils/` uses named exports with one concern per file named after the export,
while `constants/` and single-object modules default-export the object and
`lib/` exports named static data.

Named exports in `utils/` are what let `import { cleanIconName }`
sort into the single-member import block, and they keep the `sort-imports` order
predictable. A default-exported grab-bag of utilities would import as one opaque
name.

Incorrect:

```ts
const utils = {
  cleanIconName,
  formatKey,
  getAgentGradients,
};

export default utils;
```

A default-exported grab-bag imports as one opaque name.

Incorrect:

```ts
export const FormItemTypes = {
  AutoComplete: "AutoComplete",
  SelectBox: "SelectBox",
};
```

`constants/` and single-object modules default-export the object.

Incorrect:

```ts
export const cleanIconName = (icon?: string) => icon?.replace(/^:+|:+$/g, "") ?? "";
export const formatKey = (key: string) => key.split("_").join(" ");
export const getBackgroundUrl = (id: string) => backgroundUrls[hash(id)];
```

Three unrelated concerns in one `utils/helpers.ts` — one concern per file, named
after the export.

Correct:

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

Correct:

```ts
const FormItemTypes = {
  AutoComplete: "AutoComplete",
  SelectBox: "SelectBox",
  TextField: "TextField",
  CheckBox: "CheckBox",
};

export default FormItemTypes;
```

Correct:

```ts
export const cleanIconName = (icon?: string) => {
  if (!icon) return "";
  return icon.replace(/^:+|:+$/g, "");
};
```

in `src/utils/cleanIconName.ts` — one concern, one file, named after the export.

Parsers return a discriminated result — `{ isJson, parsedResult }` — rather than
throwing, because their callers render the fallback inline.

---

### `flow/adapter-owns-translation`

**Severity: `warn`**

Conversion between the server's blueprint graph and the `@xyflow/react` node and
edge shapes lives in `src/components/BlueprintFlow/flowAdapter.ts` with layout
in `src/utils/flowLayout.ts`, and nodes and widgets consume the converted shape.

The server graph nests targets under `item.true` / `item.false` for
`CONDITION` nodes and carries display data under `item.properties`. That
translation is fiddly and edge ids are generated by a counter — a second copy
would produce colliding ids and diverge on the next schema change.

Incorrect:

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

Incorrect:

```tsx
function AIResponseNode({ data }) {
  const label = data.properties?.label ?? data.item?.properties?.label;

  return <Box>{label}</Box>;
}
```

A node reaching back into the server shape means the adapter is not the only
translation any more.

Incorrect:

```ts
const positioned = nodes.map((node, index) => ({
  ...node,
  position: { x: index * 200, y: 0 },
}));
```

Layout belongs in `src/utils/flowLayout.ts`, which uses elkjs — a hand-rolled
grid diverges from it on the first branching graph.

Correct:

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

Correct:

```tsx
import { convertToNodesAndEdges } from "../../components/BlueprintFlow/flowAdapter";
import { layoutNodes } from "../../utils/flowLayout";

function BlueprintFlowWidget({ blueprint }) {
  const { nodes, edges } = convertToNodesAndEdges(blueprint?.nodes);

  const [positioned, setPositioned] = useState([]);

  useEffect(() => {
    layoutNodes(nodes, edges).then(setPositioned);
  }, [nodes, edges]);

  return <ReactFlow nodes={positioned} edges={edges} />;
}
```

Correct:

```tsx
function AIResponseNode({ data }: { data: { label: string; icon?: string } }) {
  return <Box>{data.label}</Box>;
}
```

The node consumes the converted shape and knows nothing about `item.properties`.

The adapter always returns `{ nodes: [], edges: [] }` for absent or malformed
input rather than throwing, so the canvas renders empty instead of blanking the
tab.

---

### `flow/validate-before-save`

**Severity: `warn`**

A blueprint is validated before it is persisted by
`BlueprintFlow/Validation/validation.ts`, which returns `{ isValid, errors }`
carrying enough to point at the offending edge for the widget to render rather
than blocking silently.

The error shape — `nodeId`, `nodeLabel`, `nextNodeId`,
`nextNodeLabel`, `missingProperties`, `message` — is what lets
`BlueprintFlowWidget` highlight both ends of a broken connection. Returning a
bare boolean loses the ability to point at anything.

Incorrect:

```tsx
const handleSave = async () => {
  if (!nodes.length) return;

  await upsertBlueprint(agentId, nodes);
};
```

Incorrect:

```ts
function validate(nodes: Node[]): boolean {
  return nodes.every((node) => node.properties?.label);
}
```

A bare boolean loses the ability to point at the offending node, so the widget
can only refuse to save with no explanation.

Incorrect:

```tsx
const handleSave = async () => {
  const { isValid } = validateBlueprint(nodes, edges);

  if (!isValid) {
    return;
  }

  await upsertBlueprint(agentId, nodes);
};
```

Validated and then blocked silently — the errors are computed and discarded.

Correct:

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

Correct:

```tsx
const handleSave = async () => {
  const validationResult = validateBlueprint(nodes, edges);

  setValidationErrors(validationResult.errors);

  if (!validationResult.isValid) {
    setShowValidationErrors(true);
    return;
  }

  setShowValidationErrors(false);

  await upsertBlueprint(agentId, nodes);
};
```

Correct:

```tsx
const nodeErrors = validationErrors.filter(
  (error) => error.nodeId === nodeId || error.nextNodeId === nodeId
);
```

Errors are matched back to the canvas by both ends of the edge.

---

## 12. Content rendering

### `content/markdown-through-renderer`

**Severity: `error`**

Text authored by a model or returned by the API renders through
`components/MarkdownRenderer`, not through a raw `ReactMarkdown` with default
element mapping and not as a plain string when it may contain markdown.

`MarkdownRenderer` maps every markdown element onto MUI —
headings to `Typography` variants, lists to `Box component="ul"` with
themed spacing, and it reads `useTheme()` for the rest. Default `ReactMarkdown`
emits bare `<h1>`/`<p>`/`<ul>`, which inherit none of the theme and break the
visual rhythm of the surrounding card.

Incorrect:

```tsx
import ReactMarkdown from "react-markdown";

function BlueprintSkill({ skill }) {
  return <ReactMarkdown>{skill}</ReactMarkdown>;
}
```

Incorrect:

```tsx
<Typography variant="body2">{aiResponse.content}</Typography>
```

Incorrect:

```tsx
import ReactMarkdown from "react-markdown";

<ReactMarkdown
  components={{
    h1: ({ children }) => <Typography variant="h4">{children}</Typography>,
  }}
>
  {content}
</ReactMarkdown>;
```

A second component map is a second renderer that will drift from
`MarkdownRenderer` on the first theme change.

Correct:

```tsx
import MarkdownRenderer from "../MarkdownRenderer/MarkdownRenderer";

{skill && <MarkdownRenderer>{skill}</MarkdownRenderer>}
```

Correct:

```tsx
import MarkdownRenderer from "../MarkdownRenderer/MarkdownRenderer";

<MarkdownRenderer sx={{ px: 2 }}>{aiResponse.content}</MarkdownRenderer>;
```

Correct:

```tsx
<Typography variant="subtitle1" data-cy="agent-card-name">
  {agent.name}
</Typography>
```

A short field that cannot contain markdown renders as plain text.

`MarkdownRenderer` takes an optional `sx` for the wrapper and applies
`remark-gfm`, so tables and strikethrough work. Extend its component map rather
than adding a second renderer.

---

### `content/restrict-dangerous-html`

**Severity: `error`**

`dangerouslySetInnerHTML` is permitted only for SVG bodies read out of the
bundled `@iconify/json` icon sets, and must never receive API data, model
output, or anything derived from user input.

Icon bodies are static JSON compiled into the bundle at build time —
there is no injection path. Everything else in this app is attacker-influenced:
agent descriptions, knowledge text and AI replies all round-trip through the API.

Incorrect:

```tsx
<Box dangerouslySetInnerHTML={{ __html: knowledge.text }} />
<div dangerouslySetInnerHTML={{ __html: aiResponse.content }} />
```

Incorrect:

```tsx
<svg dangerouslySetInnerHTML={{ __html: agent.iconSvg }} />
```

The shape is right and the source is not — `agent.iconSvg` round-trips through
the API.

Incorrect:

```tsx
const { data } = await http.get(`/engines/${id}/badge`);

<div dangerouslySetInnerHTML={{ __html: data.svg }} />;
```

Correct:

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

Correct:

```tsx
<Iconify icon={cleanIconName(agent.icon)} width={32} height={32} />
```

For dynamic icon names prefer `Iconify`, which resolves through the icon runtime
instead of injecting markup.

Correct:

```tsx
<MarkdownRenderer>{knowledge.text}</MarkdownRenderer>
```

Attacker-influenced text renders through the markdown component map, which emits
elements rather than raw HTML.

---

### `ui/sx-over-inline-style`

**Severity: `warn`**

Style MUI components with `sx`, reserving the `style` prop for non-MUI elements
that do not accept `sx` — raw `svg`, third-party canvas nodes — and for values
that must bypass the emotion cache.

`sx` resolves theme tokens (`background.paper`, `error.main`),
responsive breakpoint objects and `&:hover` selectors; `style` resolves none of
them, so anything written there is hardcoded by construction. The codebase is
already 1013 `sx` usages against 60 `style`.

Incorrect:

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

Incorrect:

```tsx
<Card style={{ backgroundColor: "background.paper" }} />
```

`style` does not resolve theme tokens, so this sets the CSS background to the
literal string `background.paper` and renders nothing.

Incorrect:

```tsx
<Box style={{ display: "flex", padding: 16 }}>
  <Typography style={{ color: "#919EAB" }}>{agent.description}</Typography>
</Box>
```

Correct:

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

Correct:

```tsx
<Box sx={{ display: "flex", p: 2 }}>
  <Typography sx={{ color: "text.secondary" }}>{agent.description}</Typography>
</Box>
```

Correct:

```tsx
<svg
  width={width}
  height={height}
  viewBox="0 0 24 24"
  style={{ flexShrink: 0 }}
  fill="currentColor"
/>
```

A raw `svg` does not accept `sx`, which is the case `style` is reserved for.

`background.neutral` is available because `src/types/theme.d.ts` augments
`TypeBackground` with it.

---

### `ui/deterministic-per-entity-visuals`

**Severity: `warn`**

A colour, gradient or image chosen per entity is derived from that entity's id,
not from `Math.random()` and not from array position.

The value has to survive a re-render, a refetch and a reload, and it
has to agree between a card and the detail page for the same agent. Index-based
selection reshuffles the moment the list is sorted or filtered.

Incorrect:

```tsx
{agents.map((agent, index) => (
  <AgentCard key={agent.id} agent={agent} cover={backgroundUrls[index]} />
))}
```

Incorrect:

```tsx
const cover = backgroundUrls[Math.floor(Math.random() * backgroundUrls.length)];
```

The image changes on every render, and disagrees between the card and the detail
page for the same agent.

Incorrect:

```tsx
const [cover] = useState(
  () => backgroundUrls[Math.floor(Math.random() * backgroundUrls.length)]
);
```

Stable across renders and still lost on reload, and still different on the two
screens that show the same agent.

Correct:

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

Correct:

```tsx
background: getAgentGradients(agent.id, theme, allAgentIds);
```

`src/utils/gradient.ts` follows the same idea, taking the full id list so a team
of agents gets visually distinct gradients.

Correct:

```tsx
{agents.map((agent) => (
  <AgentCard
    key={agent.id}
    agent={agent}
    cover={getBackgroundUrl(agent.id)}
    allAgentIds={agents.map((a) => a.id)}
  />
))}
```

This is why `allAgentIds` is threaded from the widget through `AgentCard` and
`AgentLayout` — the gradient depends on the peer set, so it must be passed, not
recomputed locally.

Randomised copy is a deliberate exception: `src/utils/answerPool.ts` picks a
supervision reply at random because varying the wording is the point.

---

## 13. Dependencies, charts and external windows

### `deps/declare-what-you-import`

**Severity: `error`**

Every package imported from `src` appears in this project's `package.json`,
never relying on a transitive dependency of `@canmingir/link` resolving at the
top of `node_modules`.

`react-apexcharts` is imported by four files and is declared nowhere
in `dashboard/package.json`. It resolves today only because the platform package
happens to depend on it and the installer hoists it. A platform bump that drops
or nests it breaks `bun run build` with a module-not-found in code nobody
touched.

Incorrect:

```tsx
import Chart from "react-apexcharts";
```

with no `react-apexcharts` entry in `package.json`.

Incorrect:

```json
"devDependencies": {
  "react-apexcharts": "^1.4.1"
}
```

A package imported from `src` declared as a dev dependency is missing from the
production install.

Incorrect:

```json
"dependencies": {
  "react-apexcharts": "^1.4.1"
}
```

with no `apexcharts` entry — the wrapper is declared and the library it wraps is
still hoisted by luck.

Correct:

```json
"dependencies": {
  "react-apexcharts": "^1.4.1",
  "apexcharts": "^3.45.0"
}
```

Correct:

```tsx
import { useChart } from "@canmingir/link/platform/components";
```

Importing through the platform surface that is already declared is the other
valid answer.

The reverse also applies: `@mui/x-charts` sits in `devDependencies` and is
imported by nothing in `src`. Charts here are ApexCharts.

---

### `chart/options-through-use-chart`

**Severity: `warn`**

Chart options are built with `useChart` from
`@canmingir/link/platform/components`, passing only the chart-specific overrides
rather than a full hand-assembled ApexCharts options object.

`useChart` supplies the house defaults — palette, fonts, grid,
legend, tooltip theme — merged with the overrides. A hand-built options object
renders with ApexCharts defaults and visibly disagrees with every other chart on
the page.

Incorrect:

```tsx
const chartOptions = {
  chart: { type: "area", toolbar: { show: false } },
  colors: ["#00A76F"],
  stroke: { width: 2 },
  xaxis: { type: "datetime" },
};
```

Incorrect:

```tsx
const chartOptions = useChart({
  colors: ["#00A76F", "#FFAB00"],
  grid: { borderColor: "rgba(145, 158, 171, 0.2)" },
  legend: { fontFamily: "Public Sans, sans-serif" },
  xaxis: { type: "datetime" },
});
```

Overriding the house defaults `useChart` exists to supply is the same divergence
by another route.

Incorrect:

```tsx
const chartOptions = useChart({
  responsive: [{ breakpoint: 900, options: { chart: { height: 240 } } }],
});
```

Correct:

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

Correct:

```tsx
const isSmall = useMediaQuery((theme) => theme.breakpoints.down("md"));

<Chart
  type="area"
  series={series}
  options={chartOptions2}
  height={isSmall ? 240 : 360}
/>;
```

Responsive sizing uses `useMediaQuery` rather than ApexCharts' own `responsive`
array, matching `UsageChart`.

---

### `auth/postmessage-explicit-origin`

**Severity: `error`**

`postMessage` names an explicit target origin — never `"*"` — and the listener
checks `event.origin` before trusting the payload.

The OAuth popup carries an authorization `code`. Posting it with `"*"`
hands it to whatever document happens to own the opener, which is the whole
attack against popup-based OAuth.

Incorrect:

```tsx
window.opener.postMessage({ code }, "*");
```

Incorrect:

```tsx
useEffect(() => {
  const handler = (event: MessageEvent) => {
    setAuthorizationCode(event.data.code);
  };

  window.addEventListener("message", handler);

  return () => window.removeEventListener("message", handler);
}, []);
```

The listener trusts any document that can reach this window.

Incorrect:

```tsx
window.opener.postMessage({ code }, config.api);
```

An explicit origin, but the wrong one — `config.api` may be a different host from
the document that opened the popup.

Correct:

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

Correct:

```tsx
useEffect(() => {
  const handler = (event: MessageEvent) => {
    if (event.origin !== window.origin) {
      return;
    }

    setAuthorizationCode(event.data.code);
  };

  window.addEventListener("message", handler);

  return () => window.removeEventListener("message", handler);
}, []);
```

The callback page is the one legitimate page with no layout, no `<Page>` and a
`null` render — it exists only to hand the code back and close. That is not a
`layer/pages-are-containers` violation.

---

### `auth/read-tokens-from-link-namespace`

**Severity: `warn`**

Tokens are read with the two-argument `storage` form under the `link` namespace
— `storage.get("link", "accessToken")` — never from a bare key, and never held
in component state or a query string.

The platform owns the `link` namespace and writes the tokens there
after login. A bare `storage.get("accessToken")` reads a different slot and
silently yields `undefined`, which surfaces as an unauthenticated socket rather
than a visible error.

Incorrect:

```ts
const token = storage.get("accessToken");
const socket = io(host, { path, query: { token } });
```

Incorrect:

```tsx
const [token, setToken] = useState(storage.get("link", "accessToken"));
```

Holding the token in component state keeps a stale copy after a refresh and
survives in every React DevTools inspection of the tree.

Incorrect:

```tsx
navigate(`/chat?token=${token}&agentId=${agentId}`);
```

A token in the query string lands in browser history and in every referrer
header.

Correct:

```ts
const token = storage.get("link", "accessToken");

socketRef.current = io(host, {
  path,
  auth: { token },
  query: { agentId },
});
```

Correct:

```ts
const { name } = config;

const token = storage.get(name, "accessToken");
```

`useSocket` uses the app name from config as its namespace, which is the same
idea parameterised. Tokens travel in `auth`, not `query`.

---

### `chat/commands-are-data`

**Severity: `warn`**

Slash commands for the chat input are declared as data in
`src/components/ChatInput/chat.config.ts` — a `name`, `description`, `icon`, an
`action`, and a `next` chain describing the prompts — so adding a command means
adding an entry rather than branching in the editor.

`CommandList`, `CommandComponent` and the Slate editor all walk the
same declarative tree to render suggestions, collect inputs and dispatch. A
command implemented imperatively in the editor gets no suggestion entry and no
input collection.

Incorrect:

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

Incorrect:

```tsx
const CommandList = ({ query }) => {
  const commands = [
    { name: "/learn-url", description: "Learn something new from a URL" },
    { name: "/task", description: "Create a task" },
  ];

  return commands
    .filter((c) => c.name.startsWith(query))
    .map((c) => <MenuItem key={c.name}>{c.name}</MenuItem>);
};
```

A second, partial copy of the command list — the suggestions and the dispatcher
now disagree the moment either changes.

Incorrect:

```ts
{
  name: "/learn",
  description: "Learn something new",
  action: async (inputs) => {
    const type = await promptForType();

    if (type === "QA") {
      const answer = await promptForAnswer();
      return learnAction({ type, answer });
    }
  },
}
```

Branching prompts written imperatively inside `action` get no suggestion entry
and no input collection.

Correct:

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

Correct:

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

Branching prompts use a `DROPDOWN` step whose `action` maps the choice onto a key
in the next map.

Correct:

```tsx
const CommandList = ({ query }) =>
  Commands.filter((command) => command.name.startsWith(query)).map((command) => (
    <MenuItem key={command.name}>
      <Iconify icon={command.icon} />
      {command.description}
    </MenuItem>
  ));
```

The suggestion list walks the same declarative tree the dispatcher does.

The `action` functions themselves still owe a debt to
[`data/http-only-in-hooks`](#datahttp-only-in-hooks) — they call `http` directly
today. New commands should delegate to a hook.

---

## 14. Cypress infrastructure

### `test/fixtures-track-renames`

**Severity: `error`**

When a domain noun is renamed, the fixture directories, the fixture paths in
specs, and the `data-cy` names move in the same change.

The specs are not run by CI. `test.yml` runs lint and typecheck only,
and `npm test` reaches Cypress only through the `pre-push` hook — which
`prepare.cjs` writes but no `prepare` script installs. A broken fixture path
therefore fails nothing until someone runs the suite by hand.

This has already happened. Every `agents-page/*` fixture referenced by
`agents.cy.ts` and `agent.cy.ts` is missing; the files still sit under the
pre-rename `colleagues-page/` and `colleague/` directories.

Incorrect:

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

Incorrect:

```ts
cy.getBySel("colleague-card").should("have.length", 3);
```

The component now emits `data-cy="agent-card"`, so the spec selects nothing and
the assertion fails on a rename rather than on a regression.

Incorrect:

```
cypress/fixtures/agents-page/create/agent.post.json     added
cypress/fixtures/colleagues-page/create/agent.post.json kept
```

Renaming by copying leaves two trees that drift.

Correct:

```
cypress/fixtures/knowledges/knowledges.json
cypress/fixtures/knowledges/create/knowledges.url.post.json
cypress/fixtures/knowledges/delete/knowledges.qa.delete.json
cypress/fixtures/supervising/supervising.status.answered.json
```

The `knowledges` and `supervising` fixtures, whose spec references all resolve.

Correct:

```
git mv cypress/fixtures/colleagues-page cypress/fixtures/agents-page
git mv cypress/fixtures/colleague cypress/fixtures/agent
```

with the `data-cy` names and the `cy.fixture(...)` paths updated in the same
change. To check the whole suite before pushing, resolve every `cy.fixture(...)`
reference against the tree rather than trusting the specs to fail loudly.

---

### `test/typed-custom-commands`

**Severity: `warn`**

A custom command is declared on `Cypress.Chainable` inside the
`declare namespace Cypress` block at the top of `cypress/support/commands.ts`,
with real parameter types, and then registered with `Cypress.Commands.add`.

`tsconfig.json` sets `types: ["cypress"]`, so the declaration is what
gives specs autocomplete and argument checking under `typecheck` — the one gate
that does run in CI for this directory.

Incorrect:

```ts
Cypress.Commands.add("verifyAgentCard", (agent, index) => {
  cy.getBySel("agent-card-name").eq(index).should("have.text", agent.name);
});
```

Registered with no declaration, so specs get no autocomplete and no argument
checking.

Incorrect:

```ts
declare namespace Cypress {
  interface Chainable {
    verifyAgentCard(agent: any, index: any): Chainable<void>;
  }
}
```

Declared with `any`, which is a declaration that checks nothing.

Incorrect:

```ts
declare namespace Cypress {
  interface Chainable {
    setAgentIntercept(): Chainable<void>;
  }
}
```

with no matching `Cypress.Commands.add("setAgentIntercept", …)` — the type
compiles and the command does not exist at run time.

Correct:

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

Correct:

```ts
declare namespace Cypress {
  interface Chainable {
    setAgentIntercept(): Chainable<void>;
  }
}

Cypress.Commands.add("setAgentIntercept", () => {
  cy.intercept("GET", "/api/agents", { fixture: "agents-page/agents.json" });
  cy.intercept("GET", "/api/engines", { fixture: "agents-page/engines.json" });
});
```

---

### `test/intercepts-in-named-commands`

**Severity: `warn`**

Route stubs are grouped into named setup commands — `setAgentIntercept`,
`chatPageIntercept`, `platformSetup` — called from `beforeEach` or the top of a
test, not scattered through assertions.

A screen needs its whole dependency set stubbed before it mounts,
because the widgets fetch on mount and refetch on every published event. Stubbing
one route inline leaves the rest hitting a live API, and the failure surfaces as
an unrelated empty list.

Incorrect:

```ts
it("add a new agent", () => {
  cy.visit("/agents");
  cy.getBySel("add-new-button").click();
  cy.intercept("POST", "/api/agents", { id: "1" });
  cy.intercept("GET", "/api/agents", []);
});
```

Both stubs are registered after the screen has mounted and already fetched.

Incorrect:

```ts
beforeEach(() => {
  cy.intercept("GET", "/api/agents", { fixture: "agents-page/agents.json" });
  cy.visit("/agents");
});
```

One route stubbed and the rest — engines, projects, the platform config — hitting
a live API, so the failure surfaces as an unrelated empty list.

Incorrect:

```ts
it("add a new agent", () => {
  cy.visit("/agents");
  cy.platformSetup(teamId, "agents-page/team.json", config);
});
```

`platformSetup` seeds storage and the platform routes, so it has to run before
`cy.visit`.

Correct:

```ts
beforeEach(() => {
  cy.fixture("agents-page/teams.json").then((teams) => {
    cy.platformSetup(teams[1].id, "agents-page/team.json", config);
    cy.viewport(1280, 720);
  });

  cy.fixture("agents-page/create/agent.post.json").as("createdAgent");
});
```

Correct:

```ts
it("add a new agent", function () {
  cy.visit("/agents");
  cy.setAgentIntercept();

  cy.getBySel("add-new-button").click();
  cy.waitEvent("AGENT_WIZARD_OPENED");
});
```

Correct:

```ts
Cypress.Commands.add("chatPageIntercept", () => {
  cy.intercept("GET", "/api/agents/*", { fixture: "chat-page/agent.json" });
  cy.intercept("GET", "/api/sessions*", { fixture: "chat-page/sessions.json" });
  cy.intercept("POST", "/api/messages", {
    fixture: "chat-page/messages/messages.reply.post.json",
  });
});
```

`platformSetup(itemId, itemFixturePath, config)` seeds storage and the platform
routes so the app boots with a selected team. Call it before `cy.visit`.

---

### `test/fixture-layout`

**Severity: `warn`**

Fixtures live at
`cypress/fixtures/<feature>-page/<scenario>/<resource>.<verb>.json`, where the
verb is the HTTP method the fixture answers (`.get.json`, `.post.json`,
`.put.json`, `.patch.json`, `.delete.json`) and a fixture shared across
scenarios sits at the feature root without a verb.

A single test walks several states of the same resource — the list
before the create, the POST response, the list after. Encoding scenario and verb
in the path is what keeps them distinguishable.

Incorrect:

```
cypress/fixtures/agents2.json
cypress/fixtures/agentsAfterCreate.json
cypress/fixtures/newAgentResponse.json
```

No feature directory, no scenario, no verb — and no way to tell which state of
the list each one holds.

Incorrect:

```
cypress/fixtures/agents-page/create/agent.json
cypress/fixtures/agents-page/create/agentAfter.json
```

Same scenario, two states, and nothing in the names says which is the POST
response and which is the list after it.

Incorrect:

```
cypress/fixtures/agentsPage/create/agent.post.json
```

Correct:

```
cypress/fixtures/knowledges/knowledges.json
cypress/fixtures/knowledges/create/knowledges.url.post.json
cypress/fixtures/knowledges/create/knowledges.qa.post.json
cypress/fixtures/knowledges/edit/knowledges.text.json
cypress/fixtures/knowledges/delete/knowledges.get.json
cypress/fixtures/chat-page/messages/messages.reply.post.json
```

Correct:

```
cypress/fixtures/agents-page/agents.json
cypress/fixtures/agents-page/create/agent.post.json
cypress/fixtures/agents-page/create/agents.get.json
cypress/fixtures/agents-page/update/agent.put.json
cypress/fixtures/agents-page/delete/agents.get.json
```

The shared list sits at the feature root without a verb; each scenario's states
carry theirs.

---

## 15. App robustness and shared state

### `app/error-boundary-at-route`

**Severity: `error`**

A render throw must be contained — there is no error boundary anywhere in this
app today, so any exception during render unmounts the entire tree and leaves a
blank page with the error only in the console.

This is not hypothetical. `useApi` initialises `data` to `null`, and
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

Incorrect:

```tsx
const routes = [
  {
    container: <Container />,
    childs: [{ layout: <DashboardLayout />, pages: [...] }],
  },
];
```

with no boundary between the container and the pages, and widgets that index into
possibly-null data.

Incorrect:

```tsx
return agents.map((agent) => <AgentCard key={agent.id} agent={agent} />);
```

One failed `GET /agents` throws `Cannot read properties of null` and blanks the
application.

Incorrect:

```tsx
window.addEventListener("error", (event) => {
  platform.logger.error(event.error);
});
```

A global error listener logs the throw and does not contain it — React has
already unmounted the tree.

Correct:

```tsx
if (error) {
  return <Typography color="error.main">{error}</Typography>;
}

if (!agents?.length) {
  return <AddNewButton addNew={"Agent"} onClickFunction={onCreate} />;
}

return agents.map((agent) => <AgentCard key={agent.id} agent={agent} />);
```

Guard the data, which removes the throw.

Correct:

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

Contain what the guard misses, at the container.

Correct:

```tsx
class RouteErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <Typography color="error.main">
          Something went wrong loading this screen.
        </Typography>
      );
    }

    return this.props.children;
  }
}
```

The guard is the fix; the boundary is the backstop. Both are required —
[`data/handle-async-states`](#datahandle-async-states) is the rule that would
have prevented this specific crash, and it is currently unmet across every
widget.

---

### `state/no-module-level-mutable-singletons`

**Severity: `error`**

Cross-component state is never held in a mutable module-scope object reached
through an exported setter: signalling goes through `publish` / `useEvent`, and
parent-to-child goes through props.

A module singleton is initialised once per module instance, not per
mount. Two `PopChat` instances overwrite each other's callback, the value
survives navigation with no way to reset it, nothing re-renders when it changes,
and it is invisible to the event bus that the rest of the app is tested through
(`cy.waitEvent`).

Incorrect:

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

Incorrect:

```ts
let currentAgentId: string | null = null;

export const setCurrentAgent = (agentId: string) => {
  currentAgentId = agentId;
};

export const getCurrentAgent = () => currentAgentId;
```

Nothing re-renders when it changes, and it survives navigation with no way to
reset it.

Incorrect:

```ts
export const sessionCache: Record<string, Message[]> = {};

sessionCache[sessionId] = messages;
```

Correct:

```ts
socket.on("ai_message", ({ content }) => {
  setConversations((prev) => [...prev, { role: "AI", content }]);
  publish("AI_RESPONDED", { content });
});
```

Correct:

```tsx
const [aiResponded] = useEvent("AI_RESPONDED", null);

useEffect(() => {
  if (aiResponded?.content) {
    appendMessage(aiResponded.content);
  }
}, [aiResponded]);
```

Correct:

```tsx
const TABS = [
  { value: "profile", label: "Profile" },
  { value: "tasks", label: "Tasks" },
  { value: "api", label: "API" },
];

function AgentLayout({ agent }) {
  const [currentTab, setCurrentTab] = useState("profile");
}
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

The title is the only per-route signal in the browser tab and in
history. Skipping `<Page>` leaves the previous route's title in place, so back
and forward navigation is unreadable.

Incorrect:

```tsx
function Cost() {
  return (
    <SingleScrollableLayout title="Cost">
      <CostWidget />
    </SingleScrollableLayout>
  );
}
```

Incorrect:

```tsx
function Cost() {
  useEffect(() => {
    document.title = "Cost";
  }, []);

  return <CostWidget />;
}
```

Setting the title by hand skips the `{config.name} - {name}` format and races
`react-helmet-async`.

Incorrect:

```tsx
function KnowledgeBase() {
  return (
    <SingleScrollableLayout title={"Knowledge Base"}>
      <Page name={"Knowledge Base"} />
      <Knowledge teamId={teamId} />
    </SingleScrollableLayout>
  );
}
```

Correct:

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

Correct:

```tsx
<Helmet>
  <meta charSet="utf-8" />
  <title>
    {config.name} - {name}
  </title>
</Helmet>
```

Correct:

```tsx
return (
  <>
    <Page
      name={"Agent"}
      links={[{ name: "Agents", href: "/agents" }, { name: agent?.name }]}
    />
    <AgentLayout agent={agent} loading={loading} />
  </>
);
```

`links` is what turns `Page` into breadcrumbs as well as a title.

`SingleScrollableLayout`'s `title` is the on-screen heading; `Page`'s `name` is
the document title. They are different concerns and both are needed.
`callback.tsx` is the documented exception — see
[`auth/postmessage-explicit-origin`](#authpostmessage-explicit-origin).

---

### `state/query-string-for-shareable-view-state`

**Severity: `warn`**

View state that should survive a reload or be shareable by URL — the active tab,
a selected filter — lives in the query string, written with
`navigate(..., { replace: true })`, while transient state stays in `useState`.

`replace: true` keeps tab switches out of the history stack, so the
browser back button leaves the page rather than walking back through tabs. The
component still needs local state, because the query string is the source of
truth only on entry.

Incorrect:

```tsx
const [currentTab, setCurrentTab] = useState("profile");

const handleTabChange = (newTab: string) => {
  setCurrentTab(newTab);
  navigate(`${location.pathname}?tab=${newTab}`);
};
```

Reloading returns to `profile`, and back walks tab by tab.

Incorrect:

```tsx
const [currentTab, setCurrentTab] = useState(
  new URLSearchParams(location.search).get("tab") ?? "profile"
);
```

The query string is read without validating it against the known tab list, so
`?tab=<script>` becomes component state.

Incorrect:

```tsx
const [hoveredRow, setHoveredRow] = useState(null);

useEffect(() => {
  navigate(`${location.pathname}?hovered=${hoveredRow}`, { replace: true });
}, [hoveredRow]);
```

Transient state does not belong in the URL — nobody wants to share a hover.

Correct:

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

Correct:

```tsx
const [hoveredRow, setHoveredRow] = useState(null);
```

Transient state stays in `useState`.

The value read out of the query string is validated against the known tab list
before it is trusted — `visibleTabs.some((tab) => tab.value === tabFromQuery)` —
because it is user-supplied input.

---

## 16. Tooling hygiene

### `deps/no-unused-declared`

**Severity: `warn`**

A package declared in `package.json` is imported by something, and entries that
nothing uses are removed.

The companion to
[`deps/declare-what-you-import`](#depsdeclare-what-you-import). Unused entries
still install, still pull transitive trees, still appear in audit reports, and
still get upgraded by dependency bots — for code that does not exist.

Incorrect:

```json
"dependencies": {
  "axios-retry": "^3.5.0"
}
```

Incorrect:

```json
"devDependencies": {
  "@mui/x-charts": "^8.28.2"
}
```

Neither is imported anywhere under `src`.

Incorrect:

```json
"devDependencies": {
  "@testing-library/jest-dom": "^6.4.2"
}
```

removed while `jest.setup.ts` still imports it — the mirror mistake, and the
reason [`deps/declare-what-you-import`](#depsdeclare-what-you-import) is the
other half of this rule.

Correct:

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

Correct:

```json
"devDependencies": {
  "cypress": "^13.13.0",
  "eslint": "^8.57.0",
  "typescript": "^5.5.3"
}
```

Tooling with no `src` import earns its place through a script that runs it.

---

### `deps/no-dead-tooling`

**Severity: `warn`**

A configured tool is either wired up and working or removed, with no config
files left behind for a runner that never executes.

Dead config reads as coverage that does not exist. Three pieces of
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

Incorrect:

```ts
export default {
  testEnvironment: "jsdom",
};
```

with `jest.setup.ts` importing an undeclared package and zero tests to run.

Incorrect:

```js
fs.writeFileSync(
  ".git/hooks/pre-push",
  "#!/bin/sh\nnpm run lint && npm test\n"
);
```

in `prepare.cjs`, with no `prepare` script in `package.json` to invoke it — the
hook exists only for developers who ran the file by hand.

Incorrect:

```json
{
  "compilerOptions": {
    "paths": { "@/*": ["src/*"] }
  }
}
```

An alias nothing wires into Vite, and that
[`ts/relative-imports`](#tsrelative-imports) forbids using.

Correct:

```json
"scripts": {
  "test:unit": "jest",
  "test": "start-server-and-test dev http://localhost:5173 cypress:run",
  "prepare": "node prepare.cjs"
}
```

Commit to it — declare `jest`, `@testing-library/jest-dom` and
`@testing-library/react`, reference `jest.setup.ts` from `setupFilesAfterEach`,
add a distinct script, and run it in `test.yml`.

Correct:

```
git rm jest.config.ts jest.setup.ts
```

Or delete the config and let Cypress be the whole story. Either is defensible;
the current middle is not.

Correct:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "types": ["cypress"]
  }
}
```

with the unused `paths` entry removed.

---

### `import/one-declaration-per-module`

**Severity: `warn`**

Import each module once per file, merging the members into a single declaration
rather than splitting them across several.

`sort-imports` sorts declarations by their first member, so splitting
one module across declarations scatters them through the import block and hides
how much of a module a file depends on. A merged multi-member import sorts once
and reads as one dependency. ESLint does not catch this — `no-duplicate-imports`
is not enabled.

Incorrect:

```tsx
import { Iconify } from "@canmingir/link/platform/components";
import { LoadingMessage } from "@canmingir/link/platform/components";
import { MessageList } from "@canmingir/link/platform/components";
import { PresetSelector } from "@canmingir/link/platform/components";

import { Scrollbar } from "@canmingir/link/platform/components";
```

Incorrect:

```tsx
import {
  FormProvider,
  RHFTextField,
} from "@canmingir/link/platform/components";
import { Iconify, Label } from "@canmingir/link/platform/components";
```

Incorrect:

```tsx
import { BlueprintCommands } from "../../components/ChatInput/chat.config";
import { Commands } from "../../components/ChatInput/chat.config";
import { Types } from "../../components/ChatInput/chat.config";
```

Correct:

```tsx
import {
  FormProvider,
  Iconify,
  Label,
  RHFTextField,
} from "@canmingir/link/platform/components";
```

Correct:

```tsx
import {
  Iconify,
  LoadingMessage,
  MessageList,
  PresetSelector,
  Scrollbar,
} from "@canmingir/link/platform/components";
```

Correct:

```tsx
import {
  BlueprintCommands,
  Commands,
  Types,
} from "../../components/ChatInput/chat.config";
```

Members stay alphabetical inside the braces, so the merged form still satisfies
`sort-imports`. Four files split a platform import today: `PopChat.tsx` across
five declarations, and `TeamChart.tsx`, `KnowledgeTable.tsx` and
`AddItemDialog.tsx` across two each.

---

### `data/sample-data-at-module-scope`

**Severity: `warn`**

Demo, seed and placeholder data is a named module-scope constant declared above
the component and named for what it is, never a fake record inlined among real
fetched values inside a render.

Placeholder data that sits in the render body is indistinguishable
from state derived from the API, so it survives every review that is looking for
the real fetch. Hoisting and naming it makes it greppable when the endpoint
finally lands.

Incorrect:

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

Incorrect:

```tsx
const rows = knowledges.concat([
  { id: "placeholder", type: "URL", url: "https://example.com" },
]);
```

A fake record mixed into fetched values is invisible to any review looking for
the real fetch.

Incorrect:

```tsx
function CostWidget() {
  const series = [{ name: "Spend", data: [12, 40, 28, 51, 42] }];

  return <Chart series={series} options={chartOptions} />;
}
```

Correct:

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

Correct:

```tsx
const placeholderSpendSeries = [{ name: "Spend", data: [12, 40, 28, 51, 42] }];

function CostWidget() {
  return <Chart series={placeholderSpendSeries} options={chartOptions} />;
}
```

Named for what it is, hoisted out of the render, and greppable when the endpoint
lands.

Correct:

```tsx
const SAMPLE_MANAGER = {
  name: "Jack Shephard",
  role: "CAO - Chief AI Officer",
  avatar: ":5:",
};

function OrganizationalChart({ variant = "simple", sx }) {
  const { organization, loading } =
    useOrganizations().getOrganizationById(organizationId);

  return <Tree label={organization?.manager ?? SAMPLE_MANAGER} />;
}
```

`SampleFlow.tsx` and `SampleNode.tsx` under `BlueprintFlow/Samples/` take this
further and give sample data its own directory, which is the right move once
there is more than one constant.

---

## 17. Accessibility

### `a11y/icon-button-needs-label`

**Severity: `error`**

A control whose only content is an icon carries an `aria-label` describing the
action, covering `IconButton`, `Fab`, and any clickable `Box` wrapping an
`Iconify`.

`Iconify` renders an SVG with no text node, so an icon-only button has
no accessible name at all — a screen reader announces "button" and nothing else.
Not one of the 51 `<IconButton>` instances in `src` has an `aria-label` today, so
every menu, close, delete and expand control in this app is unlabelled.

`data-cy` does not help here. It is a test hook with no accessibility semantics,
and the two are not substitutes — a control generally needs both.

Incorrect:

```tsx
<IconButton onClick={popover.onOpen} sx={{ position: "absolute", top: 8, right: 8 }}>
  <Iconify icon="eva:more-vertical-fill" />
</IconButton>
```

Incorrect:

```tsx
<Box onClick={onExpand} sx={{ cursor: "pointer" }}>
  <Iconify icon="eva:arrow-ios-downward-fill" />
</Box>
```

A clickable `Box` wrapping an `Iconify` is an icon-only control with no
accessible name and no role either.

Incorrect:

```tsx
<IconButton onClick={onDelete} data-cy="agent-card-menu-delete">
  <Iconify icon="solar:trash-bin-trash-bold" />
</IconButton>
```

`data-cy` is a test hook with no accessibility semantics — the two are not
substitutes.

Incorrect:

```tsx
<IconButton onClick={onDelete} aria-label="Trash icon">
  <Iconify icon="solar:trash-bin-trash-bold" />
</IconButton>
```

Correct:

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

Correct:

```tsx
<IconButton
  onClick={onDelete}
  aria-label={`Delete ${agent.name}`}
  data-cy="agent-card-menu-delete"
>
  <Iconify icon="solar:trash-bin-trash-bold" />
</IconButton>
```

Correct:

```tsx
<MenuItem data-cy="agent-card-menu-edit" onClick={onEdit}>
  Edit
</MenuItem>
```

A control that already contains text needs no label — the `MenuItem`s in the
popover read "View", "Edit", "Delete" and are fine as they are. Prefer naming the
target, not the glyph: "Delete agent", not "Trash icon".

---

### `a11y/dialog-labelled-by`

**Severity: `warn`**

A `Dialog` sets `aria-labelledby` pointing at its `DialogTitle` id, and
`aria-describedby` pointing at its `DialogContentText` id when it has body copy.

Without them the dialog announces as an unnamed group, so a screen
reader user entering a confirmation prompt is not told what they are confirming.
`ConfirmationDialog` is the only one of the dialogs in `src` that does this.

Incorrect:

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

Incorrect:

```tsx
<Dialog open={open} onClose={onClose} aria-labelledby="alert-dialog-title">
  <DialogTitle>{title}</DialogTitle>
</Dialog>
```

The attribute points at an id that no element carries, so the dialog is still
unnamed.

Incorrect:

```tsx
<Dialog open={open} aria-label="Dialog">
  <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
</Dialog>
```

A generic `aria-label` overrides the title it should have pointed at.

Correct:

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

Correct:

```tsx
<Dialog
  open={open}
  onClose={onClose}
  aria-labelledby={`delete-${item.id}-title`}
  aria-describedby={`delete-${item.id}-description`}
>
  <DialogTitle id={`delete-${item.id}-title`}>Confirm Delete</DialogTitle>
  <DialogContent>
    <DialogContentText id={`delete-${item.id}-description`}>
      Are you sure you want to delete {item.name}?
    </DialogContentText>
  </DialogContent>
</Dialog>
```

The ids must be unique on the page. `ConfirmationDialog` gets away with the fixed
`alert-dialog-title` because only one instance mounts at a time; a dialog that
can stack needs an id derived from its subject.

---

## 18. Storybook, resolution and lint scope

### `lint/no-blanket-disable`

**Severity: `error`**

Never disable ESLint for a whole file with a bare `/* eslint-disable */` — scope
every suppression to the specific rule, preferring the single-line form.

`lint` runs with `--max-warnings 0` and is one of only two checks CI
performs. A blanket disable removes the file from that gate entirely — not just
the rule that was inconvenient, but `no-eval`, `eqeqeq`, `react-hooks/rules-of-hooks`
and everything else. Two files do this today, and one of them,
`SupervisingChat.tsx`, is over a thousand lines with data hooks and dialogs in
it.

Incorrect:

```ts
/* eslint-disable */
import IconButton from "@mui/material/IconButton";
```

Incorrect:

```ts
/* eslint-disable */
```

as the first line of a thousand-line file with data hooks and dialogs in it.

Incorrect:

```ts
/* eslint-disable sort-imports, react-hooks/exhaustive-deps, no-unused-vars */
```

Three rules disabled for a whole file where one line needed one of them.

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

For a single occurrence prefer the line form, as
[`effect/scoped-deps-disable`](#effectscoped-deps-disable) describes.

---

### `story/theme-decorator-in-preview`

**Severity: `error`**

`.storybook/preview.ts` must wrap every story in the same theme provider the app
mounts, so stories render against the real palette.

The app's theme arrives through `<Platform>` from `@canmingir/link`
in `src/index.tsx`, and `src/types/theme.d.ts` augments it with
`background.neutral`, `customShadows.card` and the `profile-card` variants.
`preview.ts` currently declares only `actions` and `controls` matchers and
provides no theme, so every token this codebase relies on —
`bgcolor: "background.paper"`, `color: "text.secondary"`, `variant="profile-card"` —
falls back to MUI defaults or renders as nothing. A story that looks right in
Storybook can look wrong in the app, and vice versa, which makes the whole tool
untrustworthy.

Incorrect:

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

Incorrect:

```tsx
export const Normal = {
  args: { agent },
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <Story />
      </ThemeProvider>
    ),
  ],
};
```

A per-story decorator is the same wrapper repeated ninety times, and every story
that forgets it renders against MUI defaults.

Incorrect:

```tsx
const preview = {
  decorators: [
    (Story) => (
      <ThemeProvider theme={createTheme()}>
        <Story />
      </ThemeProvider>
    ),
  ],
};
```

A bare MUI theme, not the one `<Platform>` supplies, so `background.neutral`,
`customShadows.card` and the `profile-card` variants are still missing.

Correct:

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

Correct:

```tsx
const preview = {
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <MemoryRouter>
          <Story />
        </MemoryRouter>
      </ThemeProvider>
    ),
  ],
};
```

The decorator needs JSX, so `preview.ts` becomes `preview.tsx`. Components that
also read the event bus or router need those providers in the decorator too —
which is a good reason to keep stories to the presentational layer, per the next
rule.

---

### `import/no-file-extensions`

**Severity: `warn`**

Relative imports omit the file extension, so never write `./AgentCard.js` for a
file that is `AgentCard.tsx`.

26 import sites carry an extension, and every one of them names an
extension the file does not have — `.js` and `.jsx` pointing at `.ts` and
`.tsx`. They resolve only because `moduleResolution: "bundler"` and the Vite
resolver rewrite them. The extension therefore conveys nothing true, breaks a
plain text search for the real filename, and misleads anyone converting the file.

Incorrect:

```ts
export { default } from "./AgentCard.js";
```

Incorrect:

```ts
import { BlueprintCommands } from "../../components/ChatInput/chat.config.js";
import ChatInputCommandEditor from "../../components/ChatInput/ChatInputCommandEditor.js";
import { Commands } from "../../components/ChatInput/chat.config.js";
```

Three declarations, one module, and an extension that matches no file on disk —
this also breaks
[`import/one-declaration-per-module`](#importone-declaration-per-module).

Incorrect:

```ts
import Form from "./Form.jsx";
import FormItemTypes from "../../constants/FormItemTypes.js";
```

Incorrect:

```ts
import AgentCard from "../../components/AgentCard/AgentCard.tsx";
```

The extension is even accurate here, and it is still noise the resolver does not
need and a rename has to chase.

Correct:

```ts
export { default } from "./AddNewButton";
```

Correct:

```ts
import {
  BlueprintCommands,
  Commands,
  Types,
} from "../../components/ChatInput/chat.config";
```

Correct:

```ts
import Form from "./Form";
import FormItemTypes from "../../constants/FormItemTypes";
```

---

### `component/barrel-is-index`

**Severity: `warn`**

The barrel file in a component folder is named `index.ts`, not after the
component.

The barrel exists so importers can write the folder path. A barrel
named `TitleBar.ts` sitting beside `TitleBar.tsx` gives the folder two files that
differ only by extension, and `from "../TitleBar/TitleBar"` becomes genuinely
ambiguous to a reader — it resolves to the barrel, not the component.

Incorrect:

```
src/components/TextFieldWithTitle/
  TextFieldWithTitle.ts
  TextFieldWithTitle.tsx
  styles.ts
```

Incorrect:

```
src/components/TitleBar/
  TitleBar.ts
  TitleBar.tsx
  styles.ts
```

`from "../TitleBar/TitleBar"` resolves to the barrel, not the component, and a
reader cannot tell which was meant.

Incorrect:

```
src/components/AgentCard/
  AgentCard.tsx
  barrel.ts
  styles.ts
```

Correct:

```
src/components/VoiceGeneratorPanel/
  VoiceGeneratorPanel.tsx
  index.ts
  styles.ts
```

Correct:

```
src/components/AddNewButton/
  AddNewButton.tsx
  index.ts
  styles.ts
```

Correct:

```
src/components/TitleBar/
  TitleBar.tsx
  index.ts
  styles.ts
```

---

### `story/cover-presentational-components`

**Severity: `warn`**

A component in `src/components/` that renders from props alone should have a
`ComponentName.stories.ts` beside it, exporting a named case per meaningful
state.

`.storybook/main.ts` globs `../src/**/*.stories.@(js|jsx|ts|tsx)` and
finds exactly two files — `Form.stories.ts` and `colors.stories.mdx` — against
roughly ninety component folders. Stories are the only place the presentational
layer is exercised in isolation, and they are the payoff for
[`layer/no-data-access-in-components`](#layerno-data-access-in-components): a
component that fetches its own data cannot have one.

Incorrect:

```
src/components/AgentCard/
  AgentCard.tsx
  index.ts
  styles.ts
```

A component with an icon state, an avatar fallback, a missing-description
fallback and a popover, and no story exercising any of them.

Incorrect:

```ts
export default {
  title: "Nucleoid/AgentCard",
  component: AgentCard,
};

export const Default = { args: { agent } };
```

One export for a component with four visual states — the story covers the state
that was easiest to write.

Incorrect:

```ts
import AgentsWidget from "./AgentsWidget";

export default {
  title: "Nucleoid/AgentsWidget",
  component: AgentsWidget,
};

export const Normal = { args: { teamId: "cb16e069" } };
```

A widget fetches its own data, so the story renders a spinner and then an error.

Correct:

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

Correct:

```ts
import AgentCard from "./AgentCard";

export default {
  title: "Nucleoid/AgentCard",
  component: AgentCard,
  tags: ["autodocs"],
};

const agent = {
  id: "72ef5b08-b4a9-42b7-bb0a-22d40e56798b",
  name: "subscription_agent",
  description: "A agent optimized for subscription tasks.",
};

export const WithIcon = { args: { agent: { ...agent, icon: ":5:" } } };

export const AvatarFallback = { args: { agent } };

export const WithoutDescription = {
  args: { agent: { ...agent, description: "" } },
};
```

One export per state, named for the state. `main.ts` sets
`docs: { autodocs: "tag" }`, so a `tags: ["autodocs"]` on the default export
generates the docs page.

The existing `Form.stories.ts` also shows what not to copy: its imports are
`"./Form.jsx"` and `"../../constants/FormItemTypes.js"`, neither of which is a
real filename — see
[`import/no-file-extensions`](#importno-file-extensions).

---

## 19. Naming and React correctness

### `react/no-index-keys-for-data`

**Severity: `error`**

A list rendered from fetched data keys on the entity id, with `key={index}`
permitted only for fixed-length placeholder arrays that hold no state.

React uses the key to decide which DOM node and which component state
belongs to which item. With an index key, deleting the second of five rows makes
rows three through five inherit the state of the rows above them. This bites
hardest exactly where the codebase uses it: `KnowledgeTable` renders paginated,
type-filtered rows with `key={index}` over a `slice`, so the key is not even
stable across pages, and rows carry selection state.

Incorrect:

```tsx
{knowledges
  .slice((page - 1) * rowsPerPage, page * rowsPerPage)
  .map((row, index) => (
    <TableRow hover key={index} tabIndex={-1}>
      <TableCell>{row.type}</TableCell>
    </TableRow>
  ))}
```

Incorrect:

```tsx
{conversations.map((message, index) => (
  <TeamChatMessageItem key={index} message={message} />
))}
```

Messages arrive by socket and prepend, so every existing item inherits the wrong
key on the next reply.

Incorrect:

```tsx
{agents.map((agent, index) => (
  <AgentCard key={`agent-${index}`} agent={agent} />
))}
```

Prefixing the index does not make it an identity.

Correct:

```tsx
{knowledges
  .slice((page - 1) * rowsPerPage, page * rowsPerPage)
  .map((row) => (
    <TableRow hover key={row.id} tabIndex={-1}>
      <TableCell>{row.type}</TableCell>
    </TableRow>
  ))}
```

Correct:

```tsx
{agents.map((agent) => (
  <AgentCard key={agent.id} agent={agent} />
))}
```

Correct:

```tsx
{Array.from({ length: 2 }).map((_, index) => (
  <Grid key={index} size={{ xs: 12, sm: 12, md: 6, lg: 4 }}>
    <AgentsSkeleton />
  </Grid>
))}
```

The permitted case — a fixed placeholder array with no identity and no state.

Of the 32 index-key sites in `src`, the skeletons are fine and the data lists are
not. Check what the array holds before copying either.

---

### `naming/file-matches-default-export`

**Severity: `error`**

A file's default export has the same name as the file: a component in
`AgentCard.tsx` is `AgentCard`, and a hook in `useAgents.ts` is `useAgents`.

The default export name is what every import site chooses, and the
filename is what search and the file tree show. When they disagree, neither
leads to the other — `import useTeam from "../hooks/useTeams"` in `agents.tsx`
is correct today and reads like a mistake, and grepping for `SettingsMenuWidget`
misses the component because it is actually spelled `SettingsMenuWigdet`.

Incorrect:

```tsx
function SettingsMenuWigdet({ open, onClose }) {
  return <Menu open={open} onClose={onClose} />;
}

export default SettingsMenuWigdet;
```

in `src/widgets/SettingsMenuWidget/SettingsMenuWidget.tsx` — grepping for the
folder name misses the component.

Incorrect:

```ts
function useTeam() {
  return { getTeams, getTeamById, createTeam, updateTeam, deleteTeam };
}

export default useTeam;
```

in `src/hooks/useTeams.ts`, so `import useTeam from "../hooks/useTeams"` is
correct and reads like a mistake.

Incorrect:

```tsx
function InlineChromiumBugfix() {
  return <span contentEditable={false} />;
}

export default InlineChromiumBugfix;
```

in `InlineChromiumBugFix.tsx` — one capital apart, and unfindable by either
spelling.

Correct:

```ts
function useAgents() {
  return { getTeamAgents, createAgent, deleteAgent };
}

export default useAgents;
```

in `src/hooks/useAgents.ts`.

Correct:

```tsx
function SettingsMenuWidget({ open, onClose }) {
  return <Menu open={open} onClose={onClose} />;
}

export default SettingsMenuWidget;
```

in `src/widgets/SettingsMenuWidget/SettingsMenuWidget.tsx`.

Correct:

```ts
function useTeams() {
  return { getTeams, getTeamById, createTeam, updateTeam, deleteTeam };
}

export default useTeams;
```

in `src/hooks/useTeams.ts`.

Thirteen files disagree today — ten components and three hooks. Renaming the
export is usually the smaller change, but pick
whichever name is right for the thing and move the other to match.

---

### `naming/pascal-case-component-files`

**Severity: `warn`**

Files exporting a React component are `PascalCase.tsx`, hooks are `useThing.ts`,
and everything else — utils, config, adapters — is `camelCase.ts`.

The case is the fastest signal of what a file contains, and it is
consistent across all but three files in `src`.

Incorrect:

```
src/widgets/OrganizationChart/common/standard-node.tsx
src/widgets/OrganizationChart/common/simple-node.tsx
src/widgets/OrganizationChart/common/group-node.tsx
```

Incorrect:

```
src/hooks/UseKnowledge.ts
src/hooks/knowledge.ts
```

Incorrect:

```
src/utils/CleanIconName.ts
src/components/BlueprintFlow/FlowAdapter.ts
```

PascalCase on modules that export no component reads as a component in the file
tree.

Correct:

```
src/widgets/OrganizationChart/common/StandardNode.tsx
src/components/BlueprintFlow/AIResponseNode.tsx
```

`AIResponseNode.tsx` is the precedent for flow-node components: same subsystem,
same purpose, PascalCase.

Correct:

```
src/hooks/useKnowledge.ts
src/hooks/useAgents.ts
```

Correct:

```
src/components/BlueprintFlow/flowAdapter.ts
src/utils/cleanIconName.ts
src/components/ChatInput/chat.config.ts
```

---

### `naming/domain-spelling`

**Severity: `warn`**

Directory, file, component and prop names spell the domain term correctly and use
the same word the hook and the API use.

A misspelled name is unfindable. Someone looking for the statistics
widget searches `Statistics` — which matches `useStatistics` and
`GET /statistics` but not the `StaticsWidget` folder that renders it.

Incorrect:

```
src/widgets/DepartmantCharts/
src/widgets/StaticsWidget/StaticsWidget.tsx
src/components/ChatInput/MentiontText.tsx
```

Incorrect:

```tsx
function SettingsMenuWigdet({ open, onClose }) {
  return <Menu open={open} onClose={onClose} />;
}
```

exported from `SettingsMenuWidget.tsx`.

Incorrect:

```tsx
function AgentCard({ colleague }: { colleague: { name: string } }) {
  return <Card>{colleague.name}</Card>;
}
```

A prop still carrying the pre-rename noun, so the component and the API disagree
about what the thing is called.

Correct:

```
src/widgets/DepartmentCharts/
src/widgets/StatisticsWidget/StatisticsWidget.tsx
src/components/ChatInput/MentionText.tsx
```

matching `src/hooks/useStatistics.ts` and the `/statistics` endpoint it calls.

Correct:

```tsx
function AgentCard({ agent }: { agent: { name: string } }) {
  return <Card>{agent.name}</Card>;
}
```

Correct:

```ts
const response = await http.post("/projects", team);

publish("PROJECT_CREATED", { projectId: response.data.id });

return { teams: data };
```

The team-versus-project split is a different thing and is not a spelling problem:
`useTeams` deliberately calls `/projects` and publishes `PROJECT_CREATED`,
because the API noun is `project` and the UI noun is `team`. Keep the API noun on
the wire and the UI noun in the interface, as that hook does.

---

### `hooks/default-export`

**Severity: `warn`**

A hook module default-exports its hook, reserving named exports for the extra
helpers the module also provides.

26 of the 27 hooks default-export, so `import useThing from "../hooks/useThing"`
is the shape every call site expects. `useSocket` is the lone named export and
has to be imported differently for no reason.

Incorrect:

```ts
export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  return socketRef.current;
};
```

The lone named export among 27 hooks, so it has to be imported differently for no
reason.

Incorrect:

```ts
export function useAgents() {
  return { getTeamAgents, createAgent, deleteAgent };
}

export default { useAgents };
```

Incorrect:

```ts
const useChatSessions = (agentId: string) => {
  return { sessions, addSession, readSessions };
};

export default useChatSessions;
```

`readSessions` is needed outside a component, and burying it in the hook's return
value makes that impossible.

Correct:

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

Correct:

```ts
function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  return socketRef.current;
}

export default useSocket;
```

The hook is the default; `readSessions` is a named export precisely because
`useSession` needs it outside a component, and types are named exports too.

---

### `ui/emotion-css-scoped-to-slate`

**Severity: `warn`**

`@emotion/css` and its `css` template literal are confined to the Slate editor
subtree under `src/components/ChatInput/`, and everywhere else styles with `sx`.

Slate's leaf and element renderers hand you a `className`, not an MUI
component, so `sx` has nothing to attach to and a real class name is required.
That is a genuine constraint, not a preference — but it applies only there. Five
files use it today and all five are in `ChatInput/`; a sixth anywhere else would
be a second styling system.

Incorrect:

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

Incorrect:

```tsx
import { css } from "@emotion/css";

const KnowledgeTable = ({ rows }) => (
  <Table
    className={css`
      width: 100%;
    `}
  />
);
```

Incorrect:

```tsx
const renderLeaf = ({ attributes, children, leaf }) => (
  <span {...attributes} style={{ fontWeight: leaf.bold ? 600 : 400 }}>
    {children}
  </span>
);
```

Slate hands you a `className`, and reaching for `style` instead loses the
pseudo-selectors the editor's leaf rendering needs.

Correct:

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

Correct:

```tsx
import { css } from "@emotion/css";

const renderLeaf = ({ attributes, children, leaf }) => (
  <span
    {...attributes}
    className={css`
      font-weight: ${leaf.bold ? 600 : 400};
    `}
  >
    {children}
  </span>
);
```

Correct:

```tsx
<Table sx={{ width: "100%" }} />
```

Everywhere outside `ChatInput/`, `sx` is the styling system.

The zero-width span exists to work around a Chromium selection bug at inline-void
boundaries in `contentEditable`. Keep workarounds like this in one small named
component rather than inlining them at each call site — and note this one is also
a `naming/file-matches-default-export` case, since the file is
`InlineChromiumBugFix.tsx` and the export is `InlineChromiumBugfix`.

---

## 20. Event integrity and registration

### `event/publish-subscribe-pairing`

**Severity: `error`**

Every event name passed to `useEvent` is published by something — this app or
`@canmingir/link` — and every name passed to `publish` has at least one
subscriber or is deliberately documented as broadcast-only.

The event bus is untyped and silent. A subscription to a name nobody
publishes compiles, lints, renders, and simply never fires — which, because
subscriptions are refetch dependencies, means the screen quietly stops
refreshing. There is no error to notice.

This has already produced a user-visible bug.
`src/hooks/useAcquiredMCPs.ts` completes the OAuth exchange and publishes
`AUTHORIZED`, but the getter that lists acquired MCPs depends on
`MCP_UPDATED`, which nothing anywhere publishes. The variable name shows the
intent:

Incorrect:

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

Incorrect:

```ts
const [knowledgeRefreshed] = useEvent("KNOWLEDGE_REFRESHED", null);
```

with no `publish("KNOWLEDGE_REFRESHED"` anywhere — the subscription compiles,
lints, renders, and never fires.

Incorrect:

```ts
publish("AGENT_ARCHIVED", { agentId });
```

with no subscriber and no note saying it is deliberately broadcast-only.

Correct:

```ts
const [authorized] = useEvent("AUTHORIZED", null);

const getTokens = async (code: string, mcp, id: string, isTeam: boolean) => {
  const response = await http.post(`/mcps`, payload);

  publish("AUTHORIZED", { mcpId: mcp.id });

  return response.data;
};
```

Correct:

```ts
const [agentUpdated] = useEvent("AGENT_UPDATED", null);
const [agentDeleted] = useEvent("AGENT_DELETED", null);
const [agentAdded] = useEvent("AGENT_ADDED", null);
const [teamSelected] = useEvent("PROJECT_SELECTED", { projectId: null });
```

`src/hooks/useAgents.ts` is the shape to copy — every name it subscribes to is
published by a mutation in the same module or by the platform.

Correct:

```ts
const [knowledgeStatusChanged] = useEvent("KNOWLEDGE_STATUS_CHANGED", null);
```

paired with the publish in the status watcher:

```ts
if (knowledge.status === "COMPLETED") {
  clearInterval(intervalId);
  publish("KNOWLEDGE_STATUS_CHANGED", { ...knowledge });
}
```

To audit the whole bus, diff the two name sets — every `publish("NAME"` against
every `useEvent("NAME"` — and check anything unmatched against
`@canmingir/link` before treating it as dead.

---

### `event/no-publish-during-render`

**Severity: `error`**

`publish` is a side effect, called from an event handler, a mutation, or a
`useEffect` — never from the body of a hook or component that runs during
render.

The `*_LOADED` broadcasts currently sit in the render path of their
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

Incorrect:

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

Incorrect:

```tsx
function AgentLayout({ agent }) {
  publish("AGENT_VIEWED", { agentId: agent.id });

  return <Box>{agent.name}</Box>;
}
```

Incorrect:

```tsx
function AgentsWidget({ teamId }) {
  const { agents } = useAgents().getTeamAgents();

  if (!agents.length) {
    publish("PLATFORM", "PROJECT_BAR_DIALOG", { open: true });
  }

  return <AgentGrid agents={agents} />;
}
```

A publish in a render branch fires on every render that takes it, and the
subscriber's re-render takes it again.

Correct:

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

Correct:

```ts
const response = await http.delete(`/agents/${agentId}`);

if (response) {
  publish("AGENT_DELETED", { agentId });
}
```

Mutations are already correct, because they publish from an async handler rather
than from render.

Correct:

```tsx
<AddNewButton
  addNew={"Agent"}
  onClickFunction={() => publish("AGENT_WIZARD_OPENED", {})}
/>
```

An event handler is the other place a publish belongs.

Ten getters across `useAgents`, `useKnowledge`, `useTeams`, `useMCPs`,
`useAcquiredMCPs`, `useOrganizations`, `useOrganization`, `useCommunications`,
`useBlueprint` and `useTask` publish from render today. Adding a subscriber to
any of those names without moving the publish into an effect will loop.

---

### `data/default-empty-collections`

**Severity: `error`**

A getter that returns a collection defaults it to `[]`, while a getter that
returns a single record may return `null` for consumers to reach with optional
chaining.

`useApi` initialises `data` to `null` and leaves it `null` when a
request fails, so every consumer that calls `.map`, `.filter` or `.length`
without a guard throws. This is the crash documented in
[`app/error-boundary-at-route`](#apperror-boundary-at-route), and defaulting at
the hook boundary fixes it once for every consumer instead of at each call site.

Incorrect:

```ts
return {
  agents: data,
  loading,
  error,
  fetch,
};
```

which lets `AgentsWidget` reach `agents.map(...)` with `agents === null`.

Incorrect:

```ts
return {
  knowledges: data || [],
  loading,
  error,
  fetch,
};
```

`||` also replaces a legitimately empty response, which is harmless here and
wrong on any getter whose empty value is meaningful — use `??`.

Incorrect:

```tsx
const { agents } = getTeamAgents();

return (agents ?? []).map((agent) => <AgentCard key={agent.id} agent={agent} />);
```

Guarding at the call site fixes one consumer and leaves the next one to
rediscover the crash.

Correct:

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

Correct:

```ts
return {
  agents: (data as Agent[]) ?? [],
  loading,
  error,
  fetch,
};
```

Correct:

```ts
const getTeamById = (teamId: string) => {
  const { data, loading, error, fetch } = Api(
    () => (teamId ? http.get(`/projects/${teamId}`) : null),
    [teamId]
  );

  return { team: data as Team | null, loading, error, fetch };
};
```

`useModelPricings` is the only hook defaulting collections today and it is the
right precedent. Single-record getters — `getTask`, `getTeamById`, `getAgent` —
stay nullable, which is why pages write `team?.name`.

---

### `event/platform-events-are-inbound`

**Severity: `warn`**

Events owned by `@canmingir/link` are subscribed to rather than published,
treated as input from the shell.

Four names in use here originate in the platform package —
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

Incorrect:

```tsx
const handleTeamChange = (teamId) => {
  storage.set("projectId", teamId);
  publish("PROJECT_SELECTED", { projectId: teamId });
};
```

The shell does not know its own project changed, so the two disagree until the
next real event.

Incorrect:

```ts
publish("CONFIG_INITIALIZED", {});
```

`config.js` in `@canmingir/link` owns this name.

Incorrect:

```ts
publish("LOADED", {});
```

`LOADED` drives the platform's global progress bar from `src/http/index.js`;
publishing it here hides a load that never happened.

Correct:

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

Correct:

```tsx
const handleTeamChange = () => {
  publish("PLATFORM", "PROJECT_BAR_DIALOG", { open: true });
};
```

To ask the shell to change team, drive its UI — publish
`PLATFORM` / `PROJECT_BAR_DIALOG` and let `ProjectBar` publish
`PROJECT_SELECTED` when the user picks one.

Correct:

```ts
const [configInitialized] = useEvent("CONFIG_INITIALIZED", null);
const [itemSelected] = useEvent("ITEM_SELECTED", null);
```

Platform-owned names are subscribed to, in the default namespace, using the
one-argument form.

---

### `route/register-in-routes-and-menu`

**Severity: `warn`**

A new destination is registered in both `routes.tsx`, which decides what
renders, and `config.menu.js`, which decides whether anyone can reach it.

They are separate files with no shared source, so a route without a
menu entry is reachable only by typing the URL, and a menu entry without a route
navigates to a blank page. Both failures are invisible in review of a single
file.

Incorrect:

```tsx
{ path: "/skills", element: <Skills /> },
```

added to `routes.tsx` only — reachable by typing the URL and nowhere else.

Incorrect:

```js
{
  title: "Skills",
  icon: "solar:medal-ribbon-bold",
  path: "/skills",
},
```

added to `config.menu.js` only — the menu entry navigates to a blank page.

Incorrect:

```tsx
{
  layout: <FullScreenLayout />,
  pages: [{ path: "/chat", element: <Chat /> }],
},
```

with no menu entry, on the reasoning that a full-screen route does not belong in
the side menu. The layout choice is independent of discoverability.

Correct:

```tsx
{
  layout: <DashboardLayout />,
  pages: [
    { path: "/agents", element: <Agents /> },
    { path: "/skills", element: <Skills /> },
  ],
},
```

Correct:

```js
{
  title: "Skills",
  icon: "solar:medal-ribbon-bold",
  path: "/skills",
},
```

Correct:

```js
{
  title: "Documentation",
  icon: "solar:book-bold",
  path: "https://docs.greycollar.ai",
  external: true,
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
