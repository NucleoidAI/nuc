import MarkdownRenderer from "../MarkdownRenderer/MarkdownRenderer";
import { isRefValue } from "../BlueprintFlow/helper";
import { useState } from "react";

import { Box, MenuItem, Stack, TextField, Typography } from "@mui/material";

type InputSchema = {
  type: string;
  description?: string;
  nullable?: boolean;
  enum?: string[];
};

export function getInputError({
  parameters,
  field,
  schema,
}: {
  parameters: Record<string, unknown>;
  field: string;
  schema: InputSchema;
}): string {
  if (!Object.prototype.hasOwnProperty.call(parameters, field)) return "";
  const value = parameters[field];
  if (isRefValue(value)) return "";
  if (value === null && schema.nullable) return "";
  if (schema.enum && !schema.enum.includes(value as string))
    return "Select a valid option.";
  switch (schema.type) {
    case "number":
    case "integer":
      return typeof value === "number" &&
        Number.isFinite(value) &&
        (schema.type !== "integer" || Number.isInteger(value))
        ? ""
        : `Enter a valid ${schema.type}.`;
    case "boolean":
      return typeof value === "boolean" ? "" : "Select true or false.";
    case "object":
      return value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
        ? ""
        : "Enter a valid JSON object.";
    case "array":
      return Array.isArray(value) ? "" : "Enter a valid JSON array.";
    default:
      return typeof value === "string" ? "" : "Enter a text value.";
  }
}

function parseInput(text: string, type: string): unknown {
  if (type === "string") return text;
  try {
    return JSON.parse(text);
  } catch {
    // Preserve incomplete input so validation can explain it without losing edits.
    return text;
  }
}

function defaultValue(type: string): unknown {
  switch (type) {
    case "boolean":
      return false;
    case "number":
    case "integer":
      return 0;
    case "object":
      return {};
    case "array":
      return [];
    default:
      return "";
  }
}

export default function NodeInputValues({
  properties,
  parameters,
  onChange,
  menuZIndexOffset = 3,
}: {
  properties: Record<string, InputSchema>;
  parameters: Record<string, unknown>;
  onChange: (parameters: Record<string, unknown>) => void;
  menuZIndexOffset?: number;
}) {
  const [editingField, setEditingField] = useState<string | null>(null);
  if (!Object.keys(properties).length) return null;
  return (
    <Stack spacing={2} sx={{ mb: 2 }}>
      <Box>
        <Typography variant="subtitle2" fontWeight="bold">
          Input values
        </Typography>
      </Box>
      {Object.entries(properties).map(([field, schema]) => {
        const value = parameters[field];
        const hasValue = Object.prototype.hasOwnProperty.call(
          parameters,
          field
        );
        const isReference = isRefValue(value);
        let mode = hasValue ? "fixed" : "automatic";
        if (isReference) mode = "reference";
        const error = getInputError({ parameters, field, schema });
        return (
          <Stack key={field} spacing={1}>
            <Typography variant="body2">
              <strong>{field}</strong> · {schema.type}
            </Typography>
            <TextField
              select
              SelectProps={{
                MenuProps: {
                  sx: {
                    zIndex: (theme) => theme.zIndex.modal + menuZIndexOffset,
                  },
                },
              }}
              size="small"
              value={mode}
              onChange={(event) => {
                const next = { ...parameters };
                if (event.target.value === "automatic") delete next[field];
                else
                  next[field] = schema.enum?.[0] ?? defaultValue(schema.type);
                onChange(next);
              }}
            >
              <MenuItem value="automatic">Automatic</MenuItem>
              <MenuItem value="fixed">Fixed value</MenuItem>
              {isReference && (
                <MenuItem value="reference">Connected output</MenuItem>
              )}
            </TextField>
            {mode === "fixed" &&
              (Boolean(schema.enum?.length) ||
                schema.type !== "string" ||
                editingField === field ||
                Boolean(error)) && (
                <TextField
                  autoFocus={schema.type === "string"}
                  onBlur={() => setEditingField(null)}
                  size="small"
                  label={`${field} value`}
                  select={
                    schema.type === "boolean" || Boolean(schema.enum?.length)
                  }
                  SelectProps={{
                    MenuProps: {
                      sx: {
                        zIndex: (theme) =>
                          theme.zIndex.modal + menuZIndexOffset,
                      },
                    },
                  }}
                  multiline={
                    !schema.enum?.length &&
                    (schema.type === "string" ||
                      schema.type === "object" ||
                      schema.type === "array")
                  }
                  value={
                    typeof value === "string" ? value : JSON.stringify(value)
                  }
                  error={Boolean(error)}
                  onChange={(event) =>
                    onChange({
                      ...parameters,
                      [field]: parseInput(event.target.value, schema.type),
                    })
                  }
                >
                  {schema.enum?.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                  {schema.type === "boolean" && [
                    <MenuItem key="true" value="true">
                      true
                    </MenuItem>,
                    <MenuItem key="false" value="false">
                      false
                    </MenuItem>,
                  ]}
                </TextField>
              )}
            {mode === "fixed" &&
              schema.type === "string" &&
              !schema.enum?.length &&
              editingField !== field &&
              !error &&
              typeof value === "string" && (
                <Box
                  role="button"
                  tabIndex={0}
                  aria-label={`Edit ${field} value`}
                  title="Click to edit"
                  onClick={(event) => {
                    event.preventDefault();
                    setEditingField(field);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setEditingField(field);
                    }
                  }}
                  sx={{
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 1,
                    p: 1.5,
                    minWidth: 0,
                    minHeight: 56,
                    cursor: "text",
                    "&:hover": { borderColor: "text.primary" },
                    "&:focus-visible": {
                      outline: "2px solid",
                      outlineColor: "primary.main",
                    },
                  }}
                >
                  <MarkdownRenderer
                    sx={{
                      overflowWrap: "anywhere",
                      overflowX: "auto",
                    }}
                  >
                    {value.trim() ? value : "Click to enter a value"}
                  </MarkdownRenderer>
                </Box>
              )}
          </Stack>
        );
      })}
    </Stack>
  );
}
