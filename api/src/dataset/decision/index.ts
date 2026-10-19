import actions from "./action.json";
import inputs from "./inputs.json";
import parameters from "./parameter.json";

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

type ActionFewShot = {
  id: string;
  description: string;
  blueprint: object;
  inherited_steps?: Step[];
  session_variables: object;
  knowledge_base: string[];
  steps: Step[];
};

type InputsFewShot = {
  action: string;
  state: object;
  required_parameters: object[];
  inputs_available: number;
};

type ParameterFewShot = {
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

export type { ActionFewShot, InputsFewShot, ParameterFewShot };

export default {
  actions: (actions as { data: unknown[] }).data as ActionFewShot[],
  inputs: (inputs as { data: unknown[] }).data as InputsFewShot[],
  parameters: (parameters as { data: unknown[] }).data as ParameterFewShot[],
};
