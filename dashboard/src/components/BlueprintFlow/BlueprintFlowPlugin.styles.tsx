import { styled } from "@mui/material/styles";

type ActionButtonPosition = "add" | "edit" | "delete" | "pin";

const ACTION_BUTTON_POSITION: Record<
  ActionButtonPosition,
  { top?: string; right?: string; bottom?: string }
> = {
  add: { top: "8px", right: "0px" },
  edit: { top: "8px", right: "40px" },
  delete: { bottom: "8px", right: "8px" },
  pin: { top: "8px", right: "68px" },
};

export const ActionButtonWrapper = styled("div", {
  shouldForwardProp: (prop) =>
    prop !== "position" && prop !== "hoverColor" && prop !== "active",
})<{
  position: ActionButtonPosition;
  hoverColor?: "primary" | "error";
  active?: boolean;
}>(({ theme, position, hoverColor = "primary", active }) => ({
  position: "absolute",
  ...ACTION_BUTTON_POSITION[position],
  transform: position === "add" ? "translateX(-50%) scale(1)" : undefined,
  width: "24px",
  height: "24px",
  borderRadius: "50%",
  backgroundColor: active ? "#7c3aed" : theme.palette?.background.paper,
  color: active ? "#ffffff" : "#555",
  border: active ? "1px solid #7c3aed" : "1px solid rgba(0, 0, 0, 0.1)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  boxShadow: active
    ? "0 2px 8px rgba(124, 58, 237, 0.4)"
    : "0 2px 6px rgba(0,0,0,0.1)",
  zIndex: 10,
  "--anim-hover-shadow-base": "0 2px 6px rgba(0,0,0,0.1)",
  "&:hover": {
    boxShadow: active
      ? "0 4px 10px rgba(124, 58, 237, 0.5)"
      : "0 4px 8px rgba(0,0,0,0.2)",
    color: active ? "#ffffff" : theme.palette?.[hoverColor].main,
  },
}));

export const PinnedBadge = styled("div")(({ theme }) => ({
  position: "absolute",
  top: "-10px",
  left: "-10px",
  padding: "4px 10px",
  borderRadius: "12px",
  backgroundColor: "#7c3aed",
  color: "#ffffff",
  fontSize: "11px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  boxShadow: `
    0 2px 6px rgba(124, 58, 237, 0.3),
    0 0 0 2px ${theme.palette.background.paper}
  `,
  zIndex: 16,
  whiteSpace: "nowrap",
}));

export const ForceIndicatorWrapper = styled("div", {
  shouldForwardProp: (prop) => prop !== "readonly",
})<{ readonly?: boolean }>(({ theme, readonly }) => ({
  position: "absolute",
  top: "8px",
  right: readonly ? "8px" : "96px",
  width: "24px",
  height: "24px",
  borderRadius: "50%",
  backgroundColor: theme.palette?.background?.paper || "#fff",
  color: "#b8860b",
  border: `1px solid ${"#b8860b"}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
  zIndex: 10,
}));

type HighlightVariant =
  | "pinned"
  | "selected"
  | "failed"
  | "lastUsed"
  | "used"
  | "error"
  | "added"
  | "modified"
  | "removed";

type HighlightColor = {
  border: string;
  glow: string;
  bg: string;
  borderWidth: string;
  bgOpacityStart: string;
  bgOpacityEnd: string;
  boxShadow: (glow: string) => string;
};

const STRONG_BOX_SHADOW = (glow: string) => `
  0 0 0 1px rgba(${glow}, 0.15),
  0 0 20px rgba(${glow}, 0.35),
  0 0 40px rgba(${glow}, 0.2),
  inset 0 0 30px rgba(${glow}, 0.1)
`;

const USED_BOX_SHADOW = (glow: string) => `
  0 0 0 1px rgba(${glow}, 0.1),
  0 0 15px rgba(${glow}, 0.2),
  inset 0 0 20px rgba(${glow}, 0.06)
`;

const CHANGE_BOX_SHADOW = (glow: string) => `
  0 0 0 1px rgba(${glow}, 0.1),
  0 0 20px rgba(${glow}, 0.25),
  0 0 40px rgba(${glow}, 0.15),
  inset 0 0 30px rgba(${glow}, 0.08)
`;

function lightDark(isDark: boolean, light: string, dark: string) {
  return isDark ? dark : light;
}

const HIGHLIGHT_COLOR: Record<
  HighlightVariant,
  (isDark: boolean) => HighlightColor
> = {
  pinned: () => ({
    border: "#7c3aed",
    glow: "124, 58, 237",
    bg: "124, 58, 237",
    borderWidth: "3px",
    bgOpacityStart: "0.12",
    bgOpacityEnd: "0.04",
    boxShadow: STRONG_BOX_SHADOW,
  }),
  selected: () => ({
    border: "#abaaa8",
    glow: "33, 150, 243",
    bg: "33, 150, 243",
    borderWidth: "3px",
    bgOpacityStart: "0.12",
    bgOpacityEnd: "0.04",
    boxShadow: STRONG_BOX_SHADOW,
  }),
  failed: (isDark) => ({
    border: lightDark(isDark, "#f44336", "#ef5350"),
    glow: "244, 67, 54",
    bg: "244, 67, 54",
    borderWidth: "3px",
    bgOpacityStart: "0.12",
    bgOpacityEnd: "0.04",
    boxShadow: STRONG_BOX_SHADOW,
  }),
  lastUsed: (isDark) => ({
    border: lightDark(isDark, "#ff9800", "#ffa726"),
    glow: "255, 152, 0",
    bg: "255, 152, 0",
    borderWidth: "3px",
    bgOpacityStart: "0.12",
    bgOpacityEnd: "0.04",
    boxShadow: STRONG_BOX_SHADOW,
  }),
  used: (isDark) => ({
    border: lightDark(isDark, "#4caf50", "#66bb6a"),
    glow: "76, 175, 80",
    bg: "76, 175, 80",
    borderWidth: "2px",
    bgOpacityStart: "0.08",
    bgOpacityEnd: "0.04",
    boxShadow: USED_BOX_SHADOW,
  }),
  error: (isDark) => ({
    border: lightDark(isDark, "#f44336", "#ef5350"),
    glow: "244, 67, 54",
    bg: "244, 67, 54",
    borderWidth: "3px",
    bgOpacityStart: "0.12",
    bgOpacityEnd: "0.04",
    boxShadow: STRONG_BOX_SHADOW,
  }),
  added: (isDark) => ({
    border: lightDark(isDark, "#4caf50", "#66bb6a"),
    glow: "76, 175, 80",
    bg: "76, 175, 80",
    borderWidth: "3px",
    bgOpacityStart: "0.08",
    bgOpacityEnd: "0.02",
    boxShadow: CHANGE_BOX_SHADOW,
  }),
  modified: (isDark) => ({
    border: lightDark(isDark, "#ff9800", "#ffa726"),
    glow: lightDark(isDark, "255, 152, 0", "255, 167, 38"),
    bg: lightDark(isDark, "255, 152, 0", "255, 167, 38"),
    borderWidth: "3px",
    bgOpacityStart: "0.08",
    bgOpacityEnd: "0.02",
    boxShadow: CHANGE_BOX_SHADOW,
  }),
  removed: (isDark) => ({
    border: lightDark(isDark, "#f44336", "#ef5350"),
    glow: lightDark(isDark, "244, 67, 54", "239, 83, 80"),
    bg: lightDark(isDark, "244, 67, 54", "239, 83, 80"),
    borderWidth: "3px",
    bgOpacityStart: "0.08",
    bgOpacityEnd: "0.02",
    boxShadow: CHANGE_BOX_SHADOW,
  }),
};

function resolveHighlightVariant({
  changetype,
  haserror,
  isused,
  islastused,
  isfailed,
  isselected,
  ispinned,
}: {
  changetype?: string;
  haserror?: string;
  isused?: string;
  islastused?: string;
  isfailed?: string;
  isselected?: string;
  ispinned?: string;
}): HighlightVariant | undefined {
  if (ispinned === "true") return "pinned";
  if (isselected === "true") return "selected";
  if (isfailed === "true") return "failed";
  if (islastused === "true") return "lastUsed";
  if (isused === "true") return "used";
  if (haserror === "true") return "error";
  if (
    changetype === "added" ||
    changetype === "modified" ||
    changetype === "removed"
  ) {
    return changetype;
  }
  return undefined;
}

export const HighlightOverlay = styled("div")<{
  changetype?: string;
  haserror?: string;
  isused?: string;
  islastused?: string;
  isfailed?: string;
  isselected?: string;
  ispinned?: string;
}>((props) => {
  const { theme } = props;
  const isDark = theme.palette.mode === "dark";
  const variant = resolveHighlightVariant(props);
  if (!variant) return { display: "none" };

  const {
    border,
    glow,
    bg,
    borderWidth,
    bgOpacityStart,
    bgOpacityEnd,
    boxShadow,
  } = HIGHLIGHT_COLOR[variant](isDark);

  return {
    position: "absolute",
    top: "-2px",
    left: "-2px",
    right: "-2px",
    bottom: "-2px",
    border: `${borderWidth} solid ${border}`,
    borderRadius: "18px",
    pointerEvents: "none",
    zIndex: 5,
    background: `linear-gradient(135deg, rgba(${bg}, ${bgOpacityStart}) 0%, rgba(${bg}, ${bgOpacityEnd}) 100%)`,
    boxShadow: boxShadow(glow),
  };
});

export const ChangeBadge = styled("div")<{ changetype?: string }>(
  ({ changetype, theme }) => {
    const isDark = theme.palette.mode === "dark";

    const colors = {
      added: {
        bg: isDark ? "#66bb6a" : "#4caf50",
        text: "#ffffff",
        icon: "+",
      },
      modified: {
        bg: isDark ? "#ffa726" : "#ff9800",
        text: "#ffffff",
        icon: "~",
      },
      removed: {
        bg: isDark ? "#ef5350" : "#f44336",
        text: "#ffffff",
        icon: "×",
      },
    };

    const config = colors[changetype];
    if (!config) return { display: "none" };

    return {
      position: "absolute",
      top: "-10px",
      right: "-10px",
      width: "28px",
      height: "28px",
      borderRadius: "50%",
      backgroundColor: config.bg,
      color: config.text,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "16px",
      fontWeight: "bold",
      boxShadow: `
        0 2px 8px rgba(0, 0, 0, 0.2),
        0 0 0 3px ${theme.palette.background.paper}
      `,
      zIndex: 15,
      "&::before": {
        content: `"${config.icon}"`,
      },
    };
  }
);

export const ChangeLabel = styled("div", {
  shouldForwardProp: (prop) => prop !== "ispinned",
})<{ changetype?: string; ispinned?: boolean }>(
  ({ changetype, theme, ispinned }) => {
    const isDark = theme.palette.mode === "dark";

    const colors = {
      added: {
        bg: isDark ? "#66bb6a" : "#4caf50",
        text: "#ffffff",
        label: "Added",
      },
      modified: {
        bg: isDark ? "#ffa726" : "#ff9800",
        text: "#ffffff",
        label: "Modified",
      },
      removed: {
        bg: isDark ? "#ef5350" : "#f44336",
        text: "#ffffff",
        label: "Removed",
      },
    };

    const config = colors[changetype];
    if (!config) return { display: "none" };

    return {
      position: "absolute",
      top: "-10px",
      left: ispinned ? "70px" : "-10px",
      padding: "4px 10px",
      borderRadius: "12px",
      backgroundColor: config.bg,
      color: config.text,
      fontSize: "11px",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      boxShadow: `
        0 2px 6px rgba(0, 0, 0, 0.15),
        0 0 0 2px ${theme.palette.background.paper}
      `,
      zIndex: 15,
      whiteSpace: "nowrap",
      "&::before": {
        content: `"${config.label}"`,
      },
    };
  }
);

export type StatusVariant = "error" | "used" | "failed" | "supervise";

const STATUS_CONFIG: Record<
  StatusVariant,
  { bgLight: string; bgDark: string; icon: string; label: string }
> = {
  error: { bgLight: "#f44336", bgDark: "#ef5350", icon: "!", label: "Error" },
  used: {
    bgLight: "#4caf50",
    bgDark: "#66bb6a",
    icon: "✓",
    label: "Completed",
  },
  failed: { bgLight: "#f44336", bgDark: "#ef5350", icon: "✕", label: "Failed" },
  supervise: {
    bgLight: "#ff9800",
    bgDark: "#ffa726",
    icon: "⚠",
    label: "Supervise Needed",
  },
};

export const StatusBadge = styled("div")<{ variant: StatusVariant }>(
  ({ variant, theme }) => {
    const isDark = theme.palette.mode === "dark";
    const config = STATUS_CONFIG[variant];

    return {
      position: "absolute",
      top: "-10px",
      right: "-10px",
      width: "28px",
      height: "28px",
      borderRadius: "50%",
      backgroundColor: isDark ? config.bgDark : config.bgLight,
      color: "#ffffff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "16px",
      fontWeight: "bold",
      boxShadow: `
        0 2px 8px rgba(0, 0, 0, 0.2),
        0 0 0 3px ${theme.palette.background.paper}
      `,
      zIndex: 15,
      "&::before": {
        content: `"${config.icon}"`,
      },
    };
  }
);

export const StatusLabel = styled("div")<{ variant: StatusVariant }>(
  ({ variant, theme }) => {
    const isDark = theme.palette.mode === "dark";
    const config = STATUS_CONFIG[variant];

    return {
      position: "absolute",
      top: "-10px",
      left: "-10px",
      padding: "4px 10px",
      borderRadius: "12px",
      backgroundColor: isDark ? config.bgDark : config.bgLight,
      color: "#ffffff",
      fontSize: "11px",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      boxShadow: `
        0 2px 6px rgba(0, 0, 0, 0.15),
        0 0 0 2px ${theme.palette.background.paper}
      `,
      zIndex: 15,
      whiteSpace: "nowrap",
      "&::before": {
        content: `"${config.label}"`,
      },
    };
  }
);

export const ForceBadge = styled("div")(({ theme }) => ({
  position: "absolute",
  top: "-13px",
  left: "50%",
  transform: "translateX(-50%)",
  display: "inline-flex",
  alignItems: "center",
  gap: 3,
  padding: "2px 8px 2px 6px",
  borderRadius: 999,
  fontSize: 10,
  fontWeight: 700,
  lineHeight: 1.6,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
  color: "#b8860b",
  background: theme.palette.background.paper,
  border: `1px solid ${"#b8860b"}`,
  boxShadow: "0 1px 4px rgba(0, 0, 0, 0.18)",
  pointerEvents: "none",
  zIndex: 6,
}));

export const NodeWrapper = styled("div", {
  shouldForwardProp: (prop) =>
    prop !== "isApproval" &&
    prop !== "isDecision" &&
    prop !== "isDecision" &&
    prop !== "isEndpoint" &&
    prop !== "isEndpointStart",
})<{
  isApproval?: boolean;
  isDecision?: boolean;
  isEndpoint?: boolean;
  isEndpointStart?: boolean;
}>(({ isApproval, isDecision, isEndpoint, isEndpointStart }) => {
  const stepColor = isApproval
    ? "#174f77"
    : isDecision
    ? "#4a4a4a"
    : isDecision
    ? "#4a4a4a"
    : isEndpoint
    ? "#4a4a4a"
    : "#174f77";
  const steppedShadow = `
    1px 1px 0 ${stepColor},
    2px 2px 0 ${stepColor},
    3px 3px 0 ${stepColor},
    4px 4px 0 ${stepColor},
    5px 5px 0 ${stepColor},
    6px 6px 0 ${stepColor},
    7px 7px 0 ${stepColor},
    10px 10px 20px rgba(0, 0, 0, 0.4),
    20px 20px 40px rgba(0, 0, 0, 0.5)
  `;
  const borderRadius = isEndpoint
    ? isEndpointStart
      ? "40px 0 0 40px"
      : "0 40px 40px 0"
    : "16px";

  return {
    position: "relative",
    width: "100%",
    height: "100%",
    borderRadius,
    transformStyle: "preserve-3d",
    transform: "perspective(1500px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)",
    boxShadow: steppedShadow,
    transition:
      "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease, filter 0.25s ease",
    "&:hover": {
      transform:
        "perspective(1500px) rotateX(0deg) rotateY(-10deg) rotateZ(0deg)",
      boxShadow: steppedShadow,
    },
  };
});
