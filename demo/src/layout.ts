import type { Frame, IndicatorPosition, Layout, Rect } from "./types";

function split(screen: Rect, position: IndicatorPosition, size: number) {
  const { x, y, w, h } = screen;

  switch (position) {
    case "left":
      return {
        indicator: { x, y, w: size, h },
        stage: { x: x + size, y, w: w - size, h },
      };
    case "top":
      return {
        indicator: { x, y, w, h: size },
        stage: { x, y: y + size, w, h: h - size },
      };
    case "bottom":
      return {
        indicator: { x, y: y + h - size, w, h: size },
        stage: { x, y, w, h: h - size },
      };
    default:
      return {
        indicator: { x: x + w - size, y, w: size, h },
        stage: { x, y, w: w - size, h },
      };
  }
}

function sideFrames(layout: Layout): Frame[] {
  const ratio = Math.min(0.85, Math.max(0.15, layout.ratio ?? 0.5));
  const count = (side: string) => layout.panes.filter((pane) => pane.side === side).length;
  const seen: Record<string, number> = { left: 0, right: 0, full: 0 };
  const hasLeft = count("left") > 0;
  const hasRight = count("right") > 0;

  return layout.panes.map((pane) => {
    const side = pane.side ?? "full";
    const index = seen[side]++;
    const stacked = count(side);

    if (side === "left") {
      const w = hasRight ? ratio : 1;
      return { x: 0, y: index / stacked, w, h: 1 / stacked };
    }

    if (side === "right") {
      const x = hasLeft ? ratio : 0;
      return { x, y: index / stacked, w: 1 - x, h: 1 / stacked };
    }

    return { x: 0, y: 0, w: 1, h: 1 };
  });
}

function presetFrames(layout: Layout, stage?: Rect): Frame[] {
  if (layout.panes.some((pane) => pane.side)) {
    return sideFrames(layout);
  }

  const count = layout.panes.length;
  const even = (index: number) => index / count;
  const preset =
    layout.preset === "split"
      ? stage && stage.h > stage.w
        ? "rows"
        : "columns"
      : layout.preset ?? "columns";

  switch (preset) {
    case "full":
      return layout.panes.map(() => ({ x: 0, y: 0, w: 1, h: 1 }));
    case "rows":
      return layout.panes.map((_, index) => ({
        x: 0,
        y: even(index),
        w: 1,
        h: 1 / count,
      }));
    case "main-left":
    case "main-right": {
      const main = count > 1 ? 0.62 : 1;
      const left = layout.preset === "main-left";
      const side = count - 1;

      return layout.panes.map((_, index) =>
        index === 0
          ? { x: left ? 0 : 1 - main, y: 0, w: main, h: 1 }
          : {
              x: left ? main : 0,
              y: (index - 1) / side,
              w: 1 - main,
              h: 1 / side,
            },
      );
    }
    case "grid": {
      const cols = Math.ceil(Math.sqrt(count));
      const rows = Math.ceil(count / cols);

      return layout.panes.map((_, index) => ({
        x: (index % cols) / cols,
        y: Math.floor(index / cols) / rows,
        w: 1 / cols,
        h: 1 / rows,
      }));
    }
    default:
      return layout.panes.map((_, index) => ({
        x: even(index),
        y: 0,
        w: 1 / count,
        h: 1,
      }));
  }
}

function place(stage: Rect, frame: Frame, gap: number): Rect {
  const half = gap / 2;
  const left = stage.x + stage.w * frame.x + (frame.x > 0 ? half : 0);
  const top = stage.y + stage.h * frame.y + (frame.y > 0 ? half : 0);
  const right =
    stage.x + stage.w * (frame.x + frame.w) - (frame.x + frame.w < 1 ? half : 0);
  const bottom =
    stage.y + stage.h * (frame.y + frame.h) - (frame.y + frame.h < 1 ? half : 0);

  return {
    x: Math.round(left),
    y: Math.round(top),
    w: Math.round(right - left),
    h: Math.round(bottom - top),
  };
}

function resolve(layout: Layout, stage: Rect, gap: number) {
  const frames = presetFrames(layout, stage);

  return layout.panes.map((pane, index) => ({
    pane,
    rect: place(stage, pane.frame ?? frames[index], gap),
  }));
}

function coverage(window: Rect, area: Rect): number {
  const w = Math.min(window.x + window.w, area.x + area.w) - Math.max(window.x, area.x);
  const h = Math.min(window.y + window.h, area.y + area.h) - Math.max(window.y, area.y);

  return w > 0 && h > 0 && area.w > 0 && area.h > 0 ? (w * h) / (area.w * area.h) : 0;
}

export { coverage, place, presetFrames, resolve, split };
