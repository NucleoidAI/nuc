import { Mailbox } from "../api/getMailboxes";

const mailboxes = new Map<string, Mailbox>();

function replaceMailboxes({ list }: { list: Mailbox[] }): void {
  mailboxes.clear();
  list.forEach((mailbox) => mailboxes.set(mailbox.id, mailbox));
}

function findMailbox({ id }: { id: string }): Mailbox | null {
  return mailboxes.get(id) ?? null;
}

export { findMailbox, replaceMailboxes };
