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
    callback: Callback<T>,
  ): Promise<Unsubscribe>;
}

function waitFor<T extends EventPayload = EventPayload>(
  type: string,
  match: (payload: T) => boolean = () => true,
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

const subscribe: Subscribe = <T extends EventPayload = EventPayload>(
  type: string,
  callback?: Callback<T>,
): Promise<T> | Promise<Unsubscribe> => {
  if (callback) return eventClient.subscribe(type, callback);

  return waitFor<T>(type);
};

const event = { ...eventClient, subscribe, waitFor };

export { event };
