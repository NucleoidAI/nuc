import Blueprint from "./train/blueprint.json";
import approval from "./train/approval.json";
import approvalQuestion from "./train/approval-question.json";
import decision from "./train/decision.json";
import blueprintChat from "./train/blueprint-chat.json";
import blueprintChatDecision from "./train/blueprint-chat-decision.json";
import blueprintChatSufficiency from "./train/blueprint-chat-sufficiency.json";
import blueprintChatEvaluation from "./train/blueprint-chat-evaluation.json";
import blueprintChatKnowledge from "./train/blueprint-chat-knowledge.json";
import blueprintDescription from "./train/blueprint-description.json";
import blueprintDiamond from "./train/blueprint-diamond.json";
import blueprintName from "./train/blueprint-name.json";
import blueprintSkill from "./train/blueprint-skill.json";
import chat from "./train/chat.json";
import humanInLoop from "./train/human-in-loop.json";
import knowledgeScore from "./train/knowledge-score.json";
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
    blueprintChatKnowledge: {
      role: "system" as const,
      content: JSON.stringify({
        train: blueprintChatKnowledge,
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
    decision: {
      role: "system" as const,
      content: JSON.stringify({
        train: decision,
      }),
    },
    approval: {
      role: "system" as const,
      content: JSON.stringify({
        train: approval,
      }),
    },
    approvalQuestion: {
      role: "system" as const,
      content: JSON.stringify({
        train: approvalQuestion,
      }),
    },
    switch: {
      role: "system" as const,
      content: JSON.stringify({
        train: switchCase,
      }),
    },
  },
};
