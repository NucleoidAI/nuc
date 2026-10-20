import approval from "./train/approval.json";
import approvalQuestion from "./train/approval-question.json";
import blueprintChat from "./train/blueprint-chat.json";
import blueprintChatSufficiency from "./train/blueprint-chat-sufficiency.json";
import blueprintChatKnowledge from "./train/blueprint-chat-knowledge.json";
import blueprintDescription from "./train/blueprint-description.json";
import blueprintName from "./train/blueprint-name.json";
import blueprintSkill from "./train/blueprint-skill.json";
import chat from "./train/chat.json";
import policy from "./policy.json";
import forceTaskDiamondBlocking from "./train/force-task-diamond-blocking.json";
import forceTaskDiamondNonBlocking from "./train/force-task-diamond-non-blocking.json";
import teamChat from "./train/team-chat.json";

export default {
  policy: {
    role: "system" as const,
    content: JSON.stringify({ policy: policy.data }),
  },
  train: {
    chat: {
      role: "system" as const,
      content: JSON.stringify({
        train: chat.data,
      }),
    },
    forceTaskDiamondBlocking: {
      role: "system" as const,
      content: JSON.stringify({
        train: forceTaskDiamondBlocking,
      }),
    },
    forceTaskDiamondNonBlocking: {
      role: "system" as const,
      content: JSON.stringify({
        train: forceTaskDiamondNonBlocking,
      }),
    },
    teamChat: {
      role: "system" as const,
      content: JSON.stringify({
        train: teamChat.data,
      }),
    },
    blueprintChat: {
      role: "system" as const,
      content: JSON.stringify({
        train: blueprintChat.data,
      }),
    },
    blueprintChatSufficiency: {
      role: "system" as const,
      content: JSON.stringify({
        train: blueprintChatSufficiency.data,
      }),
    },
    blueprintChatKnowledge: {
      role: "system" as const,
      content: JSON.stringify({
        train: blueprintChatKnowledge.data,
      }),
    },
    blueprintName: {
      role: "system" as const,
      content: JSON.stringify({
        train: blueprintName.data,
      }),
    },
    blueprintDescription: {
      role: "system" as const,
      content: JSON.stringify({
        train: blueprintDescription.data,
      }),
    },
    blueprintSkill: {
      role: "system" as const,
      content: JSON.stringify({
        train: blueprintSkill.data,
      }),
    },
    approval: {
      role: "system" as const,
      content: JSON.stringify({
        train: approval.data,
      }),
    },
    approvalQuestion: {
      role: "system" as const,
      content: JSON.stringify({
        train: approvalQuestion.data,
      }),
    },
  },
};
