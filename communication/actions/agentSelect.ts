import { account } from "../account";
import { getAgents } from "../api/getAgents";
import storage from "../Storage";

const agentSelect = async ({ body, ack, client }) => {
  await ack();

  const actionId = body.actions[0].action_id;

  let action_id;

  if(actionId === 'learn_agent_select') {
    action_id = 'select_learn_type';
  } else if (actionId === 'task_agent_select') {
    action_id = 'create_task';
  } else if (actionId === 'setup_agent_select') {
    action_id = 'setup_ai_chat';
  } else if (actionId === 'supervising_agent_select') {
    action_id = 'supervising_info';
  }

  await storage.set("selectedTeamId", body.actions[0].selected_option.value);
  console.log(body);

  const { user } = body.message;

  const session = account(user);

  try {
    const agents = await getAgents(session);

    const blocks = [
      {
        type: "actions",
        elements: [
          {
            type: "static_select",
            action_id: action_id,
            placeholder: {
              type: "plain_text",
              text: "Select an agent",
            },
            options: agents.map((agent) => ({
              text: {
                type: "plain_text",
                text: agent.name,
              },
              value: agent.id,
            })),
          },
        ],
      },
    ];

    await client.chat.update({
      channel: body.channel.id,
      ts: body.message.ts,
      metadata: {},
      attachments: [
        {
          color: "#3366cc",
          blocks: blocks,
        },
      ],
    });
  } catch (error) {
    console.error("Error handling agent select action:", error);
  }
};

export { agentSelect };

