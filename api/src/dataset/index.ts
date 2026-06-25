import Blueprint from "./train/blueprint.json";
import blueprintChat from "./train/blueprint-chat.json";
import blueprintChatDecision from "./train/blueprint-chat-decision.json";
import blueprintChatSufficiency from "./train/blueprint-chat-sufficiency.json";
import blueprintChatEvaluation from "./train/blueprint-chat-evaluation.json";
import blueprintDescription from "./train/blueprint-description.json";
import blueprintDiamond from "./train/blueprint-diamond.json";
import blueprintName from "./train/blueprint-name.json";
import chat from "./train/chat.json";
import humanInLoop from "./train/human-in-loop.json";
import knowledgeScore from "./train/knowledge-score.json";
import policy from "./policy.json";
import pseudocode from "./train/pseudocode.json";
import taskDiamondBlocking from "./train/task-diamond-blocking.json";
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
    taskDiamondBlocking: {
      role: "system" as const,
      content: JSON.stringify({
        train: taskDiamondBlocking,
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
    blueprintChatDecision: {
      role: "system" as const,
      content: JSON.stringify({
        train: blueprintChatDecision,
      }),
    },
    blueprintChatSufficiency: {
      role: "system" as const,
      content: JSON.stringify({
        train: blueprintChatSufficiency,
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
