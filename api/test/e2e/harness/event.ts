import {
  event as eventClient,
  type Callback,
  type EventPayload,
} from "@canmingir/link-express/event/client";

type Unsubscribe = () => void | Promise<void>;

interface Subscribe {
  <T extends EventPayload = EventPayload>(type: string): Promise<T>;
  <T extends EventPayload = EventPayload>(
    type: string,
    callback: Callback<T>
  ): Promise<Unsubscribe>;
}

/**
 * Resolves with the first event of `type` the `match` predicate accepts, and
 * unsubscribes as soon as it has one. The predicate is evaluated when the
 * event arrives rather than when the wait is set up, so a scenario can wait
 * for something it cannot name yet — a task whose id only the handoff will
 * reveal — by closing over a variable it fills in later.
 */
function waitFor<T extends EventPayload = EventPayload>(
  type: string,
  match: (payload: T) => boolean = () => true
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let unsubscribe: Unsubscribe | undefined;
    let received: T | undefined;
    let claimed = false;

    const receive = async (payload: T) => {
      if (claimed || !match(payload)) return;

      claimed = true;
      received = payload;
      if (!unsubscribe) return;

      await unsubscribe();
      resolve(payload);
    };

    eventClient
      .subscribe<T>(type, (payload) => {
        void receive(payload).catch(reject);
      })
      .then(async (stop) => {
        unsubscribe = stop;
        if (received !== undefined) {
          await unsubscribe();
          resolve(received);
        }
      })
      .catch(reject);
  });
}

/**
 * The link-express client requires a callback and resolves `subscribe` with an
 * unsubscribe function. E2E scenarios also need a one-shot form that resolves
 * with the first event, so they can await milestones without hand-writing a
 * Promise and cleanup for each one.
 */
const subscribe: Subscribe = <T extends EventPayload = EventPayload>(
  type: string,
  callback?: Callback<T>
): Promise<T> | Promise<Unsubscribe> => {
  if (callback) return eventClient.subscribe(type, callback);

  return waitFor<T>(type);
};

const event = { ...eventClient, subscribe, waitFor };

export { event };
