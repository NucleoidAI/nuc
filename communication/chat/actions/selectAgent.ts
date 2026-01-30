import chat from "../../session";
import storage from "../../Storage";

const selectAgent = async ({ action, ack, body, say }) => {
  await ack();
  const selectedAgentId = action.selected_option.value;
  const userId = body.user.id;

  storage.set("selectedAgentId", selectedAgentId);
  const session = chat.get(userId);
  chat.set(userId, { ...session, agentId: selectedAgentId });

  let messageText = "You can start chatting now.";
  if (session.source === "renew") {
    messageText = "Session is renewed.";
  }

  await say(messageText);
};

export { selectAgent };
