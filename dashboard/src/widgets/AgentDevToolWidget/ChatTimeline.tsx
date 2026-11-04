import { AIMessage, HumanMessage } from "@canmingir/link/platform/components";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import StepTimeline, { type TimelineStep } from "./StepTimeline";
import { useEffect, useMemo, useRef } from "react";

export type TimelineMessage = {
  id?: string;
  role: string;
  content: string;
  createdAt?: string;
};

type Item =
  | { kind: "message"; key: string; message: TimelineMessage }
  | { kind: "steps"; key: string; steps: TimelineStep[] };

const timeOf = (value?: string) =>
  value ? new Date(value).getTime() : Number.MAX_SAFE_INTEGER;

function buildItems(messages: TimelineMessage[], steps: TimelineStep[]) {
  const entries = [
    ...messages.map((message, index) => ({
      time: timeOf(message.createdAt),
      order: index,
      message,
    })),
    ...steps.map((step, index) => ({
      time: timeOf(step.createdAt),
      order: index,
      step,
    })),
  ].sort((a, b) => a.time - b.time || a.order - b.order);

  return entries.reduce<Item[]>((items, entry, index) => {
    if ("message" in entry) {
      items.push({
        kind: "message",
        key: entry.message.id ?? `message-${index}`,
        message: entry.message,
      });
      return items;
    }

    const last = items[items.length - 1];
    if (last?.kind === "steps") {
      last.steps.push(entry.step);
    } else {
      items.push({
        kind: "steps",
        key: `steps-${entry.step.id}`,
        steps: [entry.step],
      });
    }
    return items;
  }, []);
}

const ChatTimeline = ({
  messages,
  steps,
  running,
}: {
  messages: TimelineMessage[];
  steps: TimelineStep[];
  running: boolean;
}) => {
  const endRef = useRef<HTMLDivElement>(null);
  const items = useMemo(() => buildItems(messages, steps), [messages, steps]);
  const waiting = running || messages[messages.length - 1]?.role === "USER";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [items.length, steps.length, waiting]);

  return (
    <Stack spacing={1.5}>
      {items.map((item) =>
        item.kind === "steps" ? (
          <StepTimeline key={item.key} steps={item.steps} />
        ) : item.message.role === "USER" ? (
          <HumanMessage
            key={item.key}
            message={{ id: item.key, content: item.message.content }}
          />
        ) : (
          <AIMessage key={item.key} content={item.message.content} />
        )
      )}
      {waiting && (
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ color: "text.disabled", px: 0.5 }}
        >
          <CircularProgress size={10} color="inherit" />
          <Typography sx={{ fontSize: 11.5 }}>running…</Typography>
        </Stack>
      )}
      <Box ref={endRef} />
    </Stack>
  );
};

export default ChatTimeline;
