import actionDiamond from "./action_diamond.json";
import inputsAvailable from "./inputs_available.json";
import parameterDiamond from "./parameter_diamond.json";
import supervisingChatDecision from "./supervising_chat_decision.json";
import supervisingChatSufficiency from "./supervising_chat_sufficiency.json";

type Escalation = {
  action: string;
  required_parameters: string[];
  missing_parameters: string[];
  inputs_available: number;
};

type Step = {
  action: string;
  status?: string;
  parameters?: Record<string, unknown>;
  result?: unknown;
  escalated_from?: Escalation;
};

type ActionDiamondFewShot = {
  id: string;
  description: string;
  blueprint: object;
  inherited_steps?: Step[];
  session_variables: object;
  knowledge_base: string[];
  steps: Step[];
};

type InputsAvailableFewShot = {
  action: string;
  state: object;
  required_parameters: object[];
  inputs_available: number;
};

type ParameterDiamondFewShot = {
  action: string;
  parameter: {
    name: string;
    type?: string;
    description?: string;
    required?: boolean;
  };
  state: object;
  options?: Record<string, unknown> | string[];
  answer: string | number;
};

type SupervisingChatDecisionFewShot = {
  state: object;
  decision: "KNOWLEDGE" | "BLUEPRINT";
};

type SupervisingChatSufficiencyFewShot = {
  state: object;
  sufficient: number;
};

export type {
  ActionDiamondFewShot,
  InputsAvailableFewShot,
  ParameterDiamondFewShot,
  SupervisingChatDecisionFewShot,
  SupervisingChatSufficiencyFewShot,
};

export default {
  actionDiamond: (actionDiamond as { data: unknown[] })
    .data as ActionDiamondFewShot[],
  parameterDiamond: (parameterDiamond as { data: unknown[] })
    .data as ParameterDiamondFewShot[],
  inputsAvailable: (inputsAvailable as { data: unknown[] })
    .data as InputsAvailableFewShot[],
  supervisingChatDecision: (supervisingChatDecision as { data: unknown[] })
    .data as SupervisingChatDecisionFewShot[],
  supervisingChatSufficiency: (
    supervisingChatSufficiency as { data: unknown[] }
  ).data as SupervisingChatSufficiencyFewShot[],
};
