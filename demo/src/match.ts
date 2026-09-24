import type { Condition, EventTrigger } from "./types";

type Vars = Record<string, string>;

function render(value: string, vars: Vars): string {
  return value.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, key) => vars[key] ?? "");
}

function renderIfReady(value: string, vars: Vars): string | null {
  const missing = [...value.matchAll(/\{\{\s*([\w.-]+)\s*\}\}/g)].some(([, key]) => !vars[key]);

  return missing ? null : render(value, vars);
}

function joinRoute(base: string, route: string): string {
  if (/^[a-z]+:\/\//i.test(route) || !base) {
    return route;
  }

  const url = new URL(base);
  const root = url.pathname.replace(/\/$/, "");

  return `${url.origin}${root}/${route.replace(/^\//, "")}`;
}

function renderDeep(value: unknown, vars: Vars): unknown {
  if (typeof value === "string") {
    return render(value, vars);
  }

  if (Array.isArray(value)) {
    return value.map((item) => renderDeep(item, vars));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, renderDeep(item, vars)]),
    );
  }

  return value;
}

function pick(payload: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (current, key) =>
        current && typeof current === "object"
          ? (current as Record<string, unknown>)[key]
          : undefined,
      payload,
    );
}

function same(actual: unknown, expected: unknown): boolean {
  if (actual === expected) {
    return true;
  }

  if (actual === undefined || actual === null) {
    return false;
  }

  return String(actual) === String(expected);
}

function test(actual: unknown, condition: Condition): boolean {
  if (condition === null || typeof condition !== "object") {
    return same(actual, condition);
  }

  const text = typeof actual === "string" ? actual : JSON.stringify(actual ?? "");

  return (
    (!("equals" in condition) || same(actual, condition.equals)) &&
    (!("not" in condition) || !same(actual, condition.not)) &&
    (condition.contains === undefined ||
      text.toLowerCase().includes(condition.contains.toLowerCase())) &&
    (condition.matches === undefined ||
      new RegExp(condition.matches, "i").test(text)) &&
    (condition.in === undefined ||
      condition.in.some((option) => same(actual, option))) &&
    (condition.exists === undefined ||
      (actual !== undefined && actual !== null) === condition.exists)
  );
}

function matches(
  trigger: EventTrigger,
  type: string,
  payload: unknown,
  vars: Vars,
): boolean {
  if (trigger.event !== type && trigger.event !== "*") {
    return false;
  }

  const where = renderDeep(trigger.where ?? {}, vars) as Record<string, Condition>;

  return Object.entries(where).every(([path, condition]) =>
    test(pick(payload, path), condition),
  );
}

function capture(trigger: EventTrigger, payload: unknown): Vars {
  return Object.fromEntries(
    Object.entries(trigger.capture ?? {}).flatMap(([name, path]) => {
      const value = pick(payload, path);

      return value === undefined || value === null
        ? []
        : [[name, typeof value === "string" ? value : JSON.stringify(value)]];
    }),
  );
}

export { capture, joinRoute, matches, pick, render, renderDeep, renderIfReady };
export type { Vars };
