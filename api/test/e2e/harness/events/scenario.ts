import { waitFor } from "./bus";
import type { EventName, Payload } from "./types";

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

export { watch, WATCHED };
export type { Watched };
