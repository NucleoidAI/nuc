import { load } from "../storage";

export default {
  policy: {
    role: "system" as const,
    content: JSON.stringify({ policy: load("llm-policy") }),
  },
  forceTaskDiamondBlocking: {
    role: "system" as const,
    content: JSON.stringify({
      train: { data: load("llm-force-task-diamond-blocking") },
    }),
  },
  forceTaskDiamondNonBlocking: {
    role: "system" as const,
    content: JSON.stringify({
      train: { data: load("llm-force-task-diamond-non-blocking") },
    }),
  },
  teamChat: {
    role: "system" as const,
    content: JSON.stringify({
      train: load("llm-team-chat"),
    }),
  },
  blueprintChat: {
    role: "system" as const,
    content: JSON.stringify({
      train: load("llm-blueprint-chat"),
    }),
  },
  blueprintChatSufficiency: {
    role: "system" as const,
    content: JSON.stringify({
      train: load("llm-blueprint-chat-sufficiency"),
    }),
  },
  blueprintChatKnowledge: {
    role: "system" as const,
    content: JSON.stringify({
      train: load("llm-blueprint-chat-knowledge"),
    }),
  },
  blueprintName: {
    role: "system" as const,
    content: JSON.stringify({
      train: load("llm-blueprint-name"),
    }),
  },
  blueprintDescription: {
    role: "system" as const,
    content: JSON.stringify({
      train: load("llm-blueprint-description"),
    }),
  },
  blueprintSkill: {
    role: "system" as const,
    content: JSON.stringify({
      train: load("llm-blueprint-skill"),
    }),
  },
  approvalQuestion: {
    role: "system" as const,
    content: JSON.stringify({
      train: load("llm-approval-question"),
    }),
  },
};
