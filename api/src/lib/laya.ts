import { TypeSafeClient } from "@typesafe-ai/sdk";

import { createSystemOneCompatibleAdapter } from "./systemOneCompatible";
import type { DecisionAdapter } from "./types";

export default createSystemOneCompatibleAdapter({
  providerLabel: "laya",
  createClient: () =>
    new TypeSafeClient({
      apiKey: process.env.LAYA_API_KEY || "local",
      baseURL: process.env.LAYA_URL || "http://127.0.0.1:8000",
      timeout: Number(process.env.LAYA_TIMEOUT_MS) || 30000,
    }),
}) satisfies DecisionAdapter;
