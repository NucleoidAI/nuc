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

function renderListSection(title: string, items: string[]): string {
  if (!items.length) return "";
  const rows = items
    .map(
      (item) =>
        `<li style="margin-bottom:8px;color:#334155;line-height:1.5;">${escapeHtml(
          item,
        )}</li>`,
    )
    .join("");
  return `
    <tr>
      <td style="padding:0 32px 24px;">
        <h2 style="margin:0 0 12px;font-size:16px;color:#0f172a;">${title}</h2>
        <ul style="margin:0;padding-left:20px;">${rows}</ul>
      </td>
    </tr>`;
}

function renderMeetingSummary(data: MeetingSummaryData): {
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
  const actionItems = data.action_items ?? [];
  const speakerHighlights = data.speaker_highlights ?? [];

  const actionItemLines = actionItems.map(
    (item) => `${item.owner ?? item.owner_id ?? "-"}: ${item.task}`,
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
<div style="background:#f1f5f9;padding:32px 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:#0f172a;padding:24px 32px;">
              <h1 style="margin:0;font-size:20px;color:#ffffff;">${escapeHtml(
                title,
              )}</h1>
              ${
                data.meetingDate
                  ? `<p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">${escapeHtml(
                      data.meetingDate,
                    )}</p>`
                  : ""
              }
            </td>
          </tr>
          ${
            data.summary
              ? `<tr>
            <td style="padding:24px 32px 8px;">
              <p style="margin:0;color:#334155;line-height:1.6;font-size:14px;">${escapeHtml(
                data.summary,
              )}</p>
            </td>
          </tr>`
              : ""
          }
          ${renderListSection("Konular", keyTopics)}
          ${renderListSection("Kararlar", decisions)}
          ${renderListSection("Aksiyon Maddeleri", actionItemLines)}
          ${renderListSection("Konuşmacı Özetleri", speakerHighlightLines)}
          <tr>
            <td style="padding:16px 32px 24px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">Bu özet otomatik olarak oluşturulmuştur.</p>
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

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "halilibrahimcengel7@gmail.com",
          pass: "xncn gssx cjas mnxy",
          //user: process.env.GMAIL_USER,
          //pass: process.env.GMAIL_APP_PASSWORD,
        },
      });

      logger.debug("Sending email via SMTP");

      const info = await transporter.sendMail({
        from: "halilibrahimcengel7@gmail.com",
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
