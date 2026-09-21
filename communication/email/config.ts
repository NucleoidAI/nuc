import dotenv from "dotenv";

dotenv.config();

const DEFAULT_IMAP_PORT = 993;
const DEFAULT_SMTP_PORT = 587;
const DEFAULT_FOLDER = "INBOX";
const DEFAULT_POLL_INTERVAL_MS = 30000;
const DEFAULT_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type EmailConfig = {
  enabled: boolean;
  projectId: string;
  address: string;
  fallbackBlueprintId: string;
  pollIntervalMs: number;
  sessionTtlMs: number;
  imap: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    folder: string;
    rejectUnauthorized: boolean;
  };
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    from: string;
    rejectUnauthorized: boolean;
  };
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

function emailConfig(): EmailConfig {
  const imapUser = process.env.IMAP_USER ?? "";
  const smtpUser = process.env.SMTP_USER ?? imapUser;

  return {
    enabled: Boolean(process.env.IMAP_HOST && imapUser),
    projectId: process.env.EMAIL_PROJECT_ID ?? "",
    address: (process.env.EMAIL_ADDRESS ?? imapUser).toLowerCase(),
    fallbackBlueprintId: process.env.EMAIL_BLUEPRINT_ID ?? "",
    pollIntervalMs: readPositiveNumber({
      value: process.env.EMAIL_POLL_INTERVAL_MS,
      fallback: DEFAULT_POLL_INTERVAL_MS,
      name: "EMAIL_POLL_INTERVAL_MS",
    }),
    sessionTtlMs: readPositiveNumber({
      value: process.env.EMAIL_SESSION_TTL_MS,
      fallback: DEFAULT_SESSION_TTL_MS,
      name: "EMAIL_SESSION_TTL_MS",
    }),
    imap: {
      host: process.env.IMAP_HOST ?? "",
      port: readPositiveNumber({
        value: process.env.IMAP_PORT,
        fallback: DEFAULT_IMAP_PORT,
        name: "IMAP_PORT",
      }),
      secure: process.env.IMAP_SECURE !== "false",
      user: imapUser,
      pass: process.env.IMAP_PASS ?? "",
      folder: process.env.IMAP_FOLDER ?? DEFAULT_FOLDER,
      rejectUnauthorized: process.env.IMAP_TLS_REJECT_UNAUTHORIZED !== "false",
    },
    smtp: {
      host: process.env.SMTP_HOST ?? "",
      port: readPositiveNumber({
        value: process.env.SMTP_PORT,
        fallback: DEFAULT_SMTP_PORT,
        name: "SMTP_PORT",
      }),
      secure: process.env.SMTP_SECURE === "true",
      user: smtpUser,
      pass: process.env.SMTP_PASS ?? process.env.IMAP_PASS ?? "",
      from: process.env.SMTP_FROM ?? smtpUser,
      rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false",
    },
  };
}

export { emailConfig };
export type { EmailConfig };
