import * as client from "prom-client";

import type {
  Callback,
  EventPayload,
  InitOptions,
} from "@canmingir/link-express/event/client";

type Unsubscribe = () => Promise<void>;

const subscribers = new Map<string, Set<Callback<never>>>();

const logging = process.env.E2E_EVENT_LOG !== "off";

function log(action: string, topic: string, payload?: EventPayload) {
  if (!logging) return;

  console.log(`[Event] ${action}:`, topic, payload || "");
}

function deliver(type: string, payload: EventPayload) {
  const callbacks = subscribers.get(type);

  if (!callbacks) return;

  for (const callback of [...callbacks]) {
    setTimeout(() => {
      try {
        void Promise.resolve(
          (callback as Callback<EventPayload>)(payload)
        ).catch((error) => {
          console.error(`Error executing callback for ${type}:`, error);
        });
      } catch (error) {
        console.error(`Error executing callback for ${type}:`, error);
      }
    }, 0);
  }
}

async function publish<T extends EventPayload = EventPayload>(
  ...args: [...string[], T]
): Promise<void> {
  if (args.length < 2) {
    throw new Error("publish requires at least one event type and a payload");
  }

  const payload = args[args.length - 1] as T;
  const type = (args.slice(0, -1) as string[]).join("_");

  log("publish", type, payload);
  deliver(type, payload);
}

async function subscribe<T extends EventPayload = EventPayload>(
  type: string,
  callback: Callback<T>
): Promise<Unsubscribe> {
  log("subscribe", type);

  let callbacks = subscribers.get(type);

  if (!callbacks) {
    callbacks = new Set();
    subscribers.set(type, callbacks);
  }

  callbacks.add(callback as Callback<never>);

  return async () => {
    callbacks.delete(callback as Callback<never>);

    if (!callbacks.size) subscribers.delete(type);
  };
}

const event = {
  init: async (options?: InitOptions) => {
    if (options && options.type !== "inMemory") {
      throw new Error(
        `The e2e event bus replaces the socket transport, but the stack asked for "${options.type}".`
      );
    }

    subscribers.clear();
  },
  publish,
  subscribe,
  disconnect: async () => {
    subscribers.clear();
  },
  checkBacklog: async () => {},
  startPushgateway: () => {},
  stopPushgateway: () => {},
  pushMetricsToGateway: async () => {},
  getPushgatewayConfig: () => undefined,
};

export { client, event };
export type { Callback, EventPayload, InitOptions };
