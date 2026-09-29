import { ImapFlow } from "imapflow";
import { ParsedMail, simpleParser } from "mailparser";
import { createServiceToken } from "./token";
import { createSession } from "../api/createSession";
import { emailConfig, withEnvSecrets } from "./config";
import { event } from "@canmingir/link-express/event/client";
import { findSessionId, rememberSession, Thread } from "./store";
import { getMailboxes, Mailbox } from "../api/getMailboxes";
import { getBlueprint } from "../api/getBlueprint";
import { replaceMailboxes } from "./mailboxes";
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

async function openSession({
  accessToken,
  mailbox,
  thread,
  mail,
}: {
  accessToken: string;
  mailbox: Mailbox;
  thread: Thread;
  mail: InboundMail;
}): Promise<string> {
  const blueprint = await getBlueprint(accessToken, mailbox.blueprintId);

  const session = await createSession(
    accessToken,
    blueprint.agentId,
    mailbox.blueprintId,
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

function mailboxProjectId({ mailbox }: { mailbox: Mailbox }): string {
  const projectId = mailbox.projectId || emailConfig().projectId;

  if (!projectId) {
    throw new Error(
      `No project is linked to mailbox ${mailbox.config.address} and EMAIL_PROJECT_ID is not set`,
    );
  }

  return projectId;
}

async function handleInbound({
  mailbox,
  mail,
}: {
  mailbox: Mailbox;
  mail: InboundMail;
}): Promise<void> {
  const projectId = mailboxProjectId({ mailbox });
  const { address } = mailbox.config;

  const accessToken = createServiceToken({ projectId });
  const thread: Thread = {
    channelId: mailbox.id,
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
    existingSessionId ??
    (await openSession({ accessToken, mailbox, thread, mail }));

  rememberSession({ thread, sessionId });

  await sendMessageToSession(sessionId, accessToken, mail.text);

  await event.publish("EMAIL_RECEIVED", {
    sessionId,
    newSession: !existingSessionId,
    from: mail.from,
    fromName: mail.fromName,
    to: mail.recipients,
    subject: mail.subject,
    text: mail.text,
    mailbox: address,
  });
}

function isAllowedSender({
  mailbox,
  from,
}: {
  mailbox: Mailbox;
  from: string;
}): boolean {
  const { allowedSenders } = mailbox.config;

  return !allowedSenders?.length || allowedSenders.includes(from);
}

async function fetchUnseen({
  client,
  mailbox,
}: {
  client: ImapFlow;
  mailbox: Mailbox;
}): Promise<void> {
  const { address, imap } = mailbox.config;
  const lock = await client.getMailboxLock(imap.folder || "INBOX");

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
        !isAllowedSender({ mailbox, from: mail.from }) ||
        isAutomated({ parsed })
      ) {
        continue;
      }

      try {
        await handleInbound({ mailbox, mail });
      } catch (error: unknown) {
        console.error("Email inbound message failed", {
          mailbox: address,
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

async function connect({ mailbox }: { mailbox: Mailbox }): Promise<ImapFlow> {
  const { imap } = mailbox.config;

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

type Connection = { key: string; client: ImapFlow | null };

const connections = new Map<string, Connection>();

async function disconnect({ id }: { id: string }): Promise<void> {
  const connection = connections.get(id);

  connections.delete(id);

  if (connection?.client) {
    await connection.client.logout().catch(() => undefined);
  }
}

async function pollMailbox({ mailbox }: { mailbox: Mailbox }): Promise<void> {
  const key = JSON.stringify(mailbox.config.imap);
  const existing = connections.get(mailbox.id);

  if (existing && existing.key !== key) {
    await disconnect({ id: mailbox.id });
  }

  const connection = connections.get(mailbox.id) ?? { key, client: null };

  connections.set(mailbox.id, connection);

  try {
    if (!connection.client || !connection.client.usable) {
      connection.client = await connect({ mailbox });
    }

    await fetchUnseen({ client: connection.client, mailbox });
  } catch (error: unknown) {
    console.error("Email poll failed", {
      mailbox: mailbox.config.address,
      error,
    });

    await disconnect({ id: mailbox.id });
  }
}

async function loadMailboxes(): Promise<Mailbox[]> {
  const { projectId } = emailConfig();
  const accessToken = createServiceToken({ projectId });
  const list = await getMailboxes(accessToken);
  const seen = new Set<string>();

  return list.map(withEnvSecrets).filter((mailbox) => {
    const address = mailbox.config.address.toLowerCase();

    if (seen.has(address)) {
      return false;
    }

    seen.add(address);

    return true;
  });
}

async function setup(): Promise<void> {
  const { pollIntervalMs } = emailConfig();

  const poll = async (): Promise<void> => {
    try {
      const mailboxes = await loadMailboxes();

      replaceMailboxes({ list: mailboxes });

      const activeIds = new Set(mailboxes.map((mailbox) => mailbox.id));

      await Promise.all(
        [...connections.keys()]
          .filter((id) => !activeIds.has(id))
          .map((id) => disconnect({ id })),
      );

      await Promise.all(
        mailboxes.map((mailbox) => pollMailbox({ mailbox })),
      );
    } catch (error: unknown) {
      console.error("Email mailbox refresh failed", error);
    } finally {
      setTimeout(poll, pollIntervalMs);
    }
  };

  console.log(`📬 Email channel polling configured mailboxes every ${pollIntervalMs}ms`);

  await poll();
}

export default { setup };
export { stripQuotedText, toInboundMail };
export type { InboundMail };
