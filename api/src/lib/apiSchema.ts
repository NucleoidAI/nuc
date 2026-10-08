import type { ApiField, ApiType } from "../schemas/ApiField";
import { z } from "zod";

export type ApiIssue = { path: string; code: string; message: string };

export type ApiValidation =
  | { success: true; data: Record<string, unknown> }
  | { success: false; issues: ApiIssue[] };

function typeSchema(type: ApiType, strict: boolean): z.ZodTypeAny {
  switch (type.type) {
    case "string": {
      let schema = z.string();
      if (type.minLength !== undefined) schema = schema.min(type.minLength);
      if (type.maxLength !== undefined) schema = schema.max(type.maxLength);
      if (type.pattern) schema = schema.regex(new RegExp(type.pattern));
      if (type.format === "email") schema = schema.email();
      if (type.format === "url") schema = schema.url();
      if (type.format === "uuid") schema = schema.uuid();
      if (type.format === "datetime")
        schema = schema.datetime({ offset: true });
      return schema;
    }
    case "number": {
      let schema = z.number();
      if (type.integer) schema = schema.int();
      if (type.min !== undefined) schema = schema.min(type.min);
      if (type.max !== undefined) schema = schema.max(type.max);
      return schema;
    }
    case "boolean":
      return z.boolean();
    case "enum":
      return z.enum(type.values as [string, ...string[]]);
    case "array": {
      let schema = z.array(typeSchema(type.items, strict));
      if (type.minItems !== undefined) schema = schema.min(type.minItems);
      if (type.maxItems !== undefined) schema = schema.max(type.maxItems);
      return schema;
    }
    case "object":
      return objectSchema(type.fields, strict);
  }
}

function objectSchema(fields: ApiField[], strict: boolean) {
  const shape = Object.fromEntries(
    fields.map((field) => {
      const schema = typeSchema(field, strict);
      return [
        field.name,
        field.required === false ? schema.optional() : schema,
      ];
    })
  );
  const object = z.object(shape);

  return strict ? object.strict() : object.strip();
}

function formatIssues(error: z.ZodError): ApiIssue[] {
  return error.issues.map(({ path, code, message }) => ({
    path: path.join("."),
    code,
    message,
  }));
}

function validate(
  fields: ApiField[],
  value: unknown,
  { strict }: { strict: boolean }
): ApiValidation {
  const result = objectSchema(fields, strict).safeParse(value);

  return result.success
    ? { success: true, data: result.data }
    : { success: false, issues: formatIssues(result.error) };
}

export default { validate };
