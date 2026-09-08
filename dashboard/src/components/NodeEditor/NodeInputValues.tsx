import { isRefValue } from "../BlueprintFlow/helper";
import { Box, MenuItem, Stack, TextField, Typography } from "@mui/material";

type InputSchema = { type: string; description?: string; nullable?: boolean };

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
}: {
  properties: Record<string, InputSchema>;
  parameters: Record<string, unknown>;
  onChange: (parameters: Record<string, unknown>) => void;
}) {
  if (!Object.keys(properties).length) return null;
  return (
    <Stack spacing={2} sx={{ mb: 2 }}>
      <Box>
        <Typography variant="subtitle2" fontWeight="bold">
          Input values
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Fixed values are saved in the blueprint and used every time this node
          runs.
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
                  sx: { zIndex: (theme) => theme.zIndex.modal + 3 },
                },
              }}
              size="small"
              label={`${field} source`}
              value={mode}
              onChange={(event) => {
                const next = { ...parameters };
                if (event.target.value === "automatic") delete next[field];
                else next[field] = defaultValue(schema.type);
                onChange(next);
              }}
            >
              <MenuItem value="automatic">Automatic</MenuItem>
              <MenuItem value="fixed">Fixed value</MenuItem>
              {isReference && (
                <MenuItem value="reference">Connected output</MenuItem>
              )}
            </TextField>
            {isReference && (
              <Typography variant="caption">{value.$ref}</Typography>
            )}
            {mode === "fixed" && (
              <TextField
                size="small"
                label={`${field} value`}
                select={schema.type === "boolean"}
                SelectProps={{
                  MenuProps: {
                    sx: { zIndex: (theme) => theme.zIndex.modal + 3 },
                  },
                }}
                multiline={schema.type === "object" || schema.type === "array"}
                value={
                  typeof value === "string" ? value : JSON.stringify(value)
                }
                error={Boolean(error)}
                helperText={error || schema.description}
                onChange={(event) =>
                  onChange({
                    ...parameters,
                    [field]: parseInput(event.target.value, schema.type),
                  })
                }
              >
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
          </Stack>
        );
      })}
    </Stack>
  );
}
