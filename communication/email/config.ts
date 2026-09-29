import dotenv from "dotenv";
import { Mailbox } from "../api/getMailboxes";

dotenv.config();

const DEFAULT_POLL_INTERVAL_MS = 30000;
const DEFAULT_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type EmailConfig = {
  projectId: string;
  pollIntervalMs: number;
  sessionTtlMs: number;
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
  return {
    projectId: process.env.EMAIL_PROJECT_ID ?? "",
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
  };
}

function envPassword({
  user,
  envUser,
  envPass,
}: {
  user: string;
  envUser: string | undefined;
  envPass: string | undefined;
}): string {
  return envUser && envPass && user.toLowerCase() === envUser.toLowerCase()
    ? envPass
    : "";
}

function withEnvSecrets(mailbox: Mailbox): Mailbox {
  const { imap, smtp } = mailbox.config;
  const imapUser = process.env.IMAP_USER;
  const smtpUser = process.env.SMTP_USER ?? imapUser;

  return {
    ...mailbox,
    config: {
      ...mailbox.config,
      imap: {
        ...imap,
        pass:
          imap.pass ||
          envPassword({
            user: imap.user,
            envUser: imapUser,
            envPass: process.env.IMAP_PASS,
          }),
      },
      smtp: {
        ...smtp,
        pass:
          smtp.pass ||
          envPassword({
            user: smtp.user,
            envUser: smtpUser,
            envPass: process.env.SMTP_PASS ?? process.env.IMAP_PASS,
          }),
      },
    },
  };
}

export { emailConfig, withEnvSecrets };
export type { EmailConfig };
