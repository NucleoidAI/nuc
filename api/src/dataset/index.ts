import chat from "./train/chat.json";
import humanInLoop from "./train/human-in-loop.json";
import policy from "./policy.json";
import pseudocode from "./train/pseudocode.json";
import taskBluePrint from "./train/task-blue-print.json";
import taskBluePrintChat from "./train/task-blue-print-chat.json";
import taskBluePrintChatEvaluation from "./train/task-blue-print-chat-evaluation.json";
import taskBluePrintDiamond from "./train/task-blue-print-diamond.json";
import taskBluePrintName from "./train/task-blue-print-name.json";
import taskDiamond from "./train/task-diamond.json";
import teamChat from "./train/team-chat.json";

export default {
  policy: {
    role: "system" as const,
    content: JSON.stringify({ policy }),
  },
  train: {
    taskBluePrint: {
      role: "system" as const,
      content: JSON.stringify({
        train: taskBluePrint,
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
    teamChat: {
      role: "system" as const,
      content: JSON.stringify({
        train: teamChat,
      }),
    },
    taskBluePrintChat: {
      role: "system" as const,
      content: JSON.stringify({
        train: taskBluePrintChat,
      }),
    },
    taskBluePrintChatEvaluation: {
      role: "system" as const,
      content: JSON.stringify({
        train: taskBluePrintChatEvaluation,
      }),
    },
    taskBluePrintName: {
      role: "system" as const,
      content: JSON.stringify({
        train: taskBluePrintName,
      }),
    },
    taskBluePrintDiamond: {
      role: "system" as const,
      content: JSON.stringify({
        train: taskBluePrintDiamond,
      }),
    },
  },
};
