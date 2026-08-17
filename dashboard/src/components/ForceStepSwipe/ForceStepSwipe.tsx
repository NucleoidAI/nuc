import { Box, Typography } from "@mui/material";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { type Theme, alpha } from "@mui/material/styles";

const ForceStepSwipe = ({
  checked,
  onChange,
  theme,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  theme: Theme;
}) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const thumbSize = 40;
  const trackPadding = 4;

  const [progress, setProgress] = useState(checked ? 1 : 0);
  const [dragging, setDragging] = useState(false);
  const dragState = useRef<{
    startX: number;
    startProgress: number;
    width: number;
  } | null>(null);
  useEffect(() => {
    if (dragState.current) return;
    setProgress(checked ? 1 : 0);
  }, [checked]);

  const getTravel = useCallback(() => {
    const width = trackRef.current?.getBoundingClientRect().width ?? 0;
    return Math.max(width - thumbSize - trackPadding * 2, 1);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = {
      startX: e.clientX,
      startProgress: progress,
      width: getTravel(),
    };
    setDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState.current) return;
    const { startX, startProgress, width } = dragState.current;
    const delta = (e.clientX - startX) / width;
    const next = Math.min(1, Math.max(0, startProgress + delta));
    setProgress(next);
  };

  const settle = (endX?: number, allowClickToggle = false) => {
    if (!dragState.current) return;
    const { startX } = dragState.current;
    const moved = endX != null && Math.abs(endX - startX) > 3;

    dragState.current = null;
    setDragging(false);

    const completed = !moved && allowClickToggle ? !checked : progress >= 0.7;
    setProgress(completed ? 1 : 0);
    if (completed !== checked) onChange(completed);
  };

  const handlePointerUp = (e: React.PointerEvent) => settle(e.clientX, true);
  const handlePointerCancel = () => settle(undefined, false);

  const handleKeyToggle = () => {
    const next = !checked;
    setProgress(next ? 1 : 0);
    onChange(next);
  };

  const trackColor = alpha(
    theme.palette.background.paper,
    0.15 + progress * 0.25
  );
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
  const trackBackground =
    band > 0
      ? `linear-gradient(135deg, ${alpha(
          theme.palette.secondary.light,
          bandMix * bandOpacity
        )}, ${alpha(
          theme.palette.primary.main,
          (1 - bandMix + 0.3) * bandOpacity
        )})`
      : trackColor;
  const settleTransition = "transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1)";

  return (
    <Box
      ref={trackRef}
      role="switch"
      aria-checked={checked}
      aria-label="Force node"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleKeyToggle();
        }
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      sx={{
        position: "relative",
        width: 160,
        height: thumbSize + trackPadding * 2,
        borderRadius: 999,
        p: `${trackPadding}px`,
        cursor: "pointer",
        userSelect: "none",
        touchAction: "none",
        background: trackBackground,
        border: "1px solid",
        borderColor: alpha(theme.palette.background.paper, 1),
        transition: dragging
          ? "none"
          : "background 200ms ease, border-color 200ms ease",
        overflow: "hidden",
      }}
    >
      <Typography
        variant="caption"
        sx={{
          position: "absolute",
          right: 12,
          top: "50%",
          transform: "translateY(-50%)",
          fontWeight: 600,
          color: alpha(theme.palette.background.paper, 0.5 + progress * 0.5),
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
      <Box
        sx={{
          position: "relative",
          width: thumbSize,
          height: thumbSize,
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
        <Box
          component="span"
          sx={{
            position: "absolute",
            fontSize: 18,
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
      </Box>
    </Box>
  );
};

export default ForceStepSwipe;
