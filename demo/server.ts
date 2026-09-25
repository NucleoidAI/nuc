import { readdir } from "node:fs/promises";
import path from "node:path";
import type { ServerWebSocket } from "bun";
import { EventListener } from "./src/events";
import {
  WindowManager,
  chromeApps,
  chromeProfiles,
  findChromeApp,
  probeWindows,
  profileDirectory,
  screen,
  type WindowStatus,
} from "./src/macos";
import {
  capture,
  joinRoute,
  matches,
  render,
  renderDeep,
  renderIfReady,
  type Vars,
} from "./src/match";
import { coverage, resolve, split } from "./src/layout";
import type {
  DemoCase,
  EventTrigger,
  IndicatorPosition,
  Layout,
  Mode,
  Pane,
  Rect,
  Step,
  Trigger,
  WindowDef,
  WindowTrigger,
} from "./src/types";

const PORT = Number(process.env.DEMO_PORT ?? 4600);
const EVENT_URL = process.env.DEMO_EVENT_URL ?? "http://localhost:8080";
const MODE: Mode =
  process.env.DEMO_MODE === "manual" || process.env.DEMO_ARRANGE === "0" ? "manual" : "auto";
const WATCH_MS = 700;
const FULLSCREEN_COVERAGE = 0.9;
const WINDOW_STATES = ["open", "front", "fullscreen"];
const SCREEN = Number(process.env.DEMO_SCREEN ?? 0);
const CASES_DIR = path.join(import.meta.dir, "cases");
const UI_FILE = path.join(import.meta.dir, "ui", "index.html");
const INDICATOR_SLOT = "__indicator";
const INDICATOR_URL = `http://localhost:${PORT}/`;

type Settings = {
  screen: number;
  mode?: Mode;
  position?: IndicatorPosition;
  size?: number;
  reserve?: boolean;
};

type LogEntry = {
  at: number;
  type: string;
  payload: unknown;
  matched: boolean;
  simulated: boolean;
};

const state = {
  file: null as string | null,
  def: null as DemoCase | null,
  index: 0,
  finished: false,
  vars: {} as Vars,
  startedAt: 0,
  enteredAt: [] as number[],
  log: [] as LogEntry[],
  connected: false,
  layoutError: null as string | null,
  watchError: null as string | null,
  indicatorRect: null as Rect | null,
  stageRect: null as Rect | null,
  settings: { screen: SCREEN } as Settings,
};

const windows = new WindowManager();
const shown = new Set<string>();
let timer: ReturnType<typeof setTimeout> | null = null;
let watchGeneration = 0;
const armed = new Set<number>();
let queue: Promise<void> = Promise.resolve();
let screenRect: Rect | null = null;
let server: ReturnType<typeof Bun.serve>;

async function listCases() {
  const files = (await readdir(CASES_DIR)).filter((file) => file.endsWith(".json"));

  return Promise.all(
    files.sort().map(async (file) => {
      const def = (await Bun.file(path.join(CASES_DIR, file)).json()) as DemoCase;

      return { file, name: def.name, description: def.description, steps: def.steps.length };
    }),
  );
}

function currentMode(): Mode {
  return state.settings.mode ?? state.def?.mode ?? MODE;
}

function arranging(): boolean {
  return currentMode() === "auto" && process.platform === "darwin";
}

function active(trigger: Trigger): boolean {
  return !trigger.mode || trigger.mode === currentMode();
}

function windowTriggers(step: Step): WindowTrigger[] {
  return (step.advance ?? []).filter(
    (trigger): trigger is WindowTrigger => "window" in trigger && active(trigger),
  );
}

function validate(def: DemoCase) {
  if (!def.name || !Array.isArray(def.steps) || def.steps.length === 0) {
    throw new Error("A demo case needs a name and at least one step");
  }

  def.steps.forEach((step) =>
    (step.advance ?? []).forEach((trigger) => {
      if (!("window" in trigger)) {
        return;
      }

      if (!def.windows?.[trigger.window]) {
        throw new Error(`Step "${step.id}" waits for unknown window "${trigger.window}"`);
      }

      if (!WINDOW_STATES.includes(trigger.state)) {
        throw new Error(`Step "${step.id}" uses unknown window state "${trigger.state}"`);
      }
    }),
  );

  def.steps.forEach((step) =>
    step.layout?.panes.forEach((pane) => {
      if (!def.windows?.[pane.window]) {
        throw new Error(`Step "${step.id}" uses unknown window "${pane.window}"`);
      }
    }),
  );
}

function eventTriggers(def: DemoCase): EventTrigger[] {
  return [
    ...(def.captures ?? []),
    ...def.steps.flatMap((step) =>
      (step.advance ?? []).filter((trigger): trigger is EventTrigger => "event" in trigger),
    ),
  ];
}

function renderedCase(def: DemoCase | null): DemoCase | null {
  if (!def) {
    return null;
  }

  return {
    ...def,
    steps: def.steps.map((step) => ({
      ...step,
      title: render(step.title, state.vars),
      note: step.note && render(step.note, state.vars),
      advance: step.advance
        ?.filter(active)
        .map((trigger) => renderDeep(trigger, state.vars) as Trigger),
    })),
  };
}

function indicatorSettings(def: DemoCase) {
  const position = state.settings.position ?? def.indicator?.position ?? "right";
  const vertical = position === "left" || position === "right";

  return {
    screen: state.settings.screen,
    position,
    size: state.settings.size ?? def.indicator?.size ?? (vertical ? 360 : 150),
    reserve: state.settings.reserve ?? def.indicator?.reserve ?? true,
    mode: def.indicator?.mode ?? "overlay",
  };
}

function snapshot() {
  return {
    file: state.file,
    def: renderedCase(state.def),
    index: state.index,
    finished: state.finished,
    vars: state.vars,
    startedAt: state.startedAt,
    enteredAt: state.enteredAt,
    log: state.log,
    connected: state.connected,
    mode: currentMode(),
    arrange: arranging(),
    layoutError: state.layoutError,
    watchError: state.watchError,
    indicatorRect: state.indicatorRect,
    indicator: state.def ? indicatorSettings(state.def) : null,
    currentLayout: state.def ? effectiveLayout(state.def, state.index) : null,
    eventUrl: EVENT_URL,
    now: Date.now(),
  };
}

function broadcast() {
  server?.publish("state", JSON.stringify({ kind: "state", state: snapshot() }));
}

function effectiveLayout(def: DemoCase, index: number): Layout | null {
  for (let i = index; i >= 0; i--) {
    const layout = def.steps[i].layout;

    if (layout) {
      return layout;
    }
  }

  return null;
}

async function paneUrl(pane: Pane, windowDef: WindowDef): Promise<string | undefined> {
  if (windowDef.type === "app") {
    return undefined;
  }

  const base =
    windowDef.url ?? (windowDef.type === "chrome-app" ? (await findChromeApp(windowDef.app)).url : "");
  const template = pane.url ?? (pane.route ? joinRoute(base, pane.route) : windowDef.url);

  return template ? (renderIfReady(template, state.vars) ?? undefined) : undefined;
}

function waitsForVars(def: DemoCase): boolean {
  return (effectiveLayout(def, state.index)?.panes ?? []).some((pane) =>
    /\{\{/.test(`${pane.url ?? ""}${pane.route ?? ""}`),
  );
}

async function applyLayout(force: boolean) {
  const def = state.def;

  if (!def || process.platform !== "darwin") {
    return;
  }

  screenRect ??= await screen(state.settings.screen);

  await placeWindows(def, screenRect, force);

  if (windows.pushedDown > 0 && (arranging() || force)) {
    const offset = windows.pushedDown;

    windows.pushedDown = 0;
    screenRect = { ...screenRect, y: screenRect.y + offset, h: screenRect.h - offset };
    await placeWindows(def, screenRect, force);
    windows.pushedDown = 0;
  }
}

async function placeWindows(def: DemoCase, area: Rect, force: boolean) {
  const settings = indicatorSettings(def);
  const { indicator, stage: reserved } = split(area, settings.position, settings.size);
  const stage = settings.reserve ? reserved : area;

  state.indicatorRect = indicator;
  state.stageRect = stage;

  if (!arranging() && !force) {
    return;
  }

  const layout = effectiveLayout(def, state.index);

  if (layout) {
    const placed = resolve(layout, stage, def.gap ?? 8);
    const visible = new Set(placed.map(({ pane }) => pane.window));

    for (const slot of [...shown]) {
      if (!visible.has(slot) && def.windows[slot]) {
        await windows.hide(slot, def.windows[slot]);
        shown.delete(slot);
      }
    }

    const failures: string[] = [];

    for (const { pane, rect } of placed) {
      const windowDef = def.windows[pane.window];

      try {
        await windows.show(pane.window, windowDef, rect, await paneUrl(pane, windowDef));
        shown.add(pane.window);
      } catch (error: unknown) {
        failures.push(`${pane.window}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (failures.length > 0) {
      throw new Error(failures.join(" · "));
    }
  }

  if (settings.mode === "window") {
    const indicatorDef: WindowDef = { type: "chrome" };

    await windows.show(INDICATOR_SLOT, indicatorDef, indicator, INDICATOR_URL);
  }
}

function arrange(force = false) {
  queue = queue
    .then(() => applyLayout(force))
    .then(() => {
      state.layoutError = null;
    })
    .catch((error: unknown) => {
      state.layoutError = error instanceof Error ? error.message : String(error);
      console.error("Layout failed", state.layoutError);
    })
    .finally(broadcast);
}

function probeUrl(def: DemoCase, slot: string, windowDef: WindowDef): string | undefined {
  if (windowDef.type !== "chrome") {
    return undefined;
  }

  const pane = effectiveLayout(def, state.index)?.panes.find((candidate) => candidate.window === slot);
  const template =
    pane?.url ?? (pane?.route && windowDef.url ? joinRoute(windowDef.url, pane.route) : undefined);

  return (template && renderIfReady(template, state.vars)) || windowDef.url;
}

function holds(trigger: WindowTrigger, status: WindowStatus | undefined): boolean {
  if (!status?.open) {
    return false;
  }

  switch (trigger.state) {
    case "front":
      return status.front;
    case "fullscreen":
      return (
        status.native ||
        (!!status.frame &&
          !!state.stageRect &&
          coverage(status.frame, state.stageRect) >= FULLSCREEN_COVERAGE)
      );
    default:
      return true;
  }
}

async function checkWindows(generation: number) {
  const def = state.def;

  if (!def || state.finished) {
    return;
  }

  const triggers = windowTriggers(def.steps[state.index]);
  const slots = [...new Set(triggers.map((trigger) => trigger.window))];

  try {
    const statuses = await probeWindows(
      slots.map((slot) => ({
        slot,
        def: def.windows[slot],
        url: probeUrl(def, slot, def.windows[slot]),
      })),
    );

    if (generation !== watchGeneration) {
      return;
    }

    if (state.watchError) {
      state.watchError = null;
      broadcast();
    }

    const fired = triggers.findIndex((trigger, index) => {
      if (!holds(trigger, statuses[trigger.window])) {
        armed.add(index);
        return false;
      }

      return armed.has(index);
    });

    if (fired >= 0) {
      const trigger = triggers[fired];

      state.log = [
        {
          at: Date.now(),
          type: `WINDOW ${trigger.window} ${trigger.state}`,
          payload: trigger,
          matched: true,
          simulated: false,
        },
        ...state.log,
      ].slice(0, 40);
      next();
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    if (generation === watchGeneration && state.watchError !== message) {
      state.watchError = message;
      console.error("Window watch failed", message);
      broadcast();
    }
  }
}

function watchWindows() {
  const generation = ++watchGeneration;
  const def = state.def;

  armed.clear();
  state.watchError = null;

  if (
    !def ||
    state.finished ||
    process.platform !== "darwin" ||
    windowTriggers(def.steps[state.index]).length === 0
  ) {
    return;
  }

  const tick = async () => {
    if (generation !== watchGeneration) {
      return;
    }

    await checkWindows(generation);

    if (generation === watchGeneration) {
      setTimeout(tick, WATCH_MS);
    }
  };

  void tick();
}

function goto(index: number, force = false) {
  const def = state.def;

  if (!def) {
    return;
  }

  if (timer) {
    clearTimeout(timer);
    timer = null;
  }

  state.index = Math.max(0, Math.min(index, def.steps.length - 1));
  state.finished = false;
  state.enteredAt[state.index] = Date.now();
  state.enteredAt.length = state.index + 1;

  const delays = (def.steps[state.index].advance ?? [])
    .filter((trigger) => "delay" in trigger && active(trigger))
    .map((trigger) => (trigger as { delay: number }).delay);

  if (delays.length > 0) {
    timer = setTimeout(next, Math.min(...delays));
  }

  watchWindows();
  broadcast();
  arrange(force);
}

function next() {
  const def = state.def;

  if (!def || state.finished) {
    return;
  }

  if (state.index >= def.steps.length - 1) {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }

    state.finished = true;
    state.enteredAt[def.steps.length] = Date.now();
    watchWindows();
    broadcast();
    return;
  }

  goto(state.index + 1);
}

function prev() {
  if (state.finished) {
    goto(state.index);
    return;
  }

  goto(state.index - 1);
}

function restart() {
  if (!state.def) {
    return;
  }

  state.vars = { ...(state.def.vars ?? {}) };
  state.enteredAt = [];
  state.startedAt = Date.now();
  state.log = [];
  windows.forget();
  goto(0);
}

async function setLayout(index: number, layout: Layout) {
  const def = state.def;

  if (!def || !state.file || !def.steps[index]) {
    throw new Error("No step to change");
  }

  if (!layout || !Array.isArray(layout.panes)) {
    throw new Error("Layout needs panes");
  }

  layout.panes.forEach((pane) => {
    if (!def.windows[pane.window]) {
      throw new Error(`Unknown window "${pane.window}"`);
    }
  });

  def.steps[index].layout = layout;
  await Bun.write(path.join(CASES_DIR, state.file), `${JSON.stringify(def, null, 2)}\n`);

  if (index === state.index) {
    arrange();
  }

  broadcast();
}

async function load(file: string) {
  const full = path.join(CASES_DIR, path.basename(file));
  const def = (await Bun.file(full).json()) as DemoCase;

  validate(def);

  for (const window of arranging() ? Object.values(def.windows) : []) {
    if (window.type === "chrome" && window.profile) {
      await profileDirectory(window.profile);
    }

    if (window.type === "chrome-app") {
      await findChromeApp(window.app);
    }
  }

  state.file = path.basename(full);
  state.def = def;
  listener.watch(eventTriggers(def).map((trigger) => trigger.event));
  restart();
}

function onEvent(type: string, payload: unknown, simulated = false) {
  const entry: LogEntry = { at: Date.now(), type, payload, matched: false, simulated };

  state.log = [entry, ...state.log].slice(0, 40);

  const def = state.def;

  const before = JSON.stringify(state.vars);

  (def?.captures ?? [])
    .filter((rule) => matches(rule, type, payload, state.vars))
    .forEach((rule) => {
      state.vars = { ...state.vars, ...capture(rule, payload) };
    });

  if (def && JSON.stringify(state.vars) !== before && waitsForVars(def)) {
    arrange();
  }

  if (def && !state.finished) {
    const trigger = (def.steps[state.index].advance ?? []).find(
      (candidate): candidate is EventTrigger =>
        "event" in candidate && active(candidate) && matches(candidate, type, payload, state.vars),
    );

    if (trigger) {
      entry.matched = true;
      state.vars = { ...state.vars, ...capture(trigger, payload) };
      next();
      return;
    }
  }

  broadcast();
}

const listener = new EventListener(EVENT_URL, onEvent, (connected) => {
  state.connected = connected;
  broadcast();
});

function refreshMode() {
  if (state.def && !state.finished) {
    const delays = (state.def.steps[state.index].advance ?? []).some(
      (trigger) => "delay" in trigger && trigger.mode,
    );

    if (delays) {
      goto(state.index);
      return;
    }

    watchWindows();
  }

  broadcast();
  arrange();
}

function setMode(mode: Mode) {
  state.settings = { ...state.settings, mode };
  refreshMode();
}

async function handle(action: string, body: Record<string, unknown>) {
  switch (action) {
    case "next":
      next();
      break;
    case "prev":
      prev();
      break;
    case "restart":
      restart();
      break;
    case "goto":
      goto(Number(body.index), body.arrange === true);
      break;
    case "arrange":
      screenRect = null;
      arrange(true);
      break;
    case "toggle-arrange":
      setMode(currentMode() === "auto" ? "manual" : "auto");
      break;
    case "mode":
      setMode(body.mode === "manual" ? "manual" : "auto");
      break;
    case "set-layout":
      await setLayout(Number(body.index ?? state.index), body.layout as Layout);
      break;
    case "configure":
      state.settings = {
        screen: Number(body.screen ?? state.settings.screen),
        mode:
          body.mode === "auto" || body.mode === "manual" ? body.mode : state.settings.mode,
        position: (body.position as IndicatorPosition) ?? state.settings.position,
        size: body.size === undefined ? state.settings.size : Number(body.size),
        reserve: body.reserve === undefined ? state.settings.reserve : Boolean(body.reserve),
      };
      screenRect = null;
      refreshMode();
      break;
    case "cases":
      server.publish("state", JSON.stringify({ kind: "cases", cases: await listCases() }));
      break;
    case "load":
      await load(String(body.file));
      break;
    case "simulate":
      onEvent(String(body.type), body.payload ?? {}, true);
      break;
    default:
      throw new Error(`Unknown action "${action}"`);
  }
}

server = Bun.serve({
  port: PORT,
  async fetch(req, srv) {
    const url = new URL(req.url);

    if (url.pathname === "/ws") {
      return srv.upgrade(req, { data: undefined }) ? undefined : new Response("Upgrade failed", { status: 400 });
    }

    if (url.pathname === "/") {
      return new Response(Bun.file(UI_FILE), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (url.pathname === "/api/state") {
      return Response.json(snapshot());
    }

    if (url.pathname === "/api/chrome-apps") {
      return Response.json(await chromeApps());
    }

    if (url.pathname === "/api/profiles") {
      return Response.json(await chromeProfiles());
    }

    if (url.pathname === "/api/cases") {
      return Response.json(await listCases());
    }

    const action = url.pathname.match(/^\/api\/([\w-]+)$/)?.[1];

    if (action && req.method === "POST") {
      try {
        const body = req.headers.get("content-type")?.includes("json") ? await req.json() : {};

        await handle(action, body);
        return Response.json(snapshot());
      } catch (error: unknown) {
        return Response.json(
          { error: error instanceof Error ? error.message : String(error) },
          { status: 400 },
        );
      }
    }

    return new Response("Not found", { status: 404 });
  },
  websocket: {
    async open(ws: ServerWebSocket<unknown>) {
      ws.subscribe("state");
      ws.send(JSON.stringify({ kind: "state", state: snapshot() }));
      ws.send(JSON.stringify({ kind: "cases", cases: await listCases() }));
    },
    async message(ws, raw) {
      try {
        const { action, ...body } = JSON.parse(String(raw));

        await handle(action, body);
      } catch (error: unknown) {
        ws.send(
          JSON.stringify({
            kind: "error",
            message: error instanceof Error ? error.message : String(error),
          }),
        );
      }
    },
  },
});

console.log(`🎬 Demo runner on ${INDICATOR_URL} (events: ${EVENT_URL}, mode: ${MODE})`);

const initial = process.argv[2] ?? process.env.DEMO_CASE;

if (initial) {
  load(initial).catch((error) => console.error(`Could not load ${initial}:`, error.message));
}
