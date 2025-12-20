import { Tool } from "../../gdrive/tools/types";
import nodemailer from "nodemailer";
import { logger } from "../../../logger/logger";

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
    // Log the email attempt
    logger.info("Email send attempt initiated", {
      to: args.to,
      subject: args.subject,
      hasHtml: !!args.html,
    });

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

      // Log successful email
      logger.logEmail("send", {
        to: args.to,
        subject: args.subject,
        success: true,
        messageId: info.messageId,
      });

      logger.info("Email sent successfully", {
        messageId: info.messageId,
        to: args.to,
      });

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

      // Log failed email
      logger.logEmail("send", {
        to: args.to,
        subject: args.subject,
        success: false,
        error: errorMessage,
      });

      logger.error("Email send failed", {
        error: errorMessage,
        to: args.to,
        subject: args.subject,
        stack: error instanceof Error ? error.stack : undefined,
      });

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
