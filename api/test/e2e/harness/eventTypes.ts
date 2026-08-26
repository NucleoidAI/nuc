/** Types of the platform events the suite listens for on the bus. */

type SupervisingAnswered = {
  sessionId: string;
  agentId: string;
  question: string;
  answer: string;
  type: "KNOWLEDGE" | "BLUEPRINT";
  taskId: string;
};

type TaskCreated = {
  taskId: string;
  agentId: string;
  description: string;
  blueprintId?: string;
  sessionId?: string;
};

type TaskCompleted = { taskId: string; result?: string; comment?: string };

type StepAdded = {
  stepId: string;
  taskId: string;
  action: string;
  parameters: Record<string, unknown>;
  comment?: string;
};

type StepSettled = {
  stepId: string;
  taskId: string;
  action: string;
  result?: string;
};

type SupervisingRaised = {
  taskId?: string;
  agentId: string;
  sessionId: string;
  question: string;
  blueprintId?: string;
  conversationId?: string;
};

type StepSupervisedNeeded = {
  taskId?: string;
  agentId: string;
  sessionId: string;
  question: string;
};

export type {
  StepAdded,
  StepSettled,
  StepSupervisedNeeded,
  SupervisingAnswered,
  SupervisingRaised,
  TaskCompleted,
  TaskCreated,
};
