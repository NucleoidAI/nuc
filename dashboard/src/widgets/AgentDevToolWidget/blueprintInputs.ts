import type {
  ChatInputErrors,
  ChatInputField,
} from "@canmingir/link/platform/components";

type ApiField = {
  name: string;
  type: ChatInputField["type"];
  required?: boolean;
  description?: string;
  values?: string[];
};

type DevToolBlueprint = {
  id: string;
  api?: boolean;
  nodes?: { type: string; properties?: { fields?: ApiField[] } }[] | null;
};

type Issue = { path?: string; message: string };

const SESSION_VARIABLE = /session_variables\.([A-Za-z_$][\w$]*)/g;

function inputFieldsOf(blueprint?: DevToolBlueprint): ChatInputField[] {
  if (!blueprint?.api) return [];

  const start = blueprint.nodes?.find((node) => node.type === "START");

  return (start?.properties?.fields ?? []).map(
    ({ name, type, required, description, values }) => ({
      name,
      type,
      required: required !== false,
      description,
      values,
    })
  );
}

function variablesTemplateOf(blueprint?: DevToolBlueprint): string | undefined {
  if (!blueprint || blueprint.api) return undefined;

  const keys = new Set(
    Array.from(
      JSON.stringify(blueprint.nodes ?? []).matchAll(SESSION_VARIABLE),
      ([, key]) => key
    )
  );

  if (!keys.size) return undefined;

  return JSON.stringify(
    Object.fromEntries([...keys].map((key) => [key, ""])),
    null,
    2
  );
}

function issuesToErrors(issues: Issue[]): ChatInputErrors | string {
  const errors: ChatInputErrors = {};
  const general: string[] = [];

  for (const { path, message } of issues) {
    const field = path?.split(/[.[]/, 1)[0];

    if (!field) {
      general.push(message);
      continue;
    }

    const nested = path !== field ? `${path.slice(field.length)}: ` : "";
    errors[field] ??= `${nested}${message}`;
  }

  return Object.keys(errors).length ? errors : general.join("; ");
}

type ExecuteResponse = {
  status?: number;
  data?: { error?: string; message?: string; taskId?: string };
};

function asJsonBlock(value: unknown) {
  return `\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``;
}

function executeFailure(error: unknown): string | null {
  const response = (error as { response?: ExecuteResponse })?.response;

  if (response?.status === 422) {
    return `Task failed: ${response.data?.message ?? "no details"}`;
  }

  if (response?.status === 504) {
    return "Timed out waiting for the result. The task keeps running; check its logs.";
  }

  return null;
}

function submitError(error: unknown): ChatInputErrors | string {
  const response = (
    error as {
      response?: {
        status?: number;
        data?: { error?: string; issues?: Issue[] };
      };
    }
  )?.response;

  if (response?.data?.issues?.length) {
    return issuesToErrors(response.data.issues);
  }

  if (response?.data?.error) return response.data.error;

  return error instanceof Error ? error.message : "Failed to start the task";
}

export type { DevToolBlueprint };
export {
  asJsonBlock,
  executeFailure,
  inputFieldsOf,
  submitError,
  variablesTemplateOf,
};
