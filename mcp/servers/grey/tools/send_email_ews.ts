import fs from "fs";
import { XhrApi } from "@ewsjs/xhr";
import {
  BodyType,
  ConfigurationApi,
  EmailAddress,
  EmailMessage,
  ExchangeService,
  ExchangeVersion,
  MessageBody,
  Uri,
} from "ews-javascript-api";
import logger from "../../../logger/logger.js";
import { Tool } from "../../gdrive/tools/types";
import { buildAttachments, TEMPLATES } from "./send_email.js";

export const sendEmailEwsTool: Tool<any> = {
  name: "GREY:send_email_ews",
  description:
    "Send an email through Exchange Web Services (EWS) using NTLM authentication. Requires EWS_URL, EWS_USER, EWS_PASS, and EWS_MAILBOX environment variables. Accepts the same content, template, and attachment inputs as GREY:send_email.",
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
          "Plain text email body. Required unless 'template' or 'html' is set.",
      },
      html: {
        type: "string",
        description:
          "HTML email body (optional, overridden when 'template' is set)",
      },
      template: {
        type: "string",
        description: `Name of a predefined email template. Available: ${Object.keys(
          TEMPLATES
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
          "Files to attach. Each item is { filename, path } for a file on disk, or { filename, content } for inline UTF-8 content.",
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
                "Inline UTF-8 attachment content (used when 'path' is not given)",
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
        tool: "GREY:send_email_ews",
        to: args.to,
        subject: args.subject,
        template: args.template,
      },
      "EWS email send attempt initiated"
    );

    let subject = args.subject;
    let text = args.text;
    let html = args.html;

    const { attachments, missing } = buildAttachments(args.attachments);
    if (missing.length) {
      logger.warn(
        { tool: "GREY:send_email_ews", missing },
        "Skipping attachments whose files do not exist"
      );
    }

    if (args.template) {
      const render = TEMPLATES[args.template];
      if (!render) {
        const errorMessage = `Unknown template "${
          args.template
        }". Available templates: ${Object.keys(TEMPLATES).join(", ")}`;
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
      const serviceUrl = process.env.EWS_URL;
      const user = process.env.EWS_USER;
      const pass = process.env.EWS_PASS;
      const mailbox = process.env.EWS_MAILBOX;

      if (!serviceUrl) throw new Error("EWS_URL is not set");
      if (!user) throw new Error("EWS_USER is not set");
      if (!pass) throw new Error("EWS_PASS is not set");
      if (!mailbox) throw new Error("EWS_MAILBOX is not set");
      if (!subject)
        throw new Error("subject is required when template is not set");
      if (!text && !html) {
        throw new Error("text or html is required when template is not set");
      }

      const recipients = String(args.to)
        .split(/[;,]/)
        .map((recipient) => recipient.trim())
        .filter(Boolean);
      if (!recipients.length) throw new Error("to must contain a recipient");

      const rejectUnauthorized =
        process.env.EWS_TLS_REJECT_UNAUTHORIZED !== "false";
      const xhr = new XhrApi({ rejectUnauthorized }).useNtlmAuthentication(
        user,
        pass
      );
      ConfigurationApi.ConfigureXHR(xhr);

      const service = new ExchangeService(ExchangeVersion.Exchange2013);
      service.Url = new Uri(serviceUrl);
      service.HttpHeaders.Add("X-AnchorMailbox", mailbox);

      const message = new EmailMessage(service);
      message.From = new EmailAddress(mailbox);
      message.ToRecipients.AddRange(recipients);
      message.Subject = subject;
      message.Body = html
        ? new MessageBody(BodyType.HTML, html)
        : new MessageBody(BodyType.Text, text);

      for (const attachment of attachments) {
        const content = attachment.path
          ? fs.readFileSync(attachment.path).toString("base64")
          : Buffer.from(attachment.content ?? "", "utf8").toString("base64");
        const ewsAttachment = message.Attachments.AddFileAttachment(
          attachment.filename,
          content
        );
        if (attachment.contentType) {
          ewsAttachment.ContentType = attachment.contentType;
        }
      }

      logger.debug(
        { tool: "GREY:send_email_ews", to: args.to, mailbox },
        "Sending email via EWS"
      );
      await message.SendAndSaveCopy();

      logger.info(
        {
          tool: "GREY:send_email_ews",
          action: "send",
          to: args.to,
          subject,
          mailbox,
          attachments: attachments.map((attachment) => attachment.filename),
        },
        "EWS email sent successfully"
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              transport: "ews-ntlm",
              mailbox,
              to: args.to,
              subject,
              attachments: attachments.map((attachment) => attachment.filename),
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
          tool: "GREY:send_email_ews",
          action: "send",
          err: error instanceof Error ? error : new Error(errorMessage),
          to: args.to,
          subject,
        },
        "EWS email send failed"
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: errorMessage,
              hint: "Make sure EWS environment variables are set: EWS_URL, EWS_USER, EWS_PASS, EWS_MAILBOX",
            }),
          },
        ],
        isError: true,
      };
    }
  },
};
