//AI-generated
import express from "express";
import { createSession } from "../api/createSession";
import { createServiceToken } from "./token";
import { findSessionId, forgetConversation, rememberSession } from "./store";
import { getBlueprint } from "../api/getBlueprint";
import { getChannels } from "../api/getChannels";
import { sendMessageToSession } from "../api/sendMessageSession";
import { whatsappConfig } from "./config";

const router = express.Router();

type InboundMessage = {
  waId: string;
  profileName: string;
  phoneNumberId: string;
  displayPhoneNumber: string;
  text: string;
};

type CloudApiPayload = {
  entry?: {
    changes?: {
      field?: string;
      value?: {
        metadata?: { display_phone_number?: string; phone_number_id?: string };
        contacts?: { profile?: { name?: string }; wa_id?: string }[];
        messages?: {
          from?: string;
          type?: string;
          text?: { body?: string };
        }[];
      };
    }[];
  }[];
};

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function extractMessages({
  payload,
}: {
  payload: CloudApiPayload;
}): InboundMessage[] {
  const changes = (payload.entry ?? []).flatMap((entry) => entry.changes ?? []);

  return changes.flatMap((change) => {
    const value = change.value;

    if (!value) {
      return [];
    }

    const phoneNumberId = value.metadata?.phone_number_id ?? "";
    const displayPhoneNumber = value.metadata?.display_phone_number ?? "";

    return (value.messages ?? []).flatMap((message) => {
      const text = message.text?.body?.trim() ?? "";
      const waId = message.from ?? "";

      if (message.type !== "text" || !text || !waId) {
        return [];
      }

      const contact = (value.contacts ?? []).find(
        (entry) => entry.wa_id === waId,
      );

      return [
        {
          waId,
          profileName: contact?.profile?.name ?? "",
          phoneNumberId,
          displayPhoneNumber,
          text,
        },
      ];
    });
  });
}

async function resolveBlueprintId({
  accessToken,
  message,
}: {
  accessToken: string;
  message: InboundMessage;
}): Promise<string> {
  const channels = await getChannels(accessToken);
  const codes = [message.phoneNumberId, onlyDigits(message.displayPhoneNumber)];

  const match = channels.find(
    (channel) =>
      channel.channelType === "WHATSAPP" &&
      codes.includes(
        onlyDigits(channel.channelCode) || channel.channelCode,
      ),
  );

  if (match) {
    return match.blueprintId;
  }

  const { fallbackBlueprintId } = whatsappConfig();

  if (!fallbackBlueprintId) {
    throw new Error(
      `No WHATSAPP channel is registered for channel code "${message.phoneNumberId}"`,
    );
  }

  return fallbackBlueprintId;
}

async function openSession({
  accessToken,
  projectId,
  message,
}: {
  accessToken: string;
  projectId: string;
  message: InboundMessage;
}): Promise<string> {
  const blueprintId = await resolveBlueprintId({ accessToken, message });
  const blueprint = await getBlueprint(accessToken, blueprintId);

  const session = await createSession(
    accessToken,
    blueprint.agentId,
    blueprintId,
    {
      channel: "WHATSAPP",
      from: message.waId,
      name: message.profileName,
      phoneNumberId: message.phoneNumberId,
    },
  );

  if (session.agentId !== blueprint.agentId) {
    console.warn("WhatsApp session opened with an unexpected agent", {
      sessionId: session.id,
      expected: blueprint.agentId,
      actual: session.agentId,
    });
  }

  rememberSession({
    conversation: {
      projectId,
      waId: message.waId,
      phoneNumberId: message.phoneNumberId,
    },
    sessionId: session.id,
  });

  return session.id;
}

async function handleInbound({
  projectId,
  message,
}: {
  projectId: string;
  message: InboundMessage;
}): Promise<void> {
  const accessToken = createServiceToken({ projectId });
  const conversation = {
    projectId,
    waId: message.waId,
    phoneNumberId: message.phoneNumberId,
  };

  const sessionId =
    findSessionId({ conversation }) ??
    (await openSession({ accessToken, projectId, message }));

  await sendMessageToSession(sessionId, accessToken, message.text);
}

router.use(express.json());

router.get("/:projectId", (req, res) => {
  const { verifyToken } = whatsappConfig();
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (!verifyToken || mode !== "subscribe" || token !== verifyToken) {
    return res.sendStatus(403);
  }

  res.setHeader("Content-Type", "text/plain");
  return res.status(200).send(String(challenge ?? ""));
});

router.delete("/:projectId/conversations/:waId", (req, res) => {
  const { projectId, waId } = req.params;
  const phoneNumberId =
    typeof req.query.phoneNumberId === "string" ? req.query.phoneNumberId : "";

  if (!phoneNumberId) {
    return res
      .status(400)
      .json({ error: "phoneNumberId query parameter is required" });
  }

  const sessionId = forgetConversation({
    conversation: { projectId, waId, phoneNumberId },
  });

  return res.status(200).json({ forgotten: Boolean(sessionId), sessionId });
});

router.post("/:projectId", async (req, res) => {
  const { projectId } = req.params;
  const messages = extractMessages({ payload: req.body });

  const results = await Promise.allSettled(
    messages.map((message) => handleInbound({ projectId, message })),
  );

  results.forEach((result) => {
    if (result.status === "rejected") {
      console.error("WhatsApp inbound message failed", {
        projectId,
        reason: result.reason,
      });
    }
  });

  return res.status(200).json({ received: messages.length });
});

export default router;
export { extractMessages };
export type { CloudApiPayload, InboundMessage };
