import "express";

import { publicRoutes, routes } from "./routes";
import { event } from "@canmingir/link-express/event/client";
import { logLLM } from "./lib/llmLog";
import middleware from "./middleware";
import platform from "@canmingir/link-express";
import { setLogger as setLLMLogger } from "@canmingir/link-express/llm";
import subscriptions from "./subscriptions";

declare module "express-serve-static-core" {
  interface Request {
    session: {
      userId: string;
      appId: string;
      organizationId: string;
      projectId: string;
    };
  }
}

function createApp() {
  const { express: app, publicRouter } = platform;

  setLLMLogger(logLLM);

  for (const { path, router } of publicRoutes) publicRouter.use(path, router);
  for (const { handler } of middleware) app.use(handler);
  for (const { path, router } of routes) app.use(path, router);

  setImmediate(() => {
    app.use((_req, res) => res.status(404).end());
    app.use(platform.error.handle);
  });

  (async () => {
    for (const { type, handler } of subscriptions) {
      await event.subscribe(type, handler as (payload: unknown) => unknown);
    }
  })();

  return app;
}

export default createApp();
