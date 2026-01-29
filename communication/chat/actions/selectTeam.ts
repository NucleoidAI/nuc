import {account} from "../../account";
import chat from "../../session";
import { getAgents } from "../../api/getAgents";
import storage from "../../Storage";

const selectTeam = async ({ action, ack, say, body }) => {
  await ack();
  const selectedTeamId = action.selected_option.value;
  const userId = body.user.id;

  storage.set("selectedTeamId", selectedTeamId);
  const session = chat.get(userId);
  chat.set(userId, { ...session, teamId: selectedTeamId });

  const sessions = account(body.message.user);

  const agents = await getAgents(sessions);

  const agentOptions = agents.map((agent) => ({
    text: {
      type: "plain_text",
      text: agent.name,
      emoji: true,
    },
    value: agent.id,
  }));

  await say({
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "✨ *Please select an agent:*",
        },
      },
      {
        type: "actions",
        block_id: "agent_selection",
        elements: [
          {
            type: "static_select",
            placeholder: {
              type: "plain_text",
              text: "Select an agent",
              emoji: true,
            },
            action_id: "agent_selected",
            options: agentOptions,
          },
        ],
      },
    ],
  });
};

export {
  selectTeam
};
