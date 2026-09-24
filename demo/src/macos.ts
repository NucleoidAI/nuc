import { readdir } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import type { Rect, WindowDef } from "./types";

const CHROME_APPS_DIR = path.join(homedir(), "Applications/Chrome Apps.localized");
const CHROME_LOCAL_STATE = path.join(
  homedir(),
  "Library/Application Support/Google/Chrome/Local State",
);

async function osascript(script: string, language = "AppleScript") {
  const proc = Bun.spawn(["osascript", "-l", language, "-"], {
    stdin: new TextEncoder().encode(script),
    stdout: "pipe",
    stderr: "pipe",
  });

  const [out, err, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  if (code !== 0) {
    throw new Error(err.trim() || `osascript exited with ${code}`);
  }

  return out.trim();
}

function quote(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

async function screen(index = 0): Promise<Rect> {
  const out = await osascript(
    `ObjC.import("AppKit");
const screens = $.NSScreen.screens;
const primary = screens.objectAtIndex(0);
const top = (s) => s.frame.origin.y + s.frame.size.height - (s.visibleFrame.origin.y + s.visibleFrame.size.height);
const menuBar = top(primary);
const s = screens.objectAtIndex(${index} < screens.count ? ${index} : 0);
const v = s.visibleFrame;
const extra = s !== primary && $.NSScreen.screensHaveSeparateSpaces ? Math.max(0, menuBar - top(s)) : 0;
JSON.stringify({ x: v.origin.x, y: primary.frame.size.height - (v.origin.y + v.size.height) + extra, w: v.size.width, h: v.size.height - extra });`,
    "JavaScript",
  );

  return JSON.parse(out);
}

async function chromeProfiles(): Promise<Record<string, string>> {
  try {
    const state = await Bun.file(CHROME_LOCAL_STATE).json();
    const cache = (state.profile?.info_cache ?? {}) as Record<string, { name?: string }>;

    return Object.fromEntries(
      Object.entries(cache).map(([directory, info]) => [directory, info.name ?? directory]),
    );
  } catch {
    return {};
  }
}

async function profileDirectory(profile: string): Promise<string> {
  const profiles = await chromeProfiles();

  if (profiles[profile]) {
    return profile;
  }

  const match = Object.entries(profiles).find(
    ([, name]) => name.toLowerCase() === profile.trim().toLowerCase(),
  );

  if (!match) {
    const available = Object.entries(profiles)
      .map(([directory, name]) => `"${name}" (${directory})`)
      .join(", ");

    throw new Error(`Chrome profile "${profile}" not found. Available: ${available}`);
  }

  return match[0];
}

async function chromeWindowIds(): Promise<number[]> {
  const out = await osascript(`tell application "Google Chrome" to get id of every window`);

  return out
    .split(",")
    .map((id) => Number(id.trim()))
    .filter((id) => id > 0);
}

type ChromeApp = { name: string; path: string; url: string; bundleId: string };

function normalizeName(value: string): string {
  return value.replace(/[:/]/g, "/").trim().toLowerCase();
}

async function appsIn(directory: string): Promise<string[]> {
  const entries = await readdir(directory).catch(() => [] as string[]);

  return entries.filter((entry) => entry.endsWith(".app")).map((entry) => path.join(directory, entry));
}

async function spotlightChromeApps(): Promise<string[]> {
  const proc = Bun.spawn(["mdfind", "kMDItemCFBundleIdentifier == 'com.google.Chrome.app.*'"], {
    stdout: "pipe",
    stderr: "ignore",
  });

  return (await new Response(proc.stdout).text()).split("\n").filter(Boolean);
}

async function readInfo(appPath: string): Promise<Record<string, string>> {
  const proc = Bun.spawn(
    ["plutil", "-convert", "json", "-o", "-", path.join(appPath, "Contents/Info.plist")],
    { stdout: "pipe", stderr: "ignore" },
  );

  try {
    return JSON.parse((await new Response(proc.stdout).text()) || "{}");
  } catch {
    return {};
  }
}

async function chromeApps(): Promise<ChromeApp[]> {
  const candidates = [
    ...(await appsIn(CHROME_APPS_DIR)),
    ...(await appsIn(path.join(homedir(), "Desktop"))),
    ...(await appsIn(path.join(homedir(), "Applications"))),
    ...(await spotlightChromeApps()),
  ];

  const apps = await Promise.all(
    [...new Set(candidates)].map(async (appPath) => ({ appPath, info: await readInfo(appPath) })),
  );

  const seen = new Set<string>();

  return apps
    .filter(({ info }) => info.CFBundleIdentifier?.startsWith("com.google.Chrome.app."))
    .filter(({ info }) => !seen.has(info.CFBundleIdentifier) && !!seen.add(info.CFBundleIdentifier))
    .map(({ appPath, info }) => ({
      name: info.CrAppModeShortcutName ?? info.CFBundleName ?? path.basename(appPath, ".app"),
      path: appPath,
      url: info.CrAppModeShortcutURL ?? "",
      bundleId: info.CFBundleIdentifier,
    }));
}

async function findChromeApp(name: string): Promise<ChromeApp> {
  const apps = await chromeApps();
  const wanted = normalizeName(name);
  const app = apps.find(
    (candidate) =>
      normalizeName(candidate.name) === wanted ||
      normalizeName(path.basename(candidate.path, ".app")) === wanted,
  );

  if (!app) {
    const available = apps.map((candidate) => `"${candidate.name}"`).join(", ") || "none";

    throw new Error(`Chrome app "${name}" not found. Available: ${available}`);
  }

  return app;
}

async function chromeWindows(): Promise<{ id: number; url: string; tabs: number }[]> {
  const out = await osascript(
    `JSON.stringify(Application("Google Chrome").windows().map((w) => ({ id: w.id(), url: w.activeTab().url(), tabs: w.tabs.length })))`,
    "JavaScript",
  );

  return (JSON.parse(out || "[]") as { id: string; url: string; tabs: number }[]).map((window) => ({
    ...window,
    id: Number(window.id),
  }));
}

async function chromeAppWindow(app: ChromeApp, claimed: Set<number>): Promise<number | null> {
  const host = app.url ? new URL(app.url).host : "";
  const existing = (await chromeWindows().catch(() => [])).find(
    (window) => !claimed.has(window.id) && window.tabs === 1 && host && window.url.includes(host),
  );

  if (existing) {
    return existing.id;
  }

  const before = new Set(await chromeWindowIds().catch(() => []));

  Bun.spawn(["open", app.path]);

  for (let attempt = 0; attempt < 40; attempt++) {
    await Bun.sleep(100);

    const created = (await chromeWindowIds().catch(() => [])).find((id) => !before.has(id));

    if (created) {
      return created;
    }
  }

  return null;
}

const HELPER_DIR = path.join(import.meta.dir, "..", "overlay");
const HELPER = path.join(HELPER_DIR, ".build", "release", "DemoWindow");

let helperBuild: Promise<void> | null = null;

function ensureHelper(): Promise<void> {
  helperBuild ??= (async () => {
    if (await Bun.file(HELPER).exists()) {
      return;
    }

    const proc = Bun.spawn(["swift", "build", "-c", "release", "--product", "DemoWindow"], {
      cwd: HELPER_DIR,
      stdout: "ignore",
      stderr: "pipe",
    });

    if ((await proc.exited) !== 0) {
      helperBuild = null;
      throw new Error(`Could not build DemoWindow: ${await new Response(proc.stderr).text()}`);
    }
  })();

  return helperBuild;
}

async function appPid(app: ChromeApp): Promise<number | null> {
  const proc = Bun.spawn(["ps", "-axo", "pid=,command="], { stdout: "pipe" });
  const executable = `${app.path}/Contents/MacOS/`;
  const line = (await new Response(proc.stdout).text())
    .split("\n")
    .find((entry) => entry.includes(executable));

  return line ? Number(line.trim().split(/\s+/)[0]) : null;
}

async function helper(
  args: (string | number)[],
): Promise<{ code: number; reason?: string; windows?: { y: number }[] }> {
  await ensureHelper();

  const proc = Bun.spawn([HELPER, ...args.map(String)], { stdout: "pipe", stderr: "ignore" });
  const [out, code] = await Promise.all([new Response(proc.stdout).text(), proc.exited]);
  const result = JSON.parse(out || "{}") as { reason?: string; windows?: { y: number }[] };

  return { code, reason: result.reason, windows: result.windows };
}

async function placeAppWindow(app: ChromeApp, rect: Rect): Promise<number> {
  let last = "missing";

  for (let attempt = 0; attempt < 50; attempt++) {
    const pid = await appPid(app);

    if (pid) {
      const result = await helper(["place", pid, rect.x, rect.y, rect.w, rect.h]);

      if (result.code === 0) {
        return result.windows?.[0]?.y ?? rect.y;
      }

      if (result.reason === "accessibility") {
        accessibilityError(new Error("assistive access"));
      }

      last = result.reason ?? "missing";

      if (last === "minimized") {
        break;
      }
    }

    if (attempt === 0) {
      Bun.spawn(["open", app.path]);
    }

    await Bun.sleep(100);
  }

  if (last === "minimized") {
    throw new Error(`Chrome app "${app.name}" is minimized. Restore it from the Dock once, then press Re-apply.`);
  }

  throw new Error(`Chrome app "${app.name}" has no open window`);
}

function accessibilityError(error: Error): never {
  if (/assistive access|-1719|-25211/i.test(error.message)) {
    throw new Error(
      "Accessibility permission is needed to place Chrome app windows. Allow your terminal in System Settings → Privacy & Security → Accessibility, then restart the runner.",
    );
  }

  throw error;
}

async function chromeWindowExists(id: number): Promise<boolean> {
  const out = await osascript(`tell application "Google Chrome" to exists window id "${id}"`);

  return out === "true";
}

async function openProfileWindow(profile: string, url: string): Promise<number> {
  const directory = await profileDirectory(profile);
  const before = new Set(await chromeWindowIds());

  Bun.spawn([
    "open",
    "-na",
    "Google Chrome",
    "--args",
    `--profile-directory=${directory}`,
    "--new-window",
    url || "about:blank",
  ]);

  for (let attempt = 0; attempt < 50; attempt++) {
    await Bun.sleep(100);

    const created = (await chromeWindowIds().catch(() => [])).find((id) => !before.has(id));

    if (created) {
      return created;
    }
  }

  throw new Error(`Chrome did not open a window for profile "${profile}"`);
}

class WindowManager {
  private chromeIds = new Map<string, number>();
  private urls = new Map<string, string>();

  pushedDown = 0;

  async show(slot: string, def: WindowDef, rect: Rect, url?: string) {
    if (def.type === "chrome" || def.type === "chrome-app") {
      await this.showChrome(slot, def, rect, url);
    } else {
      await this.showApp(def.process ?? def.app, def.app, rect);
    }
  }

  async hide(_slot: string, def: WindowDef) {
    if (def.type !== "app") {
      return;
    }

    const process = quote(def.process ?? def.app);

    await osascript(`tell application "System Events"
  if exists process ${process} then set visible of process ${process} to false
end tell`);
  }

  private async adoptOpenWindow(url: string): Promise<number | null> {
    const page = url.split(/[#?]/)[0];
    const claimed = new Set(this.chromeIds.values());
    const open = (await chromeWindows().catch(() => [])).find(
      (window) => !claimed.has(window.id) && window.url.startsWith(page),
    );

    return open?.id ?? null;
  }

  private notePushedDown(top: number, rect: Rect) {
    if (Number.isFinite(top) && top > rect.y && top - rect.y < rect.h / 2) {
      this.pushedDown = Math.max(this.pushedDown, top - rect.y);
    }
  }

  forget() {
    this.urls.clear();
  }

  private async showChrome(
    slot: string,
    def: Extract<WindowDef, { type: "chrome" | "chrome-app" }>,
    rect: Rect,
    url?: string,
  ) {
    const existing = this.chromeIds.get(slot);
    const alive = existing ? await chromeWindowExists(existing) : false;
    const profile = def.type === "chrome" ? def.profile : undefined;

    if (!alive && def.type === "chrome-app") {
      const claimed = new Set(this.chromeIds.values());
      const id = await chromeAppWindow(await findChromeApp(def.app), claimed);

      this.chromeIds.delete(slot);
      this.urls.delete(slot);

      if (id) {
        this.chromeIds.set(slot, id);
      }
    } else if (!alive && def.type === "chrome") {
      const adopted = url ? await this.adoptOpenWindow(url) : null;

      if (adopted) {
        this.chromeIds.set(slot, adopted);
        this.urls.set(slot, url ?? "");
      } else if (profile) {
        this.chromeIds.set(slot, await openProfileWindow(profile, url ?? ""));

        if (url) {
          this.urls.set(slot, url);
        }
      }
    }

    const navigate = url && this.urls.get(slot) !== url ? url : "";
    const bounds = `{${rect.x}, ${rect.y}, ${rect.x + rect.w}, ${rect.y + rect.h}}`;

    if (def.type === "chrome-app") {
      const id = this.chromeIds.get(slot);

      if (id && navigate) {
        await osascript(`tell application "Google Chrome"
  set URL of active tab of window id "${id}" to ${quote(navigate)}
end tell`);
      }

      const top = await placeAppWindow(await findChromeApp(def.app), rect);

      this.notePushedDown(top, rect);
    } else {
      const out = await osascript(`tell application "Google Chrome"
  set wid to "${this.chromeIds.get(slot) ?? ""}"
  if wid is "" or not (exists window id wid) then
    set wid to id of (make new window)
  end if
  set w to window id wid
  if minimized of w then set minimized of w to false
  set bounds of w to ${bounds}
  if ${quote(navigate)} is not "" then set URL of active tab of w to ${quote(navigate)}
  set index of w to 1
  activate
  return (wid as text) & "|" & ((item 2 of (get bounds of w)) as integer as text)
end tell`);

      const [id, top] = out.split("|").map((value) => Number(value.trim()));

      this.chromeIds.set(slot, id);

      this.notePushedDown(top, rect);
    }

    if (navigate && this.chromeIds.has(slot)) {
      this.urls.set(slot, navigate);
    }
  }

  private async showApp(process: string, app: string, rect: Rect) {
    await osascript(`tell application ${quote(app)} to activate
delay 0.3
tell application "System Events" to tell process ${quote(process)}
  set visible to true
  set frontmost to true
  if (count of windows) > 0 then
    set position of window 1 to {${rect.x}, ${rect.y}}
    set size of window 1 to {${rect.w}, ${rect.h}}
  end if
end tell`);
  }
}

export {
  WindowManager,
  chromeApps,
  chromeProfiles,
  findChromeApp,
  osascript,
  profileDirectory,
  screen,
};
