import { event } from "@canmingir/link-express/event/client";
import { emailConfig } from "./config";
import { findThread, forgetSession, rememberSession } from "./store";
import { sendReply } from "./send";

async function deliver({
  sessionId,
  content,
}: {
  sessionId: string;
  content: string;
}): Promise<void> {
  const thread = findThread({ sessionId });

  if (!thread || !content?.trim()) {
    return;
  }

  try {
    const messageId = await sendReply({
      to: thread.from,
      subject: thread.subject,
      body: content,
      inReplyTo: thread.lastMessageId,
      references: thread.references,
    });

    await event.publish("EMAIL_SENT", {
      sessionId,
      to: thread.from,
      subject: thread.subject,
      text: content,
      mailbox: thread.mailbox,
    });

    if (messageId) {
      const sent = messageId.replace(/^<|>$/g, "");

      rememberSession({
        thread: {
          ...thread,
          lastMessageId: sent,
          references: [...thread.references, sent],
        },
        sessionId,
      });
    }
  } catch (error: unknown) {
    console.error("Email delivery failed", { sessionId, error });
  }
}

async function setup(): Promise<void> {
  if (!emailConfig().enabled) {
    return;
  }

  await event.subscribe<{ sessionId: string; content: string }>(
    "AI_ASSISTANT_MESSAGED",
    async ({ sessionId, content }) => {
      await deliver({ sessionId, content });
    },
  );

  await event.subscribe<{ sessionId: string; message: string }>(
    "ERROR_OCCURRED",
    async ({ sessionId, message }) => {
      await deliver({ sessionId, content: message });
      forgetSession({ sessionId });
    },
  );
}

export default { setup };
