import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import logger from "../../../logger/logger.js";
import { Tool } from "./types";
import {
  buildAttachments,
  TEMPLATES,
} from "../../grey/tools/send_email.js";

const WORKER_PATH = path.join(__dirname, "ews_send_worker.cjs");

function describeEwsError(error: any): string {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  const parts: string[] = [];
  if (error.message) parts.push(String(error.message));
  if (error.faultString && error.faultString !== error.message)
    parts.push(String(error.faultString));
  const details = error.errorDetails?.keysToObjs ?? error.errorDetails;
  if (details && Object.keys(details).length) parts.push(JSON.stringify(details));
  if (error.HttpStatusCode) parts.push(`HTTP ${error.HttpStatusCode}`);
  if (error.InnerException?.message)
    parts.push(`inner: ${error.InnerException.message}`);
  if (parts.length) return parts.join(" | ");
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function runEwsWorker(payload: Record<string, any>): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.env.EWS_NODE_BIN || "node", [WORKER_PATH], {
      cwd: path.resolve(path.dirname(WORKER_PATH), "../../.."),
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("error", (error) =>
      reject(new Error(`Cannot start EWS worker: ${error.message}`))
    );
    child.on("close", (code) => {
      let result: any;
      try {
        result = JSON.parse(stdout.trim());
      } catch {
        return reject(
          new Error(
            `EWS worker exited with code ${code}: ${
              stderr.trim() || stdout.trim() || "no output"
            }`
          )
        );
      }
      if (result.ok) return resolve();
      reject(new Error(result.error || "Unknown EWS error"));
    });

    child.stdin.end(JSON.stringify(payload));
  });
}

export const sendEmailEwsTool: Tool<any> = {
  name: "TELCO:send_email_ews",
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
        tool: "TELCO:send_email_ews",
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
        { tool: "TELCO:send_email_ews", missing },
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

      const payload = {
        serviceUrl,
        user,
        pass,
        from: process.env.EWS_FROM,
        version: process.env.EWS_VERSION || "Exchange2013",
        rejectUnauthorized:
          process.env.EWS_TLS_REJECT_UNAUTHORIZED !== "false",
        recipients,
        subject,
        text,
        html,
        attachments: attachments.map((attachment) => ({
          filename: attachment.filename,
          contentType: attachment.contentType,
          base64: attachment.path
            ? fs.readFileSync(attachment.path).toString("base64")
            : Buffer.from(attachment.content ?? "", "utf8").toString("base64"),
        })),
      };

      logger.debug(
        { tool: "TELCO:send_email_ews", to: args.to, mailbox },
        "Sending email via EWS"
      );
      await runEwsWorker(payload);

      logger.info(
        {
          tool: "TELCO:send_email_ews",
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
      const errorMessage = describeEwsError(error);

      logger.error(
        {
          tool: "TELCO:send_email_ews",
          action: "send",
          err: error instanceof Error ? error : new Error(errorMessage),
          detail: errorMessage,
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
