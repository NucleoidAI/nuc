import { Tool } from "../../gdrive/tools/types";
import logger from "../../../logger/logger.js";
import nodemailer from "nodemailer";

type MeetingSummaryData = {
  meetingName?: string;
  meetingDate?: string;
  summary?: string;
  key_topics?: string[];
  decisions?: string[];
  action_items?: { owner_id?: string; owner?: string; task: string }[];
  speaker_highlights?: { id: string; summary: string }[];
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const AVATAR_COLORS = ["#6366f1", "#0ea5e9", "#f59e0b", "#10b981", "#ec4899", "#8b5cf6"];

function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function initial(name: string): string {
  return escapeHtml(name.trim().charAt(0).toUpperCase() || "?");
}

function sectionHeader(emoji: string, title: string): string {
  return `<h2 style="margin:0 0 14px;font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#0f172a;"><span style="margin-right:8px;">${emoji}</span>${title}</h2>`;
}

function renderChecklistSection(emoji: string, title: string, items: string[]): string {
  if (!items.length) return "";
  const rows = items
    .map(
      (item) => `
        <tr>
          <td width="22" valign="top" style="padding:0 8px 10px 0;color:#10b981;font-size:14px;">✔️</td>
          <td valign="top" style="padding:0 0 10px;color:#334155;font-size:14px;line-height:1.5;">${escapeHtml(item)}</td>
        </tr>`,
    )
    .join("");
  return `
    <tr>
      <td style="padding:0 32px 26px;">
        ${sectionHeader(emoji, title)}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
      </td>
    </tr>`;
}

function renderTopicsSection(items: string[]): string {
  if (!items.length) return "";
  const pills = items
    .map(
      (item) =>
        `<span style="display:inline-block;background:#eef2ff;color:#4338ca;padding:6px 14px;border-radius:999px;font-size:13px;font-weight:600;margin:0 8px 8px 0;">${escapeHtml(item)}</span>`,
    )
    .join("");
  return `
    <tr>
      <td style="padding:0 32px 26px;">
        ${sectionHeader("🏷️", "Konular")}
        <div>${pills}</div>
      </td>
    </tr>`;
}

function renderActionItemsSection(
  items: { owner: string; task: string }[],
): string {
  if (!items.length) return "";
  const rows = items
    .map(({ owner, task }) => {
      const color = avatarColor(owner);
      return `
        <tr>
          <td style="padding:0 0 12px;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td width="30" valign="top" style="padding-right:10px;">
                  <div style="width:26px;height:26px;line-height:26px;border-radius:50%;background:${color};color:#ffffff;font-size:12px;font-weight:700;text-align:center;">${initial(owner)}</div>
                </td>
                <td valign="top" style="color:#334155;font-size:14px;line-height:1.5;">
                  <span style="font-weight:700;color:#0f172a;">${escapeHtml(owner)}</span> — ${escapeHtml(task)}
                </td>
              </tr>
            </table>
          </td>
        </tr>`;
    })
    .join("");
  return `
    <tr>
      <td style="padding:0 32px 26px;">
        ${sectionHeader("📌", "Aksiyon Maddeleri")}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
      </td>
    </tr>`;
}

function renderSpeakerHighlightsSection(
  items: { id: string; summary: string }[],
): string {
  if (!items.length) return "";
  const rows = items
    .map(({ id, summary }) => {
      const color = avatarColor(id);
      return `
        <tr>
          <td style="padding:0 0 14px;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td width="34" valign="top" style="padding-right:10px;">
                  <div style="width:30px;height:30px;line-height:30px;border-radius:50%;background:${color};color:#ffffff;font-size:13px;font-weight:700;text-align:center;">${initial(id)}</div>
                </td>
                <td valign="top">
                  <div style="font-weight:700;color:#0f172a;font-size:13px;margin-bottom:2px;">${escapeHtml(id)}</div>
                  <div style="color:#64748b;font-size:13px;line-height:1.5;">${escapeHtml(summary)}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>`;
    })
    .join("");
  return `
    <tr>
      <td style="padding:0 32px 8px;">
        ${sectionHeader("🗣️", "Konuşmacı Özetleri")}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
      </td>
    </tr>`;
}

export function renderMeetingSummary(data: MeetingSummaryData): {
  subject: string;
  text: string;
  html: string;
} {
  const title = data.meetingName
    ? `${data.meetingName} - Toplantı Özeti`
    : "Toplantı Özeti";
  const subject = data.meetingDate ? `${title} (${data.meetingDate})` : title;

  const keyTopics = data.key_topics ?? [];
  const decisions = data.decisions ?? [];
  const actionItems = (data.action_items ?? []).map((item) => ({
    owner: item.owner ?? item.owner_id ?? "-",
    task: item.task,
  }));
  const speakerHighlights = data.speaker_highlights ?? [];

  const actionItemLines = actionItems.map(
    (item) => `${item.owner}: ${item.task}`,
  );
  const speakerHighlightLines = speakerHighlights.map(
    (item) => `${item.id}: ${item.summary}`,
  );

  const text = [
    subject,
    "",
    data.summary ?? "",
    keyTopics.length ? "\nKonular:\n- " + keyTopics.join("\n- ") : "",
    decisions.length ? "\nKararlar:\n- " + decisions.join("\n- ") : "",
    actionItemLines.length
      ? "\nAksiyon Maddeleri:\n- " + actionItemLines.join("\n- ")
      : "",
    speakerHighlightLines.length
      ? "\nKonuşmacı Özetleri:\n- " + speakerHighlightLines.join("\n- ")
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
<div style="background:#eef1f6;padding:40px 16px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5,#0ea5e9);padding:28px 32px;">
              <div style="font-size:26px;line-height:1;margin-bottom:10px;">🗓️</div>
              <h1 style="margin:0;font-size:21px;color:#ffffff;">${escapeHtml(title)}</h1>
              ${
                data.meetingDate
                  ? `<p style="margin:6px 0 0;color:#e0e7ff;font-size:13px;">${escapeHtml(data.meetingDate)}</p>`
                  : ""
              }
            </td>
          </tr>
          ${
            data.summary
              ? `<tr>
            <td style="padding:24px 32px 0;">
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 18px;">
                ${sectionHeader("📝", "Özet")}
                <p style="margin:0;color:#334155;line-height:1.6;font-size:14px;">${escapeHtml(data.summary)}</p>
              </div>
            </td>
          </tr>
          <tr><td style="height:26px;"></td></tr>`
              : ""
          }
          ${renderTopicsSection(keyTopics)}
          ${renderChecklistSection("✅", "Kararlar", decisions)}
          ${renderActionItemsSection(actionItems)}
          ${renderSpeakerHighlightsSection(speakerHighlights)}
          <tr>
            <td style="padding:18px 32px 24px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">🤖 Bu özet otomatik olarak oluşturulmuştur.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</div>`;

  return { subject, text, html };
}

const TEMPLATES: Record<
  string,
  (data: MeetingSummaryData) => { subject: string; text: string; html: string }
> = {
  meeting_summary: renderMeetingSummary,
};

export const sendEmailTool: Tool<any> = {
  name: "GREY:send_email",
  description:
    "Send an email. Requires SMTP configuration via environment variables. Pass 'template' + 'data' to render a predefined, nicely formatted HTML email instead of composing 'text'/'html' manually.",
  inputSchema: {
    type: "object",
    properties: {
      to: {
        type: "string",
        description: "Recipient email address",
      },
      subject: {
        type: "string",
        description: "Email subject. Required unless 'template' is set (the template supplies its own subject).",
      },
      text: {
        type: "string",
        description: "Plain text email body. Required unless 'template' is set (the template supplies its own text body).",
      },
      html: {
        type: "string",
        description: "HTML email body (optional, overridden when 'template' is set)",
      },
      template: {
        type: "string",
        description: `Name of a predefined email template to render instead of manually composing text/html. Available: ${Object.keys(
          TEMPLATES,
        ).join(", ")}`,
      },
      data: {
        type: "object",
        description: "Structured data to render into the template named by 'template'.",
      },
    },
    required: ["to"],
  },
  handler: async (args: any) => {
    logger.info(
      { tool: "GREY:send_email", to: args.to, subject: args.subject, template: args.template },
      "Email send attempt initiated",
    );

    let subject = args.subject;
    let text = args.text;
    let html = args.html;

    if (args.template) {
      const render = TEMPLATES[args.template];
      if (!render) {
        const errorMessage = `Unknown template "${args.template}". Available templates: ${Object.keys(
          TEMPLATES,
        ).join(", ")}`;
        logger.error({ tool: "GREY:send_email", template: args.template }, errorMessage);
        return {
          content: [{ type: "text", text: JSON.stringify({ error: errorMessage }) }],
          isError: true,
        };
      }

      const rendered = render(args.data ?? {});
      subject = rendered.subject;
      text = rendered.text;
      html = rendered.html;
    }

    try {
      logger.debug("Creating nodemailer transporter");

      const host = process.env.SMTP_HOST;
      const port = Number(process.env.SMTP_PORT ?? 587);
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;
      const from = process.env.SMTP_FROM ?? user;

      if (!host) throw new Error("SMTP_HOST is not set");
      if (!from) throw new Error("SMTP_FROM (or SMTP_USER) is not set");

      const secure = process.env.SMTP_SECURE
        ? process.env.SMTP_SECURE === "true"
        : port === 465;
      const ignoreTLS = process.env.SMTP_IGNORE_TLS === "true";
      const requireTLS = !secure && !ignoreTLS &&
        process.env.SMTP_REQUIRE_TLS !== "false";

      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        requireTLS,
        ignoreTLS,
        auth: user && pass ? { user, pass } : undefined,
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 20_000,
        tls: {
          servername: process.env.SMTP_TLS_SERVERNAME || undefined,
          rejectUnauthorized:
            process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false",
        },
      });

      logger.debug("Sending email via SMTP");

      const info = await transporter.sendMail({
        from,
        to: args.to,
        subject,
        text,
        html,
      });

      logger.info(
        { tool: "GREY:send_email", action: "send", to: args.to, subject, messageId: info.messageId },
        "Email sent successfully",
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              messageId: info.messageId,
              to: args.to,
              subject,
            }),
          },
        ],
        isError: false,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      logger.error(
        {
          tool: "GREY:send_email",
          action: "send",
          err: error instanceof Error ? error : new Error(errorMessage),
          to: args.to,
          subject,
        },
        "Email send failed",
      );

      console.error(error);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: errorMessage,
              hint: "Make sure SMTP environment variables are set: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM (optional)",
            }),
          },
        ],
        isError: true,
      };
    }
  },
};
