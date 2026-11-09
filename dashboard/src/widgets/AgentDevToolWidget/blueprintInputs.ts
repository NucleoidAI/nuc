import {
  type ApiField,
  type BlueprintMode,
  sampleBody,
} from "../../components/ApiNode/apiNodes";
import type {
  ChatInputErrors,
  ChatInputField,
} from "@canmingir/link/platform/components";

type DevToolBlueprint = {
  id: string;
  mode?: BlueprintMode;
  nodes?: { type: string; properties?: { fields?: ApiField[] } }[] | null;
};

type Issue = { path?: string; message: string };

const SESSION_VARIABLE = /session_variables\.([A-Za-z_$][\w$]*)/g;

function modeOf(blueprint?: DevToolBlueprint): BlueprintMode {
  return blueprint?.mode ?? "CHAT";
}

function startFieldsOf(blueprint?: DevToolBlueprint): ApiField[] {
  return (
    blueprint?.nodes?.find((node) => node.type === "START")?.properties
      ?.fields ?? []
  );
}

function inputFieldsOf(blueprint?: DevToolBlueprint): ChatInputField[] {
  if (modeOf(blueprint) === "CHAT") return [];

  return startFieldsOf(blueprint).map(
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
  if (!blueprint || modeOf(blueprint) === "API") return undefined;

  const fields = startFieldsOf(blueprint);

  if (modeOf(blueprint) === "JSON" && fields.length) {
    return JSON.stringify(sampleBody(fields), null, 2);
  }

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

function errorText(errors: ChatInputErrors | string): string {
  return typeof errors === "string"
    ? errors
    : Object.entries(errors)
        .map(([field, message]) => `${field}: ${message}`)
        .join("; ");
}

export type { DevToolBlueprint };
export { errorText, inputFieldsOf, modeOf, submitError, variablesTemplateOf };
