import http from "@canmingir/link/platform/http";
import type {
  ApprovalDecision,
  TimelineStep,
} from "../widgets/AgentDevToolWidget/StepTimeline";
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
  resumeStep: (step: TimelineStep) => Promise<void>;
  resumingStepId: string | null;
  decideStep: (step: TimelineStep, decision: ApprovalDecision) => Promise<void>;
  decidingStepId: string | null;
};

const EMPTY_STEPS: TimelineStep[] = [];

function useSessionSteps({
  agentId,
  sessionId,
  enabled,
}: {
  agentId?: string;
  sessionId?: string | null;
  enabled: boolean;
}): SessionSteps {
  const [steps, setSteps] = useState<TimelineStep[]>(EMPTY_STEPS);
  const [taskName, setTaskName] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [resumingStepId, setResumingStepId] = useState<string | null>(null);
  const [decidingStepId, setDecidingStepId] = useState<string | null>(null);

  useEffect(() => {
    setSteps(EMPTY_STEPS);
    setTaskName(null);
    setRunning(false);
    setResumingStepId(null);
    setDecidingStepId(null);
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

      const stepsByTask = await Promise.all(
        tasks.map(({ id }) =>
          http
            .get<TimelineStep[]>(`/tasks/${id}/steps`)
            .then((response) =>
              response.data.map((step) => ({ ...step, taskId: id }))
            )
        )
      );

      if (stopped) return;

      setSteps(stepsByTask.flat());
      setTaskName(tasks[tasks.length - 1].description);
      setRunning(tasks.some(({ status }) => status === "IN_PROGRESS"));
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

  const resumeStep = async (step: TimelineStep) => {
    if (!step.taskId) return;

    setResumingStepId(step.id);
    try {
      await http.post(`/tasks/${step.taskId}/steps/${step.id}/resume`);
    } finally {
      setResumingStepId(null);
    }
  };

  const decideStep = async (step: TimelineStep, decision: ApprovalDecision) => {
    if (!step.taskId) return;

    setDecidingStepId(step.id);
    try {
      await http.post(`/tasks/${step.taskId}/steps/${step.id}/approval`, {
        decision,
      });
    } finally {
      setDecidingStepId(null);
    }
  };

  return {
    steps,
    taskName,
    running,
    resumeStep,
    resumingStepId,
    decideStep,
    decidingStepId,
  };
}

export default useSessionSteps;
