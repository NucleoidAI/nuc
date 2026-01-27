import Blueprint from "./train/blueprint.json";
import blueprintChat from "./train/blueprint-chat.json";
import blueprintChatEvaluation from "./train/blueprint-chat-evaluation.json";
import blueprintDiamond from "./train/blueprint-diamond.json";
import blueprintName from "./train/blueprint-name.json";
import chat from "./train/chat.json";
import humanInLoop from "./train/human-in-loop.json";
import policy from "./policy.json";
import pseudocode from "./train/pseudocode.json";
import taskDiamond from "./train/task-diamond.json";
import teamChat from "./train/team-chat.json";

export default {
  policy: {
    role: "SYSTEM" as const,
    content: JSON.stringify({ policy }),
  },
  train: {
    Blueprint: {
      role: "SYSTEM" as const,
      content: JSON.stringify({
        train: Blueprint,
      }),
    },
    chat: {
      role: "SYSTEM" as const,
      content: JSON.stringify({
        train: chat,
      }),
    },
    humanInLoop: {
      role: "SYSTEM" as const,
      content: JSON.stringify({
        train: humanInLoop,
      }),
    },
    pseudocode: {
      role: "SYSTEM" as const,
      content: JSON.stringify({
        train: pseudocode,
      }),
    },
    taskDiamond: {
      role: "SYSTEM" as const,
      content: JSON.stringify({
        train: taskDiamond,
      }),
    },
    teamChat: {
      role: "SYSTEM" as const,
      content: JSON.stringify({
        train: teamChat,
      }),
    },
    blueprintChat: {
      role: "SYSTEM" as const,
      content: JSON.stringify({
        train: blueprintChat,
      }),
    },
    blueprintChatEvaluation: {
      role: "SYSTEM" as const,
      content: JSON.stringify({
        train: blueprintChatEvaluation,
      }),
    },
    blueprintName: {
      role: "SYSTEM" as const,
      content: JSON.stringify({
        train: blueprintName,
      }),
    },
    blueprintDiamond: {
      role: "SYSTEM" as const,
      content: JSON.stringify({
        train: blueprintDiamond,
      }),
    },
  },
};
