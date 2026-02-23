import { Tool } from "../../gdrive/tools/types";
import logger from "../../../logger/logger.js";
import nodemailer from "nodemailer";

export const sendEmailTool: Tool<any> = {
  name: "GREY:send_email",
  description:
    "Send a simple email. Requires SMTP configuration via environment variables.",
  inputSchema: {
    type: "object",
    properties: {
      to: {
        type: "string",
        description: "Recipient email address",
      },
      subject: {
        type: "string",
        description: "Email subject",
      },
      text: {
        type: "string",
        description: "Plain text email body",
      },
      html: {
        type: "string",
        description: "HTML email body (optional)",
      },
    },
    required: ["to", "subject", "text"],
  },
  handler: async (args: any) => {
    logger.info(
      { tool: "GREY:send_email", to: args.to, subject: args.subject, hasHtml: !!args.html },
      "Email send attempt initiated"
    );

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
        subject: args.subject,
        text: args.text,
        html: args.html,
      });

      logger.info(
        { tool: "GREY:send_email", action: "send", to: args.to, subject: args.subject, messageId: info.messageId },
        "Email sent successfully"
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              messageId: info.messageId,
              to: args.to,
              subject: args.subject,
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
          subject: args.subject,
        },
        "Email send failed"
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
