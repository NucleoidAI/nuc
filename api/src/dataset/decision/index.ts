import { type Source, load } from "../storage";

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

type CustomerApprovalFewShot = {
  state: object;
  decision: "APPROVED" | "REJECTED" | "UNCLEAR";
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
  CustomerApprovalFewShot,
  InputsAvailableFewShot,
  ParameterDiamondFewShot,
  SupervisingChatDecisionFewShot,
  SupervisingChatSufficiencyFewShot,
};

export default {
  actionDiamond: load(
    "decision-action-diamond",
  ) as Source<ActionDiamondFewShot>,
  parameterDiamond: load(
    "decision-parameter-diamond",
  ) as Source<ParameterDiamondFewShot>,
  inputsAvailable: load(
    "decision-inputs-available",
  ) as Source<InputsAvailableFewShot>,
  customerApproval: load(
    "decision-customer-approval",
  ) as Source<CustomerApprovalFewShot>,
  supervisingChatDecision: load(
    "decision-supervising-chat-decision",
  ) as Source<SupervisingChatDecisionFewShot>,
  supervisingChatSufficiency: load(
    "decision-supervising-chat-sufficiency",
  ) as Source<SupervisingChatSufficiencyFewShot>,
};
