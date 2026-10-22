import approvalQuestion from "./approval-question.json";
import blueprintChat from "./blueprint-chat.json";
import blueprintChatSufficiency from "./blueprint-chat-sufficiency.json";
import blueprintChatKnowledge from "./blueprint-chat-knowledge.json";
import blueprintDescription from "./blueprint-description.json";
import blueprintName from "./blueprint-name.json";
import blueprintSkill from "./blueprint-skill.json";
import policy from "./policy.json";
import forceTaskDiamondBlocking from "./force-task-diamond-blocking.json";
import forceTaskDiamondNonBlocking from "./force-task-diamond-non-blocking.json";
import teamChat from "./team-chat.json";

export default {
  policy: {
    role: "system" as const,
    content: JSON.stringify({ policy: policy.data }),
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
  approvalQuestion: {
    role: "system" as const,
    content: JSON.stringify({
      train: approvalQuestion.data,
    }),
  },
};
