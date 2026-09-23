import { ImapFlow } from "imapflow";
import { ParsedMail, simpleParser } from "mailparser";
import { createServiceToken } from "./token";
import { createSession } from "../api/createSession";
import { emailConfig } from "./config";
import { findSessionId, rememberSession, Thread } from "./store";
import { getBlueprint } from "../api/getBlueprint";
import { getCommunications } from "../api/getCommunications";
import { sendMessageToSession } from "../api/sendMessageSession";

type InboundMail = {
  from: string;
  fromName: string;
  recipients: string[];
  subject: string;
  text: string;
  messageId: string;
  references: string[];
  threadId: string;
};

const QUOTE_MARKERS = [
  /^-{2,}\s*original message\s*-{2,}/im,
  /^_{5,}$/m,
  /^on .+ wrote:$/im,
  /^\s*>{1,}/m,
];

function stripQuotedText({ text }: { text: string }): string {
  let cut = text.length;

  QUOTE_MARKERS.forEach((marker) => {
    const match = marker.exec(text);

    if (match && match.index < cut) {
      cut = match.index;
    }
  });

  const stripped = text.slice(0, cut).trim();

  return stripped || text.trim();
}

function addressList({
  value,
}: {
  value: ParsedMail["to"];
}): { address: string; name: string }[] {
  const groups = Array.isArray(value) ? value : value ? [value] : [];

  return groups.flatMap((group) =>
    (group.value ?? []).map((entry) => ({
      address: (entry.address ?? "").toLowerCase(),
      name: entry.name ?? "",
    })),
  );
}

function normalizeId({ value }: { value: string }): string {
  return value.trim().replace(/^<|>$/g, "");
}

function toInboundMail({ parsed }: { parsed: ParsedMail }): InboundMail | null {
  const sender = addressList({ value: parsed.from })[0];
  const text = stripQuotedText({ text: parsed.text ?? "" });

  if (!sender?.address || !text) {
    return null;
  }

  const messageId = normalizeId({ value: parsed.messageId ?? "" });
  const references = (
    Array.isArray(parsed.references)
      ? parsed.references
      : parsed.references
        ? [parsed.references]
        : []
  ).map((value) => normalizeId({ value }));
  const inReplyTo = normalizeId({ value: parsed.inReplyTo ?? "" });

  return {
    from: sender.address,
    fromName: sender.name,
    recipients: [
      ...addressList({ value: parsed.to }),
      ...addressList({ value: parsed.cc }),
    ]
      .map((entry) => entry.address)
      .filter(Boolean),
    subject: parsed.subject ?? "",
    text,
    messageId,
    references,
    threadId: references[0] || inReplyTo || messageId,
  };
}

function isAutomated({ parsed }: { parsed: ParsedMail }): boolean {
  const headers = parsed.headers;
  const autoSubmitted = String(headers.get("auto-submitted") ?? "");
  const precedence = String(headers.get("precedence") ?? "").toLowerCase();

  return (
    (autoSubmitted && autoSubmitted.toLowerCase() !== "no") ||
    ["bulk", "junk", "list"].includes(precedence) ||
    headers.has("list-unsubscribe")
  );
}

async function resolveBlueprintId({
  accessToken,
  mail,
}: {
  accessToken: string;
  mail: InboundMail;
}): Promise<string> {
  const { address, fallbackBlueprintId } = emailConfig();
  const codes = [...mail.recipients, address];
  const communications = await getCommunications(accessToken);

  const match = communications.find(
    (communication) =>
      communication.channelType === "EMAIL" &&
      codes.includes(communication.channelCode.trim().toLowerCase()),
  );

  if (match) {
    return match.blueprintId;
  }

  if (!fallbackBlueprintId) {
    throw new Error(
      `No EMAIL communication is registered for "${mail.recipients.join(", ")}"`,
    );
  }

  return fallbackBlueprintId;
}

async function openSession({
  accessToken,
  thread,
  mail,
}: {
  accessToken: string;
  thread: Thread;
  mail: InboundMail;
}): Promise<string> {
  const blueprintId = await resolveBlueprintId({ accessToken, mail });
  const blueprint = await getBlueprint(accessToken, blueprintId);

  const session = await createSession(
    accessToken,
    blueprint.agentId,
    blueprintId,
    {
      channel: "EMAIL",
      from: mail.from,
      name: mail.fromName,
      subject: mail.subject,
      mailbox: thread.mailbox,
    },
  );

  rememberSession({ thread, sessionId: session.id });

  return session.id;
}

async function handleInbound({ mail }: { mail: InboundMail }): Promise<void> {
  const { projectId, address } = emailConfig();

  if (!projectId) {
    throw new Error("EMAIL_PROJECT_ID environment variable is required");
  }

  const accessToken = createServiceToken({ projectId });
  const thread: Thread = {
    projectId,
    mailbox: address,
    threadId: mail.threadId,
    from: mail.from,
    fromName: mail.fromName,
    subject: mail.subject,
    lastMessageId: mail.messageId,
    references: [...mail.references, mail.messageId].filter(Boolean),
  };

  const existingSessionId = findSessionId({ thread });

  const sessionId =
    existingSessionId ?? (await openSession({ accessToken, thread, mail }));

  rememberSession({ thread, sessionId });

  await sendMessageToSession(sessionId, accessToken, mail.text);
}

async function fetchUnseen({ client }: { client: ImapFlow }): Promise<void> {
  const { address, allowedSenders } = emailConfig();
  const lock = await client.getMailboxLock(emailConfig().imap.folder);

  try {
    const uids = await client.search({ seen: false }, { uid: true });

    if (!uids || !uids.length) {
      return;
    }

    const messages = await client.fetchAll(
      uids,
      { source: true, uid: true },
      { uid: true },
    );

    for (const message of messages) {
      const parsed = await simpleParser(message.source);
      const mail = toInboundMail({ parsed });

      await client.messageFlagsAdd(String(message.uid), ["\\Seen"], {
        uid: true,
      });

      if (
        !mail ||
        mail.from === address ||
        !allowedSenders.includes(mail.from) ||
        isAutomated({ parsed })
      ) {
        continue;
      }

      try {
        await handleInbound({ mail });
      } catch (error: unknown) {
        console.error("Email inbound message failed", {
          from: mail.from,
          subject: mail.subject,
          error,
        });
      }
    }
  } finally {
    lock.release();
  }
}

async function connect(): Promise<ImapFlow> {
  const { imap } = emailConfig();

  const client = new ImapFlow({
    host: imap.host,
    port: imap.port,
    secure: imap.secure,
    auth: { user: imap.user, pass: imap.pass },
    tls: { rejectUnauthorized: imap.rejectUnauthorized },
    logger: false,
  });

  await client.connect();

  return client;
}

async function setup(): Promise<void> {
  const { enabled, pollIntervalMs, imap } = emailConfig();

  if (!enabled) {
    console.log("📭 Email channel disabled (IMAP_HOST or IMAP_USER missing)");
    return;
  }

  let client: ImapFlow | null = null;

  const poll = async (): Promise<void> => {
    try {
      if (!client || !client.usable) {
        client = await connect();
      }

      await fetchUnseen({ client });
    } catch (error: unknown) {
      console.error("Email poll failed", error);

      if (client) {
        await client.logout().catch(() => undefined);
        client = null;
      }
    } finally {
      setTimeout(poll, pollIntervalMs);
    }
  };

  console.log(`📬 Email channel polling ${imap.user} every ${pollIntervalMs}ms`);

  await poll();
}

export default { setup };
export { stripQuotedText, toInboundMail };
export type { InboundMail };
