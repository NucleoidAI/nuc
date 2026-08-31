import { forget, history, onReset, subscribe } from "./event";

import type { Callback, EventPayload, Unsubscribe } from "./event";
import type { EventName, Payload } from "./types";

type Match<N extends EventName> = (payload: Payload<N>) => boolean;

const listening = new Set<Unsubscribe>();

onReset(() => listening.clear());

async function on<N extends EventName>(
  type: N,
  callback: (payload: Payload<N>) => unknown
): Promise<Unsubscribe> {
  const stop = await subscribe(type, callback as Callback<EventPayload>);

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
  const seen = history.find(
    (entry) => entry.type === type && match(entry.payload as Payload<N>)
  );

  if (seen) return Promise.resolve(seen.payload as Payload<N>);

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
  forget();
}

export { on, releaseAll, waitFor };
export type { Match };
