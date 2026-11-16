import type { RequestHandler } from "express";
import platform from "@canmingir/link-express";
import { telemetryMiddleware } from "./instrumentation";

type Middleware = { name: string; handler: RequestHandler };

const middleware: Middleware[] = [
  { name: "nuc-telemetry", handler: telemetryMiddleware() },
  {
    name: "nuc-authorize",
    handler: platform.authorization.authorize("ADMIN"),
  },
];

export type { Middleware };
export default middleware;
