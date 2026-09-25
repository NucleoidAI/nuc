import { describe, expect, test } from "bun:test";
import { capture, joinRoute, matches, render, renderIfReady } from "../src/match";
import { coverage, presetFrames, resolve, split } from "../src/layout";

describe("matches", () => {
  const payload = {
    sessionId: "s-1",
    subject: "Question about Invoice #42",
    meta: { priority: 2 },
  };

  test("event type must match", () => {
    expect(matches({ event: "EMAIL_SENT" }, "EMAIL_RECEIVED", payload, {})).toBe(false);
    expect(matches({ event: "EMAIL_RECEIVED" }, "EMAIL_RECEIVED", payload, {})).toBe(true);
  });

  test("operators", () => {
    const check = (where: object) =>
      matches({ event: "E", where: where as never }, "E", payload, {});

    expect(check({ subject: { contains: "invoice" } })).toBe(true);
    expect(check({ subject: { matches: "#\\d+" } })).toBe(true);
    expect(check({ "meta.priority": 2 })).toBe(true);
    expect(check({ "meta.priority": { in: [1, 3] } })).toBe(false);
    expect(check({ missing: { exists: false } })).toBe(true);
    expect(check({ sessionId: { not: "s-1" } })).toBe(false);
  });

  test("where values use captured vars", () => {
    const trigger = { event: "E", where: { sessionId: "{{sessionId}}" } };

    expect(matches(trigger, "E", payload, { sessionId: "s-1" })).toBe(true);
    expect(matches(trigger, "E", payload, { sessionId: "s-2" })).toBe(false);
  });

  test("capture reads nested paths", () => {
    expect(
      capture({ event: "E", capture: { id: "sessionId", p: "meta.priority", x: "nope" } }, payload),
    ).toEqual({ id: "s-1", p: "2" });
  });

  test("render", () => {
    expect(render("{{a}}/x/{{ b }}/{{c}}", { a: "1", b: "2" })).toBe("1/x/2/");
  });
});

describe("layout", () => {
  const screen = { x: 0, y: 25, w: 1440, h: 875 };

  test("split reserves the indicator strip", () => {
    expect(split(screen, "right", 360)).toEqual({
      indicator: { x: 1080, y: 25, w: 360, h: 875 },
      stage: { x: 0, y: 25, w: 1080, h: 875 },
    });
    expect(split(screen, "bottom", 150).stage).toEqual({ x: 0, y: 25, w: 1440, h: 725 });
  });

  test("main-left stacks the side panes", () => {
    const frames = presetFrames({
      preset: "main-left",
      panes: [{ window: "a" }, { window: "b" }, { window: "c" }],
    });

    expect(frames[0]).toEqual({ x: 0, y: 0, w: 0.62, h: 1 });
    expect(frames[2].y).toBe(0.5);
  });

  test("columns fill the stage with gaps between panes only", () => {
    const [a, b] = resolve(
      { panes: [{ window: "a" }, { window: "b" }] },
      { x: 0, y: 0, w: 1000, h: 800 },
      10,
    );

    expect(a.rect).toEqual({ x: 0, y: 0, w: 495, h: 800 });
    expect(b.rect).toEqual({ x: 505, y: 0, w: 495, h: 800 });
  });
});

describe("split preset", () => {
  const panes = [{ window: "a" }, { window: "b" }];

  test("side by side on landscape stages", () => {
    expect(presetFrames({ preset: "split", panes }, { x: 0, y: 0, w: 1600, h: 900 })[1]).toEqual({
      x: 0.5,
      y: 0,
      w: 0.5,
      h: 1,
    });
  });

  test("stacked on portrait stages", () => {
    expect(presetFrames({ preset: "split", panes }, { x: 0, y: 0, w: 1080, h: 1700 })[1]).toEqual({
      x: 0,
      y: 0.5,
      w: 1,
      h: 0.5,
    });
  });
});

describe("side layout", () => {
  test("left and right use the ratio", () => {
    const frames = presetFrames({
      ratio: 0.4,
      panes: [
        { window: "a", side: "right" },
        { window: "b", side: "left" },
      ],
    });

    expect(frames[0]).toEqual({ x: 0.4, y: 0, w: 0.6, h: 1 });
    expect(frames[1]).toEqual({ x: 0, y: 0, w: 0.4, h: 1 });
  });

  test("a lone side fills the stage and same-side panes stack", () => {
    expect(presetFrames({ panes: [{ window: "a", side: "left" }] })[0]).toEqual({
      x: 0,
      y: 0,
      w: 1,
      h: 1,
    });

    const stacked = presetFrames({
      panes: [
        { window: "a", side: "left" },
        { window: "b", side: "right" },
        { window: "c", side: "right" },
      ],
    });

    expect(stacked[2]).toEqual({ x: 0.5, y: 0.5, w: 0.5, h: 0.5 });
  });
});

describe("routes", () => {
  test("joinRoute appends to the app base path", () => {
    expect(joinRoute("http://localhost:3000/dashboard", "/monitoring")).toBe(
      "http://localhost:3000/dashboard/monitoring",
    );
    expect(joinRoute("http://localhost:5207/", "policies/42")).toBe("http://localhost:5207/policies/42");
    expect(joinRoute("http://localhost:3000/dashboard", "https://example.com/x")).toBe(
      "https://example.com/x",
    );
  });

  test("renderIfReady waits for every var", () => {
    expect(renderIfReady("/agents/{{agentId}}", {})).toBeNull();
    expect(renderIfReady("/agents/{{agentId}}", { agentId: "a1" })).toBe("/agents/a1");
  });
});

describe("coverage", () => {
  const stage = { x: 0, y: 25, w: 1560, h: 875 };

  test("a window filling the stage or the whole screen covers it", () => {
    expect(coverage(stage, stage)).toBe(1);
    expect(coverage({ x: 0, y: 0, w: 1920, h: 1080 }, stage)).toBe(1);
  });

  test("half a stage or a disjoint window does not", () => {
    expect(coverage({ x: 0, y: 25, w: 780, h: 875 }, stage)).toBeCloseTo(0.5);
    expect(coverage({ x: 1600, y: 25, w: 300, h: 875 }, stage)).toBe(0);
  });
});
