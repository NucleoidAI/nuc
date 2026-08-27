import { releaseAll, waitFor } from "./bus";
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

function init(): Watched {
  let current: Watched | undefined;

  beforeEach(() => {
    current = watch();
  });

  afterEach(async () => {
    await releaseAll();
    current = undefined;
  });

  return new Proxy({} as Watched, {
    get(_, key) {
      if (!current) {
        throw new Error(
          "[e2e] the scenario is only armed inside a test — events.init() " +
            "watches the bus from beforeEach until afterEach."
        );
      }

      return current[key as keyof Watched];
    },
  });
}

export { init, watch, WATCHED };
export type { Watched };
