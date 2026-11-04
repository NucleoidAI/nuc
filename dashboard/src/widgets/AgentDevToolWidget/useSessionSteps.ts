import type { TimelineStep } from "./StepTimeline";
import http from "@canmingir/link/platform/http";
import { useEffect, useState } from "react";

const POLL_INTERVAL = 1500;

type SessionTask = {
  id: string;
  sessionId: string | null;
  description: string;
  status: string;
  createdAt: string;
};

type SessionSteps = {
  steps: TimelineStep[];
  taskName: string | null;
  running: boolean;
};

const EMPTY: SessionSteps = { steps: [], taskName: null, running: false };

function useSessionSteps({
  agentId,
  sessionId,
  enabled,
}: {
  agentId?: string;
  sessionId?: string | null;
  enabled: boolean;
}) {
  const [state, setState] = useState<SessionSteps>(EMPTY);

  useEffect(() => {
    setState(EMPTY);
  }, [sessionId]);

  useEffect(() => {
    if (!enabled || !agentId || !sessionId) return;

    let stopped = false;

    const tick = async () => {
      const { data } = await http.get<SessionTask[]>(
        `/tasks?agentId=${agentId}`
      );
      const tasks = data
        .filter((task) => task.sessionId === sessionId)
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

      if (!tasks.length) return;

      const steps = await Promise.all(
        tasks.map(({ id }) =>
          http
            .get<TimelineStep[]>(`/tasks/${id}/steps`)
            .then((response) => response.data)
        )
      );

      if (stopped) return;

      setState({
        steps: steps.flat(),
        taskName: tasks[tasks.length - 1].description,
        running: tasks.some(({ status }) => status === "IN_PROGRESS"),
      });
    };

    const loop = async () => {
      while (!stopped) {
        await tick().catch(() => undefined);
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
      }
    };

    loop();

    return () => {
      stopped = true;
    };
  }, [enabled, agentId, sessionId]);

  return state;
}

export default useSessionSteps;
