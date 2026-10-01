import nodemailer, { Transporter } from "nodemailer";
import { Mailbox } from "../api/getMailboxes";

const transporters = new Map<string, { key: string; transporter: Transporter }>();

function getTransporter({ mailbox }: { mailbox: Mailbox }): Transporter {
  const { smtp } = mailbox.config;
  const key = JSON.stringify(smtp);
  const cached = transporters.get(mailbox.id);

  if (cached && cached.key === key) {
    return cached.transporter;
  }

  cached?.transporter.close();

  if (!smtp.host) {
    throw new Error(`SMTP host is not configured for ${mailbox.config.address}`);
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    ...(smtp.user ? { auth: { user: smtp.user, pass: smtp.pass } } : {}),
    tls: { rejectUnauthorized: smtp.rejectUnauthorized },
  });

  transporters.set(mailbox.id, { key, transporter });

  return transporter;
}

function replySubject({ subject }: { subject: string }): string {
  const clean = subject.trim() || "(no subject)";

  return /^re:/i.test(clean) ? clean : `Re: ${clean}`;
}

async function sendReply({
  mailbox,
  to,
  subject,
  body,
  inReplyTo,
  references,
}: {
  mailbox: Mailbox;
  to: string;
  subject: string;
  body: string;
  inReplyTo: string;
  references: string[];
}): Promise<string> {
  const { smtp, address } = mailbox.config;

  const info = await getTransporter({ mailbox }).sendMail({
    from: smtp.from || address,
    to,
    subject: replySubject({ subject }),
    text: body,
    ...(inReplyTo ? { inReplyTo } : {}),
    ...(references.length > 0 ? { references } : {}),
  });

  return info.messageId ?? "";
}

export { sendReply };
