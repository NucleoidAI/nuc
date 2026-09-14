//AI-generated
import axios from "axios";
import { whatsappConfig } from "./config";

async function sendText({
  phoneNumberId,
  to,
  body,
}: {
  phoneNumberId: string;
  to: string;
  body: string;
}): Promise<void> {
  const { accessToken, graphUrl, apiVersion, timeoutMs } = whatsappConfig();

  if (!accessToken) {
    throw new Error("WHATSAPP_ACCESS_TOKEN environment variable is required");
  }

  await axios.post(
    `${graphUrl}/${apiVersion}/${phoneNumberId}/messages`,
    {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { preview_url: false, body },
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      timeout: timeoutMs,
    },
  );
}

export { sendText };
