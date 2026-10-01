import { TypeSafeClient } from "@typesafe-ai/sdk";

import { createSystemOneCompatibleAdapter } from "./systemOneCompatible";
import type { DecisionAdapter } from "./types";

export default createSystemOneCompatibleAdapter({
  providerLabel: "typesafe",
  createClient: () =>
    new TypeSafeClient({
      timeout: Number(process.env.TYPESAFE_TIMEOUT_MS) || 30000,
    }),
}) satisfies DecisionAdapter;
