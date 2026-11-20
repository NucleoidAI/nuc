import json from "./actions.json";

type Schema = {
  type?: string;
  properties?: Record<string, unknown>;
  required?: string[];
  additionalProperties?: unknown;
};

type Action = {
  action: string;
  label: string;
  description: string;
  lib?: string;
  icon?: string;
  inputSchema?: Schema;
  outputSchema?: Schema;
  approval?: "external";
  run?: (input: {
    context: string;
    parameters: Record<string, unknown>;
    meta: { taskId: string; stepId: string };
  }) => Promise<unknown>;
};

const builtins: Action[] = json;

let current: Action[] = builtins;

function describe(action: Action) {
  const definition = { ...action };
  delete definition.run;
  delete definition.approval;
  return definition;
}

function find(action: string) {
  return current.find((a) => a.action === action);
}

function definitions({ blocking = true }: { blocking?: boolean } = {}) {
  const actions = current.map(describe);

  return blocking
    ? actions
    : actions.filter((a) => a.action !== "PLATFORM:ask_supervisor");
}

function list() {
  return {
    role: "system",
    content: { actions: current.map(describe) },
  } as {
    role: "user" | "system" | "assistant";
    content: object;
  };
}

function isExternalApproval(action: string) {
  return find(action)?.approval === "external";
}

function bind(actions: Action[]) {
  current = actions;
}

function unbind() {
  current = builtins;
}

export type { Action };
export { builtins };
export default {
  find,
  definitions,
  list,
  isExternalApproval,
  bind,
  unbind,
};
