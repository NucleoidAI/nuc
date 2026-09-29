import http from "../http";

type MailServer = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  rejectUnauthorized: boolean;
};

type Mailbox = {
  id: string;
  channelCode: string;
  blueprintId: string;
  projectId: string | null;
  config: {
    address: string;
    allowedSenders: string[];
    imap: MailServer & { folder: string };
    smtp: MailServer & { from: string };
  };
};

const getMailboxes = async (accessToken: string) => {
  const { data } = await http.get("/communications/mailboxes", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return data as Mailbox[];
};

export { getMailboxes };
export type { Mailbox, MailServer };
