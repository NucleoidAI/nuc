import {
  event as eventClient,
  type Callback,
  type EventPayload,
} from "@canmingir/link-express/event/client";

import type { EventName, Payload } from "./types";

type Unsubscribe = () => void | Promise<void>;

type Match<N extends EventName> = (payload: Payload<N>) => boolean;

const listening = new Set<Unsubscribe>();

function publish<N extends EventName>(type: N, payload: Payload<N>) {
  return eventClient.publish(type, payload as EventPayload);
}

async function on<N extends EventName>(
  type: N,
  callback: (payload: Payload<N>) => unknown
): Promise<Unsubscribe> {
  const stop = await eventClient.subscribe(
    type,
    callback as Callback<EventPayload>
  );

  const release = async () => {
    listening.delete(release);
    await stop();
  };

  listening.add(release);

  return release;
}

function waitFor<N extends EventName>(
  type: N,
  match: Match<N> = () => true
): Promise<Payload<N>> {
  return new Promise<Payload<N>>((resolve, reject) => {
    let release: Unsubscribe | undefined;
    let received: Payload<N> | undefined;
    let claimed = false;

    const receive = async (payload: Payload<N>) => {
      if (claimed || !match(payload)) return;

      claimed = true;
      received = payload;
      if (!release) return;

      await release();
      resolve(payload);
    };

    on<N>(type, (payload) => {
      void receive(payload).catch(reject);
    })
      .then(async (stop) => {
        release = stop;
        if (received !== undefined) {
          await release();
          resolve(received);
        }
      })
      .catch(reject);
  });
}

async function releaseAll() {
  await Promise.all([...listening].map((release) => release()));
  listening.clear();
}

export { on, publish, releaseAll, waitFor };
export type { Match, Unsubscribe };
