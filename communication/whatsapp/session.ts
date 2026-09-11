import { event } from "@canmingir/link-express/event/client";
import { findConversation, forgetSession } from "./store";
import { sendText } from "./send";

async function deliver({ sessionId, content }: { sessionId: string; content: string }): Promise<void> {
  const conversation = findConversation({ sessionId });

  if (!conversation) {
    return;
  }

  try {
    await sendText({
      phoneNumberId: conversation.phoneNumberId,
      to: conversation.waId,
      body: content,
    });
  } catch (error: unknown) {
    console.error("WhatsApp delivery failed", { sessionId, error });
  }
}

async function setup(): Promise<void> {
  await event.subscribe<{
    sessionId: string;
    content: string;
  }>("AI_ASSISTANT_MESSAGED", async ({ sessionId, content }) => {
    await deliver({ sessionId, content });
  });

  await event.subscribe<{ sessionId: string; message: string }>(
    "ERROR_OCCURRED",
    async ({ sessionId, message }) => {
      await deliver({ sessionId, content: message });
      forgetSession({ sessionId });
    },
  );
}

export default { setup };
