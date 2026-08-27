import { on, publish, releaseAll, waitFor } from "./bus";
import type { EventName, Payload, SupervisingAnswered } from "./types";

const WATCHED = {
  aiAssistantMessaged: "AI_ASSISTANT_MESSAGED",
  stepAdded: "STEP_ADDED",
  stepWaitingForUser: "STEP_WAITING_FOR_USER",
  stepCompleted: "STEP_COMPLETED",
  stepSupervisedNeeded: "STEP_SUPERVISED_NEEDED",
  supervisingRaised: "SUPERVISING_RAISED",
  supervisingAnswered: "SUPERVISING_ANSWERED",
  taskCreated: "TASK_CREATED",
  taskCompleted: "TASK_COMPLETED",
} as const satisfies Record<string, EventName>;

type Watched = {
  [K in keyof typeof WATCHED]: Promise<Payload<(typeof WATCHED)[K]>>;
};

function watch(): Watched {
  const armed = Object.entries(WATCHED).map(([alias, type]) => [
    alias,
    waitFor(type),
  ]);

  return Object.fromEntries(armed) as Watched;
}

type Message = {
  agentId: string;
  sessionId: string;
  content: string | Record<string, unknown>;
};

function userMessaged({ agentId, sessionId, content }: Message) {
  return publish("SESSION_USER_MESSAGED", {
    agentId,
    sessionId,
    content: typeof content === "string" ? content : JSON.stringify(content),
  });
}

function supervisorAnswered(answer: SupervisingAnswered) {
  return publish("SUPERVISING_ANSWERED", answer);
}

const events = {
  on,
  publish,
  waitFor,
  watch,
  release: releaseAll,
  userMessaged,
  supervisorAnswered,
};

export default events;
export type { Watched };
export type {
  AiAssistantMessaged,
  EventMap,
  EventName,
  Payload,
  SessionUserMessaged,
  StepAdded,
  StepSettled,
  StepSupervisedNeeded,
  SupervisingAnswered,
  SupervisingRaised,
  TaskCompleted,
  TaskCreated,
} from "./types";
