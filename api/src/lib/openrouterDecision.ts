import { TypeSafeClient } from "@typesafe-ai/sdk";

import { createSystemOneCompatibleAdapter } from "./systemOneCompatible";
import type { DecisionAdapter } from "./types";

export default createSystemOneCompatibleAdapter({
  providerLabel: "openrouter",
  createClient: () =>
    new TypeSafeClient({
      apiKey:
        process.env.OPENROUTER_DECISION_API_KEY ||
        process.env.OPENROUTER_API_KEY,
      baseURL:
        process.env.OPENROUTER_DECISION_URL || "https://openrouter.ai/api",
      defaultModel: "~typesafe/jev-latest",
      timeout: Number(process.env.OPENROUTER_DECISION_TIMEOUT_MS) || 30000,
      defaultHeaders: {
        "X-Title": "GreyCollar",
      },
    }),
}) satisfies DecisionAdapter;
