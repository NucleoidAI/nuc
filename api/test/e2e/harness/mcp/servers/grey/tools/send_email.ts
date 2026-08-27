import { randomUUID } from "node:crypto";

import { deliver } from "../mailbox";
import { respond } from "../../../protocol";
import type { McpTool } from "../../../protocol";

type Attachment = {
  filename?: string;
  path?: string;
  content?: string;
  contentType?: string;
};

const sendEmail: McpTool = {
  name: "GREY:send_email",
  handler: (args) => {
    if (args.template) {
      return respond(
        {
          error:
            `[e2e] GREY:send_email template rendering is not mocked ` +
            `(asked for "${args.template}"). Extend ` +
            `test/e2e/harness/mcp/servers/grey/tools/send_email.ts.`,
        },
        true
      );
    }

    const from = process.env.SMTP_FROM ?? "e2e@greycollar.test";
    const to = (args.to as string) ?? "";
    const subject = (args.subject as string) ?? "";
    const attachments = ((args.attachments as Attachment[]) ?? [])
      .map(({ filename }) => filename)
      .filter((filename): filename is string => Boolean(filename));

    deliver({
      from,
      to: to ? [to] : [],
      data: [
        `From: ${from}`,
        `To: ${to}`,
        `Subject: ${subject}`,
        "",
        (args.text as string) ?? "",
        (args.html as string) ?? "",
      ].join("\r\n"),
    });

    return respond({
      success: true,
      messageId: `<${randomUUID()}@greycollar.test>`,
      to,
      subject,
      attachments,
    });
  },
};

export default sendEmail;
