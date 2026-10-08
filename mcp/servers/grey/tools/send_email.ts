import { Tool } from "../../gdrive/tools/types";
import fs from "fs";
import logger from "../../../logger/logger.js";
import nodemailer from "nodemailer";

export type EmailAttachment = {
  filename: string;
  path?: string;
  content?: string;
  contentType?: string;
};

type MeetingHighlight = {
  topic: string;
  highlights: string[];
};

export function buildAttachments(input: unknown): {
  attachments: EmailAttachment[];
  missing: string[];
} {
  if (!Array.isArray(input)) return { attachments: [], missing: [] };

  const attachments: EmailAttachment[] = [];
  const missing: string[] = [];

  for (const item of input as EmailAttachment[]) {
    if (!item?.filename) continue;

    if (item.path) {
      if (!fs.existsSync(item.path)) {
        missing.push(item.path);
        continue;
      }
      attachments.push({
        filename: item.filename,
        path: item.path,
        contentType: item.contentType,
      });
    } else if (item.content !== undefined) {
      attachments.push({
        filename: item.filename,
        content: item.content,
        contentType: item.contentType,
      });
    }
  }

  return { attachments, missing };
}

type MeetingSummaryData = {
  meetingName?: string;
  meetingDate?: string;
  attendees?: string[];
  summary?: string;
  highlights?: MeetingHighlight[];
  /** Variant B only - variant A has no next steps. */
  next_steps?: string[];
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sectionHeader(title: string): string {
  return `<h2 style="margin:0 0 14px;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#1e293b;padding-left:10px;border-left:3px solid #1e293b;">${title}</h2>`;
}

function renderAttendeesSection(attendees?: string[]): string {
  const names = attendees?.map((name) => name?.trim()).filter(Boolean);
  if (!names?.length) return "";
  const chips = names
    .map(
      (name) =>
        `<span style="display:inline-block;margin:0 6px 6px 0;padding:4px 10px;border-radius:999px;background:#f1f5f9;border:1px solid #e2e8f0;color:#334155;font-size:13px;line-height:1.4;">${escapeHtml(name)}</span>`,
    )
    .join("");
  return `
    <tr>
      <td style="padding:24px 32px 0;">
        ${sectionHeader("Katılımcılar")}
        <div>${chips}</div>
      </td>
    </tr>`;
}

function renderSummarySection(summary?: string): string {
  if (!summary?.trim()) return "";
  return `
    <tr>
      <td style="padding:24px 32px 0;">
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 18px;">
          ${sectionHeader("Özet")}
          <p style="margin:0;color:#334155;line-height:1.6;font-size:14px;">${escapeHtml(summary.trim())}</p>
        </div>
      </td>
    </tr>
    <tr><td style="height:26px;"></td></tr>`;
}

/** Highlights are grouped under their meeting topic. */
function renderHighlightsSection(
  items?: MeetingHighlight[],
  accent = "#334155",
): string {
  if (!items?.length) return "";
  const topics = items
    .map(
      ({ topic, highlights }) => `
        <tr>
          <td style="padding:0 0 18px;">
            <div style="background:#f8fafc;border-left:3px solid ${accent};border-radius:0 6px 6px 0;padding:14px 16px;">
              <h3 style="margin:0 0 10px;color:#1e293b;font-size:15px;line-height:1.4;">${escapeHtml(topic)}</h3>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${highlights
                  .map(
                    (highlight) => `
                    <tr>
                      <td width="18" valign="top" style="padding:0 6px 7px 0;color:${accent};font-size:14px;font-weight:700;">&#8226;</td>
                      <td valign="top" style="padding:0 0 7px;color:#334155;font-size:14px;line-height:1.5;">${escapeHtml(highlight)}</td>
                    </tr>`,
                  )
                  .join("")}
              </table>
            </div>
          </td>
        </tr>`,
    )
    .join("");
  return `
    <tr>
      <td style="padding:0 32px 26px;">
        ${sectionHeader("Konular ve Öne Çıkanlar")}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${topics}</table>
      </td>
    </tr>`;
}

function renderNextStepsSection(items?: string[]): string {
  if (!items?.length) return "";
  const rows = items
    .map(
      (item, index) => `
        <tr>
          <td width="28" valign="top" style="padding:0 10px 12px 0;">
            <div style="width:22px;height:22px;line-height:22px;border-radius:50%;background:#0f172a;color:#ffffff;font-size:11px;font-weight:700;text-align:center;">${index + 1}</div>
          </td>
          <td valign="top" style="padding:0 0 12px;color:#334155;font-size:14px;line-height:1.5;">${escapeHtml(item)}</td>
        </tr>`,
    )
    .join("");
  return `
    <tr>
      <td style="padding:0 32px 26px;">
        ${sectionHeader("Sonraki Adımlar")}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
      </td>
    </tr>`;
}

function textBlock(title: string, items?: string[]): string {
  if (!items?.length) return "";
  return `\n${title}:\n- ${items.join("\n- ")}`;
}

function textHighlightsBlock(items?: MeetingHighlight[]): string {
  if (!items?.length) return "";
  const topics = items
    .map(
      ({ topic, highlights }, index) =>
        `${index + 1}. ${topic}\n${highlights
          .map((highlight) => `   - ${highlight}`)
          .join("\n")}`,
    )
    .join("\n");
  return `\nKonular ve Öne Çıkanlar:\n${topics}`;
}

function renderShell({
  data,
  title,
  eyebrow,
  accent,
  sections,
}: {
  data: MeetingSummaryData;
  title: string;
  eyebrow: string;
  accent: string;
  sections: string;
}): string {
  return `
<div style="background:#eef1f6;padding:40px 16px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.08);">
          <tr>
            <td style="background:#0f172a;padding:32px;border-bottom:3px solid ${accent};">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8;">${escapeHtml(eyebrow)}</p>
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#f8fafc;">${escapeHtml(title)}</h1>
              ${
                data.meetingDate
                  ? `<p style="margin:8px 0 0;color:#cbd5e1;font-size:13px;">${escapeHtml(data.meetingDate)}</p>`
                  : ""
              }
            </td>
          </tr>
          ${sections}
          <tr>
            <td style="padding:18px 32px 24px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">Bu özet otomatik olarak oluşturulmuştur. Toplantı transkriptleri ve LLM değerlendirmesi ektedir.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</div>`;
}

function meetingTitle(data: MeetingSummaryData): {
  title: string;
  subject: string;
} {
  const title = data.meetingName
    ? `${data.meetingName} - Toplantı Özeti`
    : "Toplantı Özeti";
  return {
    title,
    subject: data.meetingDate ? `${title} (${data.meetingDate})` : title,
  };
}

/**
 * Variant A: summary and highlights, written from the full transcript alone.
 * No next steps - that section belongs to variant B.
 */
export function renderMeetingSummaryA(data: MeetingSummaryData): {
  subject: string;
  text: string;
  html: string;
} {
  const { title, subject } = meetingTitle(data);
  const accent = "#334155";

  const text = [
    subject,
    "",
    data.summary ?? "",
    textBlock("Katılımcılar", data.attendees),
    textHighlightsBlock(data.highlights),
  ]
    .filter(Boolean)
    .join("\n");

  const html = renderShell({
    data,
    title,
    eyebrow: "Toplantı Özeti",
    accent,
    sections: `
          ${renderAttendeesSection(data.attendees)}
          ${renderSummarySection(data.summary)}
          ${renderHighlightsSection(data.highlights, accent)}`,
  });

  return { subject, text, html };
}

/**
 * Variant B: everything variant A has, plus the next steps the meeting left
 * behind, attributed from each speaker's own recording.
 */
export function renderMeetingSummaryB(data: MeetingSummaryData): {
  subject: string;
  text: string;
  html: string;
} {
  const { title, subject } = meetingTitle(data);
  const accent = "#6366f1";

  const text = [
    subject,
    "",
    data.summary ?? "",
    textBlock("Katılımcılar", data.attendees),
    textHighlightsBlock(data.highlights),
    textBlock("Sonraki Adımlar", data.next_steps),
  ]
    .filter(Boolean)
    .join("\n");

  const html = renderShell({
    data,
    title,
    eyebrow: "Toplantı Özeti - Konuşmacı Bazlı",
    accent,
    sections: `
          ${renderAttendeesSection(data.attendees)}
          ${renderSummarySection(data.summary)}
          ${renderHighlightsSection(data.highlights, accent)}
          ${renderNextStepsSection(data.next_steps)}`,
  });

  return { subject, text, html };
}

export const TEMPLATES: Record<
  string,
  (data: MeetingSummaryData) => { subject: string; text: string; html: string }
> = {
  meeting_summary_a: renderMeetingSummaryA,
  meeting_summary_b: renderMeetingSummaryB,
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
        description:
          "Email subject. Required unless 'template' is set (the template supplies its own subject).",
      },
      text: {
        type: "string",
        description:
          "Plain text email body. Required unless 'template' is set (the template supplies its own text body).",
      },
      html: {
        type: "string",
        description:
          "HTML email body (optional, overridden when 'template' is set)",
      },
      template: {
        type: "string",
        description: `Name of a predefined email template to render instead of manually composing text/html. Available: ${Object.keys(
          TEMPLATES,
        ).join(", ")}`,
      },
      data: {
        type: "object",
        description:
          "Structured data to render into the template named by 'template'.",
      },
      attachments: {
        type: "array",
        description:
          "Files to attach. Each item is { filename, path } for a file on disk, or { filename, content } for inline content. Pass the 'attachments' array returned by TELCO:prepare_meeting_attachments through unchanged.",
        items: {
          type: "object",
          properties: {
            filename: {
              type: "string",
              description: "Name shown on the attachment",
            },
            path: {
              type: "string",
              description: "Absolute path of the file to attach",
            },
            content: {
              type: "string",
              description:
                "Inline attachment content (used when 'path' is not given)",
            },
            contentType: { type: "string", description: "Optional MIME type" },
          },
          required: ["filename"],
        },
      },
    },
    required: ["to"],
  },
  handler: async (args: any) => {
    logger.info(
      {
        tool: "GREY:send_email",
        to: args.to,
        subject: args.subject,
        template: args.template,
      },
      "Email send attempt initiated",
    );

    let subject = args.subject;
    let text = args.text;
    let html = args.html;

    const { attachments, missing } = buildAttachments(args.attachments);
    if (missing.length) {
      logger.warn(
        { tool: "GREY:send_email", missing },
        "Skipping attachments whose files do not exist",
      );
    }

    if (args.template) {
      const render = TEMPLATES[args.template];
      if (!render) {
        const errorMessage = `Unknown template "${args.template}". Available templates: ${Object.keys(
          TEMPLATES,
        ).join(", ")}`;
        logger.error(
          { tool: "GREY:send_email", template: args.template },
          errorMessage,
        );
        return {
          content: [
            { type: "text", text: JSON.stringify({ error: errorMessage }) },
          ],
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
      const requireTLS =
        !secure && !ignoreTLS && process.env.SMTP_REQUIRE_TLS !== "false";

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
        attachments: attachments.length ? attachments : undefined,
      });

      logger.info(
        {
          tool: "GREY:send_email",
          action: "send",
          to: args.to,
          subject,
          messageId: info.messageId,
          attachments: attachments.map((a) => a.filename),
        },
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
              attachments: attachments.map((a) => a.filename),
              missingAttachments: missing.length ? missing : undefined,
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
