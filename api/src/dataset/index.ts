import approval from "./train/approval.json";
import approvalQuestion from "./train/approval-question.json";
import decision from "./train/decision.json";
import blueprintChat from "./train/blueprint-chat.json";
import blueprintChatDecision from "./train/blueprint-chat-decision.json";
import blueprintChatSufficiency from "./train/blueprint-chat-sufficiency.json";
import blueprintChatEvaluation from "./train/blueprint-chat-evaluation.json";
import blueprintChatKnowledge from "./train/blueprint-chat-knowledge.json";
import blueprintDescription from "./train/blueprint-description.json";
import blueprintName from "./train/blueprint-name.json";
import blueprintSkill from "./train/blueprint-skill.json";
import chat from "./train/chat.json";
import humanInLoop from "./train/human-in-loop.json";
import policy from "./policy.json";
import pseudocode from "./train/pseudocode.json";
import switchCase from "./train/switch.json";
import forceTaskDiamondBlocking from "./train/force-task-diamond-blocking.json";
import forceTaskDiamondNonBlocking from "./train/force-task-diamond-non-blocking.json";
import taskDiamondBlocking from "./train/task-diamond-blocking.json";
import taskDiamondNonBlocking from "./train/task-diamond-non-blocking.json";
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
    humanInLoop: {
      role: "system" as const,
      content: JSON.stringify({
        train: humanInLoop.data,
      }),
    },
    pseudocode: {
      role: "system" as const,
      content: JSON.stringify({
        train: pseudocode.data,
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
    blueprintChatDecision: {
      role: "system" as const,
      content: JSON.stringify({
        train: blueprintChatDecision.data,
      }),
    },
    blueprintChatSufficiency: {
      role: "system" as const,
      content: JSON.stringify({
        train: blueprintChatSufficiency.data,
      }),
    },
    blueprintChatEvaluation: {
      role: "system" as const,
      content: JSON.stringify({
        train: blueprintChatEvaluation.data,
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
    decision: {
      role: "system" as const,
      content: JSON.stringify({
        train: decision.data,
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
    switch: {
      role: "system" as const,
      content: JSON.stringify({
        train: switchCase.data,
      }),
    },
  },
};
