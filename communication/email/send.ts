import nodemailer, { Transporter } from "nodemailer";
import { emailConfig } from "./config";

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) {
    return transporter;
  }

  const { smtp } = emailConfig();

  if (!smtp.host) {
    throw new Error("SMTP_HOST environment variable is required");
  }

  if (!smtp.from) {
    throw new Error("SMTP_FROM (or SMTP_USER) environment variable is required");
  }

  transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    ...(smtp.user ? { auth: { user: smtp.user, pass: smtp.pass } } : {}),
    tls: { rejectUnauthorized: smtp.rejectUnauthorized },
  });

  return transporter;
}

function replySubject({ subject }: { subject: string }): string {
  const clean = subject.trim() || "(no subject)";

  return /^re:/i.test(clean) ? clean : `Re: ${clean}`;
}

async function sendReply({
  to,
  subject,
  body,
  inReplyTo,
  references,
}: {
  to: string;
  subject: string;
  body: string;
  inReplyTo: string;
  references: string[];
}): Promise<string> {
  const { smtp } = emailConfig();

  const info = await getTransporter().sendMail({
    from: smtp.from,
    to,
    subject: replySubject({ subject }),
    text: body,
    ...(inReplyTo ? { inReplyTo } : {}),
    ...(references.length > 0 ? { references } : {}),
  });

  return info.messageId ?? "";
}

export { sendReply };
