import { z } from "zod";

export type ApiType =
  | {
      type: "string";
      minLength?: number;
      maxLength?: number;
      pattern?: string;
      format?: "email" | "url" | "uuid" | "datetime";
    }
  | { type: "number"; min?: number; max?: number; integer?: boolean }
  | { type: "boolean" }
  | { type: "enum"; values: string[] }
  | { type: "array"; items: ApiType; minItems?: number; maxItems?: number }
  | { type: "object"; fields: ApiField[] };

export type ApiField = ApiType & {
  name: string;
  description?: string;
  required?: boolean;
};

export const DEFAULT_API_TIMEOUT_SECONDS = 60;

export const ApiTimeout = z.number().int().min(1).max(300);

const size = z.number().int().min(0).max(1_000_000);

function isRegex(pattern: string) {
  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
}

function checkBounds(
  value: { type: string } & Record<string, unknown>,
  ctx: z.RefinementCtx
) {
  const pairs: Record<string, [string, string]> = {
    string: ["minLength", "maxLength"],
    number: ["min", "max"],
    array: ["minItems", "maxItems"],
  };
  const pair = pairs[value.type];
  if (!pair) return;

  const [lower, upper] = pair;
  const low = value[lower];
  const high = value[upper];

  if (typeof low === "number" && typeof high === "number" && low > high) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [lower],
      message: `${lower} must not be greater than ${upper}`,
    });
  }
}

export const ApiTypeSchema: z.ZodType<ApiType> = z.lazy(() =>
  z
    .discriminatedUnion("type", [
      z.object({
        type: z.literal("string"),
        minLength: size.optional(),
        maxLength: size.optional(),
        pattern: z
          .string()
          .max(500)
          .refine(isRegex, "pattern must be a valid regular expression")
          .optional(),
        format: z.enum(["email", "url", "uuid", "datetime"]).optional(),
      }),
      z.object({
        type: z.literal("number"),
        min: z.number().optional(),
        max: z.number().optional(),
        integer: z.boolean().optional(),
      }),
      z.object({ type: z.literal("boolean") }),
      z.object({
        type: z.literal("enum"),
        values: z
          .array(z.string().min(1).max(200))
          .min(1)
          .max(200)
          .refine(
            (values) => new Set(values).size === values.length,
            "enum values must be unique"
          ),
      }),
      z.object({
        type: z.literal("array"),
        items: ApiTypeSchema,
        minItems: size.optional(),
        maxItems: size.optional(),
      }),
      z.object({
        type: z.literal("object"),
        fields: ApiFieldsSchema,
      }),
    ])
    .superRefine(checkBounds)
) as z.ZodType<ApiType>;

export const ApiFieldSchema: z.ZodType<ApiField> = z.lazy(() =>
  z.intersection(
    ApiTypeSchema,
    z.object({
      name: z
        .string()
        .min(1)
        .max(64)
        .regex(
          /^[A-Za-z_][A-Za-z0-9_]*$/,
          "name must start with a letter or underscore and contain only letters, digits and underscores"
        ),
      description: z.string().max(1000).optional(),
      required: z.boolean().optional(),
    })
  )
) as z.ZodType<ApiField>;

export const ApiFieldsSchema: z.ZodType<ApiField[]> = z.lazy(() =>
  z
    .array(ApiFieldSchema)
    .max(200)
    .refine(
      (fields) => new Set(fields.map((f) => f.name)).size === fields.length,
      "field names must be unique"
    )
);
