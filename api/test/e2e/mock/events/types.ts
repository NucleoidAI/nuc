type SessionUserMessaged = {
  agentId: string;
  sessionId: string;
  content: string;
};

type AiAssistantMessaged = {
  sessionId: string;
  content: string;
  blueprintId?: string;
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

type StepSupervisedNeeded = {
  taskId?: string;
  agentId: string;
  sessionId: string;
  question: string;
};

type SupervisingRaised = {
  taskId?: string;
  agentId: string;
  sessionId: string;
  question: string;
  blueprintId?: string;
  conversationId?: string;
};

type SupervisingAnswered = {
  sessionId: string;
  agentId: string;
  question: string;
  answer: string;
  type: "KNOWLEDGE" | "BLUEPRINT";
  taskId: string;
};

type EventMap = {
  SESSION_USER_MESSAGED: SessionUserMessaged;
  AI_ASSISTANT_MESSAGED: AiAssistantMessaged;
  TASK_CREATED: TaskCreated;
  TASK_COMPLETED: TaskCompleted;
  STEP_ADDED: StepAdded;
  STEP_COMPLETED: StepSettled;
  STEP_WAITING_FOR_USER: StepSettled;
  STEP_SUPERVISED_NEEDED: StepSupervisedNeeded;
  SUPERVISING_RAISED: SupervisingRaised;
  SUPERVISING_ANSWERED: SupervisingAnswered;
};

type EventName = keyof EventMap;

type Payload<N extends EventName> = EventMap[N];

export type {
  AiAssistantMessaged,
  EventMap,
  EventName,
  Payload,
  SessionUserMessaged,
  StepAdded,
  StepSettled,
  StepSupervisedNeeded,
  SupervisingAnswered,
  SupervisingRaised,
  TaskCompleted,
  TaskCreated,
};
