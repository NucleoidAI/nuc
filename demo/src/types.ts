type Scalar = string | number | boolean | null;

type Condition =
  | Scalar
  | {
      equals?: unknown;
      not?: unknown;
      contains?: string;
      matches?: string;
      in?: unknown[];
      exists?: boolean;
    };

type Mode = "auto" | "manual";

type EventTrigger = {
  event: string;
  mode?: Mode;
  where?: Record<string, Condition>;
  capture?: Record<string, string>;
  label?: string;
};

type DelayTrigger = {
  delay: number;
  mode?: Mode;
  label?: string;
};

type WindowState = "open" | "front" | "fullscreen";

type WindowTrigger = {
  window: string;
  state: WindowState;
  mode?: Mode;
  label?: string;
};

type Trigger = EventTrigger | DelayTrigger | WindowTrigger;

type WindowDef =
  | { type: "chrome"; url?: string; profile?: string }
  | { type: "chrome-app"; app: string; url?: string }
  | { type: "app"; app: string; process?: string };

type Frame = { x: number; y: number; w: number; h: number };

type Preset =
  | "full"
  | "split"
  | "columns"
  | "rows"
  | "main-left"
  | "main-right"
  | "grid";

type Side = "left" | "right" | "full";

type Pane = { window: string; url?: string; route?: string; side?: Side; frame?: Frame };

type Layout = { preset?: Preset; ratio?: number; panes: Pane[] };

type Step = {
  id: string;
  title: string;
  note?: string;
  layout?: Layout;
  advance?: Trigger[];
};

type IndicatorPosition = "left" | "right" | "top" | "bottom";

type DemoCase = {
  name: string;
  description?: string;
  mode?: Mode;
  vars?: Record<string, string>;
  indicator?: {
    position?: IndicatorPosition;
    size?: number;
    mode?: "overlay" | "window";
    reserve?: boolean;
  };
  gap?: number;
  captures?: EventTrigger[];
  windows: Record<string, WindowDef>;
  steps: Step[];
};

type Rect = { x: number; y: number; w: number; h: number };

export type {
  Condition,
  DelayTrigger,
  DemoCase,
  EventTrigger,
  Frame,
  IndicatorPosition,
  Layout,
  Mode,
  Pane,
  Preset,
  Rect,
  Side,
  Step,
  Trigger,
  WindowDef,
  WindowState,
  WindowTrigger,
};
