import Blueprint from "./train/blueprint.json";
import blueprintChat from "./train/blueprint-chat.json";
import blueprintChatEvaluation from "./train/blueprint-chat-evaluation.json";
import blueprintDescription from "./train/blueprint-description.json";
import blueprintDiamond from "./train/blueprint-diamond.json";
import blueprintName from "./train/blueprint-name.json";
import blueprintSkill from "./train/blueprint-skill.json";
import chat from "./train/chat.json";
import humanInLoop from "./train/human-in-loop.json";
import knowledgeScore from "./train/knowledge-score.json";
import policy from "./policy.json";
import pseudocode from "./train/pseudocode.json";
import taskDiamond from "./train/task-diamond.json";
import taskDiamondNonBlocking from "./train/task-diamond-non-blocking.json";
import teamChat from "./train/team-chat.json";

export default {
  policy: {
    role: "system" as const,
    content: JSON.stringify({ policy }),
  },
  train: {
    Blueprint: {
      role: "system" as const,
      content: JSON.stringify({
        train: Blueprint,
      }),
    },
    chat: {
      role: "system" as const,
      content: JSON.stringify({
        train: chat,
      }),
    },
    humanInLoop: {
      role: "system" as const,
      content: JSON.stringify({
        train: humanInLoop,
      }),
    },
    pseudocode: {
      role: "system" as const,
      content: JSON.stringify({
        train: pseudocode,
      }),
    },
    taskDiamond: {
      role: "system" as const,
      content: JSON.stringify({
        train: taskDiamond,
      }),
    },
    taskDiamondNonBlocking: {
      role: "system" as const,
      content: JSON.stringify({
        train: taskDiamondNonBlocking,
      }),
    },
    teamChat: {
      role: "system" as const,
      content: JSON.stringify({
        train: teamChat,
      }),
    },
    blueprintChat: {
      role: "system" as const,
      content: JSON.stringify({
        train: blueprintChat,
      }),
    },
    blueprintChatEvaluation: {
      role: "system" as const,
      content: JSON.stringify({
        train: blueprintChatEvaluation,
      }),
    },
    blueprintName: {
      role: "system" as const,
      content: JSON.stringify({
        train: blueprintName,
      }),
    },
    blueprintDescription: {
      role: "system" as const,
      content: JSON.stringify({
        train: blueprintDescription,
      }),
    },
    blueprintSkill: {
      role: "system" as const,
      content: JSON.stringify({
        train: blueprintSkill,
      }),
    },
    blueprintDiamond: {
      role: "system" as const,
      content: JSON.stringify({
        train: blueprintDiamond,
      }),
    },
    knowledgeScore: {
      role: "system" as const,
      content: JSON.stringify({
        train: knowledgeScore,
      }),
    },
  },
};
