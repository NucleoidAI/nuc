import { Box, Typography } from "@mui/material";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { type Theme, alpha } from "@mui/material/styles";

type PaletteColor =
  | "primary"
  | "secondary"
  | "success"
  | "error"
  | "warning"
  | "info";

const Swipe = ({
  checked,
  onChange,
  theme,
  disabled = false,
  ariaLabel = "Force node",
  offLabel,
  onLabel,
  color,
  idleColor,
  variant = "gradient",
  width = 160,
  height = 40,
  trackPadding = 4,
  thumbSize,
  showThumbIcon = true,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  theme: Theme;
  disabled?: boolean;
  ariaLabel?: string;
  offLabel?: string;
  onLabel?: string;
  color?: PaletteColor;
  idleColor?: PaletteColor;
  variant?: "solid" | "gradient";
  width?: number;
  height?: number;
  trackPadding?: number;
  thumbSize?: number;
  showThumbIcon?: boolean;
}) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const resolvedThumbSize = thumbSize ?? Math.max(height - trackPadding * 2, 1);
  const hasOuterLabels = offLabel !== undefined || onLabel !== undefined;

  const [progress, setProgress] = useState(checked ? 1 : 0);
  const [dragging, setDragging] = useState(false);
  const progressRef = useRef(progress);
  const dragState = useRef<{
    startX: number;
    startProgress: number;
    width: number;
  } | null>(null);

  const checkedRef = useRef(checked);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    checkedRef.current = checked;
    onChangeRef.current = onChange;
  });

  const updateProgress = (value: number) => {
    progressRef.current = value;
    setProgress(value);
  };

  useEffect(() => {
    if (dragState.current) return;
    updateProgress(checked ? 1 : 0);
  }, [checked]);

  const getTravel = useCallback(() => {
    const trackWidth = trackRef.current?.getBoundingClientRect().width ?? width;
    return Math.max(trackWidth - resolvedThumbSize - trackPadding * 2, 1);
  }, [width, resolvedThumbSize, trackPadding]);

  const progressFromX = useCallback((clientX: number) => {
    if (!dragState.current) return progressRef.current;
    const { startX, startProgress, width: travel } = dragState.current;
    return Math.min(
      1,
      Math.max(0, startProgress + (clientX - startX) / travel)
    );
  }, []);

  const endDrag = useCallback(
    (endX?: number) => {
      if (!dragState.current) return;

      const { startProgress } = dragState.current;
      const finalProgress =
        endX === undefined ? progressRef.current : progressFromX(endX);

      dragState.current = null;
      setDragging(false);
      window.removeEventListener("pointermove", onWindowMove);
      window.removeEventListener("pointerup", onWindowUp);
      window.removeEventListener("pointercancel", onWindowCancel);

      const travel = finalProgress - startProgress;
      const commitThreshold = 0.2;

      let completed: boolean;
      if (travel > commitThreshold) {
        completed = true;
      } else if (travel < -commitThreshold) {
        completed = false;
      } else {
        completed = finalProgress >= 0.5;
      }

      updateProgress(completed ? 1 : 0);
      if (completed !== checkedRef.current) onChangeRef.current(completed);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [progressFromX]
  );

  const onWindowMove = useCallback(
    (e: PointerEvent) => {
      if (!dragState.current) return;
      updateProgress(progressFromX(e.clientX));
    },
    [progressFromX]
  );
  const onWindowUp = useCallback(
    (e: PointerEvent) => endDrag(e.clientX),
    [endDrag]
  );
  const onWindowCancel = useCallback(() => endDrag(), [endDrag]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    dragState.current = {
      startX: e.clientX,
      startProgress: progressRef.current,
      width: getTravel(),
    };
    setDragging(true);
    window.addEventListener("pointermove", onWindowMove);
    window.addEventListener("pointerup", onWindowUp);
    window.addEventListener("pointercancel", onWindowCancel);
  };

  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", onWindowMove);
      window.removeEventListener("pointerup", onWindowUp);
      window.removeEventListener("pointercancel", onWindowCancel);
    };
  }, [onWindowMove, onWindowUp, onWindowCancel]);

  const handleKeyToggle = () => {
    if (disabled) return;
    const next = !checked;
    updateProgress(next ? 1 : 0);
    onChange(next);
  };

  const settleTransition = "transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1)";

  const band =
    progress <= 0
      ? 0
      : progress <= 0.25
      ? 1
      : progress <= 0.5
      ? 2
      : progress <= 0.75
      ? 3
      : 4;
  const bandOpacity = [0, 0.3, 0.5, 0.65, 0.7][band];
  const bandMix = [0.5, 0.5, 0.6, 0.7, 0.9][band];
  const idleBackground = idleColor
    ? theme.palette[idleColor].main
    : alpha(theme.palette.background.paper, 0.15 + progress * 0.25);

  let trackBackground: string;
  if (!color) {
    trackBackground =
      band > 0
        ? `linear-gradient(135deg, ${alpha(
            theme.palette.secondary.light,
            bandMix * bandOpacity
          )}, ${alpha(
            theme.palette.primary.main,
            (1 - bandMix + 0.3) * bandOpacity
          )})`
        : idleBackground;
  } else if (variant === "gradient") {
    const pc = theme.palette[color];
    trackBackground =
      band > 0
        ? `linear-gradient(135deg, ${alpha(
            pc.light,
            bandMix * bandOpacity
          )}, ${alpha(pc.main, (1 - bandMix + 0.3) * bandOpacity)})`
        : idleBackground;
  } else {
    trackBackground = alpha(theme.palette[color].main, 1);
  }

  const borderColor = alpha(theme.palette.background.paper, 1);

  const thumb = (
    <Box
      sx={{
        position: "relative",
        width: resolvedThumbSize,
        height: resolvedThumbSize,
        borderRadius: "50%",
        backgroundColor: "background.paper",
        boxShadow: dragging ? 4 : 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `translateX(${progress * getTravel()}px)`,
        transition: dragging
          ? "none"
          : `${settleTransition}, box-shadow 200ms ease`,
        touchAction: "none",
      }}
    >
      {showThumbIcon && (
        <Box
          component="span"
          sx={{
            position: "absolute",
            fontSize: resolvedThumbSize * 0.45,
            lineHeight: 1,
            filter: `grayscale(${1 - progress})`,
            opacity: 0.5 + progress * 0.5,
            transform: `scale(${0.7 + progress * 0.3})`,
            transition: dragging
              ? "none"
              : "opacity 200ms ease, transform 200ms ease, filter 200ms ease",
          }}
        >
          ⚡️
        </Box>
      )}
    </Box>
  );

  const track = (
    <Box
      ref={trackRef}
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled}
      aria-label={ariaLabel}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleKeyToggle();
        }
      }}
      onPointerDown={handlePointerDown}
      sx={{
        position: "relative",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        width,
        height,
        borderRadius: 999,
        px: `${trackPadding}px`,
        cursor: disabled ? "not-allowed" : "grab",
        opacity: disabled ? 0.5 : 1,
        userSelect: "none",
        touchAction: "none",
        background: trackBackground,
        border: "1px solid",
        borderColor,
        transition: dragging
          ? "none"
          : "background 200ms ease, border-color 200ms ease",
        overflow: "hidden",
        "&:active": { cursor: disabled ? "not-allowed" : "grabbing" },
      }}
    >
      {!hasOuterLabels && (
        <>
          <Typography
            variant="caption"
            sx={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              fontWeight: 600,
              color: alpha(
                theme.palette.background.paper,
                0.5 + progress * 0.5
              ),
              opacity: 1 - progress,
              pointerEvents: "none",
              transition: dragging ? "none" : "opacity 250ms ease",
            }}
          >
            Off
          </Typography>
          <Typography
            variant="caption"
            sx={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              fontWeight: 600,
              color: theme.palette.success.contrastText,
              opacity: progress,
              pointerEvents: "none",
              transition: dragging ? "none" : "opacity 250ms ease",
            }}
          >
            On
          </Typography>
        </>
      )}
      {thumb}
    </Box>
  );

  if (!hasOuterLabels) return track;

  const labelSx = {
    fontWeight: 600,
    whiteSpace: "nowrap" as const,
    pointerEvents: "none" as const,
    userSelect: "none" as const,
    transition: dragging ? "none" : "color 200ms ease, opacity 200ms ease",
  };

  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1.5 }}>
      {offLabel !== undefined && (
        <Typography
          variant="caption"
          sx={{
            ...labelSx,
            color: "text.primary",
            opacity: 1,
          }}
        >
          {offLabel}
        </Typography>
      )}
      {track}
      {onLabel !== undefined && (
        <Typography
          variant="caption"
          sx={{
            ...labelSx,
            color: "text.primary",
            opacity: 1,
          }}
        >
          {onLabel}
        </Typography>
      )}
    </Box>
  );
};

export default Swipe;
