//AI-generated
import dotenv from "dotenv";

dotenv.config();

const DEFAULT_GRAPH_URL = "https://graph.facebook.com";
const DEFAULT_API_VERSION = "v21.0";
const DEFAULT_SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_TIMEOUT_MS = 10000;

type WhatsappConfig = {
  verifyToken: string;
  accessToken: string;
  graphUrl: string;
  apiVersion: string;
  fallbackBlueprintId: string;
  sessionTtlMs: number;
  timeoutMs: number;
};

function readPositiveNumber({
  value,
  fallback,
  name,
}: {
  value: string | undefined;
  fallback: number;
  name: string;
}): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive number, got "${value}"`);
  }

  return parsed;
}

function whatsappConfig(): WhatsappConfig {
  return {
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN ?? "",
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN ?? "",
    graphUrl: (process.env.WHATSAPP_GRAPH_URL ?? DEFAULT_GRAPH_URL).replace(
      /\/+$/,
      "",
    ),
    apiVersion: process.env.WHATSAPP_API_VERSION ?? DEFAULT_API_VERSION,
    fallbackBlueprintId: process.env.WHATSAPP_BLUEPRINT_ID ?? "",
    sessionTtlMs: readPositiveNumber({
      value: process.env.WHATSAPP_SESSION_TTL_MS,
      fallback: DEFAULT_SESSION_TTL_MS,
      name: "WHATSAPP_SESSION_TTL_MS",
    }),
    timeoutMs: readPositiveNumber({
      value: process.env.WHATSAPP_TIMEOUT_MS,
      fallback: DEFAULT_TIMEOUT_MS,
      name: "WHATSAPP_TIMEOUT_MS",
    }),
  };
}

export { whatsappConfig };
export type { WhatsappConfig };
